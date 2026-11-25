#!/usr/bin/env node
// Telegram notifications for Claude Code hooks.
//
// Config: .claude/telegram.json (gitignored) -> { "token": "...", "chatId": "..." }
//   or env TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID (env wins).
//
// Usage:
//   node .claude/hooks/telegram-notify.mjs stop          (Stop hook, reads hook JSON from stdin)
//   node .claude/hooks/telegram-notify.mjs notification  (Notification hook)
//   node .claude/hooks/telegram-notify.mjs --setup       (write /start to the bot first; saves chatId)
//   node .claude/hooks/telegram-notify.mjs --test        (send a test message)
//
// A hook must never break the session: every error is swallowed and the exit code is always 0.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const configPath = path.join(here, "..", "telegram.json")
const MAX_LEN = 3800 // Telegram limit is 4096 characters
const PROJECT = "password_manager"

function loadConfig() {
	let file = {}
	try {
		file = JSON.parse(fs.readFileSync(configPath, "utf8"))
	} catch {}
	return {
		token: process.env.TELEGRAM_BOT_TOKEN || file.token,
		chatId: process.env.TELEGRAM_CHAT_ID || file.chatId,
		file,
	}
}

async function api(token, method, body) {
	const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body ?? {}),
		signal: AbortSignal.timeout(10000),
	})
	const json = await res.json()
	if (!json.ok) throw new Error(`${method}: ${json.description}`)
	return json.result
}

async function send(text) {
	const { token, chatId } = loadConfig()
	if (!token || !chatId) return false
	if (text.length > MAX_LEN) text = text.slice(0, MAX_LEN) + "\n…(обрезано)"
	await api(token, "sendMessage", {
		chat_id: chatId,
		text,
		disable_web_page_preview: true,
	})
	return true
}

function readStdin() {
	return new Promise(resolve => {
		if (process.stdin.isTTY) return resolve("")
		let data = ""
		process.stdin.setEncoding("utf8")
		process.stdin.on("data", c => (data += c))
		process.stdin.on("end", () => resolve(data))
		setTimeout(() => resolve(data), 3000)
	})
}

// Text of the assistant's messages since the last real user prompt.
function lastAssistantText(transcriptPath) {
	let lines
	try {
		lines = fs.readFileSync(transcriptPath, "utf8").split("\n").filter(Boolean)
	} catch {
		return ""
	}
	const parts = []
	for (let i = lines.length - 1; i >= 0; i--) {
		let entry
		try {
			entry = JSON.parse(lines[i])
		} catch {
			continue
		}
		const content = entry.message?.content
		if (entry.type === "user") {
			const isToolResult = Array.isArray(content) && content.some(c => c.type === "tool_result")
			if (!isToolResult && !entry.isMeta) break
			continue
		}
		if (entry.type === "assistant" && Array.isArray(content)) {
			const text = content
				.filter(c => c.type === "text")
				.map(c => c.text)
				.join("\n")
				.trim()
			if (text) parts.unshift(text)
		}
	}
	return parts.join("\n\n")
}

async function main() {
	const mode = process.argv[2]

	if (mode === "--setup") {
		const { token, file } = loadConfig()
		if (!token) {
			console.log(`Сначала впишите токен в ${configPath}: {"token": "123:ABC"}`)
			return
		}
		const updates = await api(token, "getUpdates", {})
		const chat = updates.reverse().find(u => u.message?.chat)?.message.chat
		if (!chat) {
			console.log("Нет сообщений. Напишите боту /start в Telegram и повторите --setup.")
			return
		}
		fs.writeFileSync(
			configPath,
			JSON.stringify({ ...file, token, chatId: String(chat.id) }, null, 2),
		)
		console.log(`Сохранён chatId ${chat.id} (${chat.username || chat.first_name || chat.title}).`)
		return
	}

	if (mode === "--test") {
		const ok = await send(`✅ [${PROJECT}] Тест уведомлений Claude Code`)
		console.log(ok ? "Отправлено." : "Нет token/chatId в конфиге.")
		return
	}

	const raw = await readStdin()
	let input = {}
	try {
		input = JSON.parse(raw)
	} catch {}

	if (mode === "notification") {
		await send(`🔔 [${PROJECT}] ${input.message || "Claude ждёт вашего ответа"}`)
		return
	}

	if (mode === "stop") {
		if (input.stop_hook_active) return
		const text =
			(typeof input.last_assistant_message === "string" && input.last_assistant_message.trim()) ||
			lastAssistantText(input.transcript_path)
		await send(`🤖 [${PROJECT}]\n\n${text || "Claude закончил работу."}`)
	}
}

main()
	.catch(err => {
		if (process.argv[2]?.startsWith("--")) console.error(err.message)
	})
	.finally(() => process.exit(0))
