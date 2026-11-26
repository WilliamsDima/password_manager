#!/usr/bin/env node
// Copies every local secret into the gitignored secrets/ folder, so that one folder can be
// saved (encrypted archive, password manager, offline drive). Run again after any secret changes.
//
//   npm run secrets:collect
//
// Prints only file names and status, never contents. Missing sources are skipped, so the same
// script works on every machine. Copies are the source of truth for restoring on a new machine:
// put each file back where "from" points (see "Secrets" in CLAUDE.md).

import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const home = os.homedir()
const target = path.join(root, "secrets")

// from: where the app/tooling expects the file; to: its place inside secrets/.
const SECRETS = [
	{ from: path.join(root, "google-services.json"), to: "firebase/google-services.json" },
	{ from: path.join(root, "legacy/src/config/firebase.ts"), to: "firebase/firebase.ts" },
	{
		from: path.join(home, ".android-keys/password-manager/release.jks"),
		to: "android/release.jks",
	},
	{ from: path.join(home, ".gradle/gradle.properties"), to: "android/gradle.properties" },
	{ from: path.join(root, "legacy/Android/app/key.jks"), to: "android/v1-play-key.jks" },
	{ from: path.join(root, "legacy/Android/app/private_key.pepk"), to: "android/private_key.pepk" },
	{ from: path.join(root, ".claude/telegram.json"), to: "claude/telegram.json" },
	{ from: path.join(root, "backups"), to: "backups" },
]

const sameFile = (a, b) =>
	fs.existsSync(b) && fs.statSync(a).isFile() && fs.readFileSync(a).equals(fs.readFileSync(b))

const lock = destination => {
	fs.chmodSync(destination, fs.statSync(destination).isDirectory() ? 0o700 : 0o600)
}

fs.mkdirSync(target, { recursive: true, mode: 0o700 })
lock(target)

const report = SECRETS.map(({ from, to }) => {
	if (!fs.existsSync(from)) {
		return `missing    ${to}`
	}
	const destination = path.join(target, to)
	if (sameFile(from, destination)) {
		return `unchanged  ${to}`
	}
	fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 })
	fs.cpSync(from, destination, { recursive: true, force: true })
	lock(path.dirname(destination))
	if (fs.statSync(destination).isDirectory()) {
		fs.readdirSync(destination, { recursive: true }).forEach(name => {
			lock(path.join(destination, name))
		})
	}
	lock(destination)
	return `copied     ${to}`
})

console.log(report.join("\n"))
console.log(`\nSaved in ${target} (gitignored). Keep a copy outside this machine.`)
