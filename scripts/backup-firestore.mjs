#!/usr/bin/env node
// Backup of my Firestore document users/{uid} (ciphertext only).
//
//   node scripts/backup-firestore.mjs
//
// - Reads apiKey/projectId from legacy/src/config/firebase.ts.
// - Asks for email + password (Firebase Auth REST), downloads users/{uid}.
// - Saves backups/firestore-<uid>-<timestamp>.json (data stays encrypted, as in Firestore).
// - Optionally asks for the encryption key and checks that EVERY item decrypts with it.
//   Decrypted data is never printed or written, only counts are shown.
// No npm dependencies (Node 18+).

import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import readline from "node:readline"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

if (process.argv.includes("--help")) {
	console.log(
		"Usage: node scripts/backup-firestore.mjs\nInteractive: asks email, password, then (optional) encryption key.",
	)
	process.exit(0)
}

function readFirebaseConfig() {
	const src = fs.readFileSync(path.join(root, "legacy/src/config/firebase.ts"), "utf8")
	const get = name => src.match(new RegExp(`["']?${name}["']?\\s*:\\s*["']([^"']+)["']`))?.[1]
	const apiKey = get("apiKey")
	const projectId = get("projectId")
	if (!apiKey || !projectId)
		throw new Error("apiKey/projectId не найдены в legacy/src/config/firebase.ts")
	return { apiKey, projectId }
}

function ask(question, hidden = false) {
	return new Promise(resolve => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
			terminal: true,
		})
		if (hidden) {
			rl._writeToOutput = s => {
				if (s.startsWith(question)) rl.output.write(question)
				else if (s.includes("\n") || s.includes("\r")) rl.output.write("\n")
				else rl.output.write("*")
			}
		}
		rl.question(question, answer => {
			rl.close()
			resolve(answer.trim())
		})
	})
}

async function postJson(url, body) {
	const res = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	})
	const json = await res.json()
	if (!res.ok) throw new Error(json.error?.message || `HTTP ${res.status}`)
	return json
}

// Firestore REST typed value -> plain JS
function fromValue(v) {
	if ("stringValue" in v) return v.stringValue
	if ("integerValue" in v) return Number(v.integerValue)
	if ("doubleValue" in v) return v.doubleValue
	if ("booleanValue" in v) return v.booleanValue
	if ("nullValue" in v) return null
	if ("timestampValue" in v) return v.timestampValue
	if ("mapValue" in v) return fromFields(v.mapValue.fields || {})
	if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromValue)
	return v // referenceValue, geoPointValue, bytesValue: keep raw
}
const fromFields = f => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, fromValue(v)]))

// CryptoJS.AES.decrypt(cipher, passphrase) compatible: OpenSSL "Salted__", EVP_BytesToKey(MD5), AES-256-CBC
function cryptoJsDecrypt(cipherB64, passphrase) {
	const data = Buffer.from(cipherB64, "base64")
	if (data.subarray(0, 8).toString("latin1") !== "Salted__") throw new Error("not salted")
	const salt = data.subarray(8, 16)
	const pass = Buffer.from(passphrase, "utf8")
	let derived = Buffer.alloc(0)
	let block = Buffer.alloc(0)
	while (derived.length < 48) {
		block = crypto
			.createHash("md5")
			.update(Buffer.concat([block, pass, salt]))
			.digest()
		derived = Buffer.concat([derived, block])
	}
	const decipher = crypto.createDecipheriv(
		"aes-256-cbc",
		derived.subarray(0, 32),
		derived.subarray(32, 48),
	)
	return Buffer.concat([decipher.update(data.subarray(16)), decipher.final()]).toString("utf8")
}

function verifyKey(items, key) {
	let ok = 0
	const failed = []
	for (const item of items) {
		try {
			JSON.parse(cryptoJsDecrypt(item.title, key))
			const msg = JSON.parse(cryptoJsDecrypt(item.message, key))
			if (typeof msg !== "object" || msg === null) throw new Error("bad message")
			ok++
		} catch {
			failed.push(item.id)
		}
	}
	return { ok, failed }
}

async function main() {
	const { apiKey, projectId } = readFirebaseConfig()
	const email = await ask("Email: ")
	const password = await ask("Пароль: ", true)

	const authRes = await postJson(
		`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
		{ email, password, returnSecureToken: true },
	)
	const uid = authRes.localId

	const res = await fetch(
		`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`,
		{ headers: { Authorization: `Bearer ${authRes.idToken}` } },
	)
	const raw = await res.json()
	if (!res.ok) throw new Error(`Firestore: ${raw.error?.message || res.status}`)

	const data = fromFields(raw.fields || {})
	const items = Array.isArray(data.items) ? data.items : []

	const dir = path.join(root, "backups")
	fs.mkdirSync(dir, { recursive: true })
	const stamp = new Date().toISOString().replace(/[:.]/g, "-")
	const file = path.join(dir, `firestore-${uid}-${stamp}.json`)
	fs.writeFileSync(
		file,
		JSON.stringify(
			{
				format: "password-manager-firestore-backup/v1",
				exportedAt: new Date().toISOString(),
				projectId,
				path: `users/${uid}`,
				updateTime: raw.updateTime,
				data,
				rawFirestore: raw,
			},
			null,
			2,
		),
	)
	console.log(`\nСохранено: ${file}`)
	console.log(`Записей (items): ${items.length}`)

	const key = await ask("\nКлюч шифрования для проверки (Enter, чтобы пропустить): ", true)
	if (key) {
		const { ok, failed } = verifyKey(items, key)
		console.log(`Расшифровано: ${ok}/${items.length}`)
		if (failed.length) console.log(`НЕ расшифровались (id): ${failed.join(", ")}`)
		else console.log("Ключ подходит ко всем записям ✅")
	}
	console.log("\nСкопируйте файл бэкапа и ключ в надёжное место вне репозитория.")
}

main().catch(err => {
	console.error(`\nОшибка: ${err.message}`)
	if (/API_KEY|referer|android/i.test(err.message))
		console.error(
			"Похоже, API-ключ ограничен Android-приложением. Нужен Web API key из Firebase Console (Project settings → General).",
		)
	process.exit(1)
})
