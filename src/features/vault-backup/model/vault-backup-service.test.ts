import { cbc } from "@noble/ciphers/aes.js"
import { md5 } from "@noble/hashes/legacy.js"
import { concatBytes } from "@noble/hashes/utils.js"

import { EntryCodec, type EntryPayload, LegacyDataError } from "@/entities/entry"
import { VaultKeyService } from "@/entities/session"
import { encodeUtf8, toBase64 } from "@/shared/lib/encoding"
import { NobleCryptoService } from "@/shared/services/crypto"
import { CryptoJsLegacyDecryptor } from "@/shared/services/legacy-decryptor"
import { FakeRandom, FakeRemoteStore } from "@/shared/testing"

import { parseBackupFile } from "../lib/backup-format"
import { BackupVerificationError, VaultBackupService } from "./vault-backup-service"

const UID = "user-1"
const NOW = new Date("2026-11-26T12:34:56.000Z")

const payload = (title: string, password = "pw"): EntryPayload => ({
	title,
	login: `${title}@mail.ru`,
	password,
	notes: "заметка",
	createdAt: 1_700_000_000_000,
	updatedAt: 1_700_000_000_000,
})
const TITLES = ["Почта", "Банк", "Форум"]

const legacyEncrypt = (value: unknown, key: string, seed: number): string => {
	const salt = new Uint8Array(8).fill(seed)
	const pass = encodeUtf8(key)
	const d1 = md5(concatBytes(pass, salt))
	const d2 = md5(concatBytes(d1, pass, salt))
	const d3 = md5(concatBytes(d2, pass, salt))
	const material = concatBytes(d1, d2, d3)
	const body = cbc(material.slice(0, 32), material.slice(32, 48)).encrypt(
		encodeUtf8(JSON.stringify(value)),
	)
	return toBase64(concatBytes(encodeUtf8("Salted__"), salt, body))
}

/** One account with 3 entries, a recovery key and a service. */
const account = (uid = UID, random = new FakeRandom()) => {
	const crypto = new NobleCryptoService(random)
	const vaultKeys = new VaultKeyService(crypto, random)
	const entryCodec = new EntryCodec(crypto)
	const remote = new FakeRemoteStore()
	const rk = vaultKeys.generateRecoveryKey()
	const dek = vaultKeys.generateDek()
	remote.seedProfile({
		uid,
		schemaVersion: 2,
		email: "a@b.c",
		displayName: null,
		crypto: {
			wrappedDek: vaultKeys.wrapDek(rk, dek, uid, 1),
			kdf: "hkdf-sha256",
			rkVersion: 1,
			createdAt: 1,
		},
		legacyItems: undefined,
		migratedAt: null,
	})
	const ids = TITLES.map(title => {
		const id = random.uuid()
		remote.entries.set(id, {
			id,
			ct: entryCodec.encrypt(dek, uid, id, payload(title)),
			updatedAt: 1000,
		})
		return id
	})
	const service = new VaultBackupService(
		remote,
		entryCodec,
		vaultKeys,
		new CryptoJsLegacyDecryptor(),
		random,
		() => NOW,
	)
	return { remote, rk, dek, ids, service, vaultKeys, entryCodec, random, uid }
}

const cryptoOfFile = (json: string): unknown => (JSON.parse(json) as { crypto: unknown }).crypto

const titlesOnServer = (a: ReturnType<typeof account>, dek = a.dek): string[] =>
	[...a.remote.entries.values()].map(e => a.entryCodec.decrypt(dek, a.uid, e.id, e.ct).title).sort()

describe("VaultBackupService: export", () => {
	it("writes the format, crypto and entries; no plaintext; names the file by time", async () => {
		const a = account()

		const backup = await a.service.createBackup(UID, "a@b.c", a.dek)
		const file = JSON.parse(backup.json) as Record<string, unknown>

		expect(backup.count).toBe(3)
		expect(backup.fileName).toBe("password-manager-backup-2026-11-26-12-34.json")
		expect(file).toMatchObject({
			format: "password-manager-backup/v2",
			exportedAt: "2026-11-26T12:34:56.000Z",
			uid: UID,
			email: "a@b.c",
			crypto: { kdf: "hkdf-sha256", rkVersion: 1 },
		})
		expect((file.entries as unknown[]).length).toBe(3)
		for (const title of TITLES) expect(backup.json).not.toContain(title)
		expect(backup.json).not.toContain("заметка")
	})

	it("includes the v1 items while they are still in the profile", async () => {
		const a = account()
		const profile = a.remote.profiles.get(UID)
		if (profile)
			a.remote.seedProfile({ ...profile, legacyItems: [{ id: 1, title: "x", message: "y" }] })

		const file = JSON.parse((await a.service.createBackup(UID, null, a.dek)).json) as Record<
			string,
			unknown
		>

		expect(file.legacyItems).toEqual([{ id: 1, title: "x", message: "y" }])
	})

	it("stops if any entry does not decrypt, naming the ids and handing out nothing", async () => {
		const a = account()
		const bad = a.ids[1] ?? ""
		a.remote.entries.set(bad, {
			id: bad,
			ct: "v2.AAAAAAAAAAAAAAAA.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
			updatedAt: 1,
		})

		const error = await a.service.createBackup(UID, null, a.dek).catch((e: unknown) => e)

		expect(error).toBeInstanceOf(BackupVerificationError)
		expect((error as BackupVerificationError).failedIds).toEqual([bad])
	})

	it("needs the v2 profile", async () => {
		const a = account()
		a.remote.profiles.clear()

		await expect(a.service.createBackup(UID, null, a.dek)).rejects.toMatchObject({
			code: "not-found",
		})
	})
})

describe("parseBackupFile", () => {
	it("reads the in-app format", async () => {
		const a = account()
		const parsed = parseBackupFile((await a.service.createBackup(UID, null, a.dek)).json)

		expect(parsed).toMatchObject({ kind: "v2", uid: UID, exportedAt: "2026-11-26T12:34:56.000Z" })
		expect(parsed.kind === "v2" && parsed.entries.length).toBe(3)
	})

	it("reads script files: v1 as legacy, v2 with entries and crypto as v2", () => {
		const v1 = JSON.stringify({
			format: "password-manager-firestore-backup/v1",
			exportedAt: "t",
			path: `users/${UID}`,
			data: { items: [{ id: 1 }] },
		})
		const v2 = JSON.stringify({
			format: "password-manager-firestore-backup/v2",
			exportedAt: "t",
			path: `users/${UID}`,
			data: {
				items: [],
				crypto: { wrappedDek: "v2.a.b", kdf: "hkdf-sha256", rkVersion: 1, createdAt: "x" },
			},
			entries: [{ id: "e1", ct: "v2.a.b", updatedAt: null }],
		})

		expect(parseBackupFile(v1)).toMatchObject({ kind: "legacy", items: [{ id: 1 }] })
		expect(parseBackupFile(v2)).toMatchObject({
			kind: "v2",
			uid: UID,
			entries: [{ id: "e1", ct: "v2.a.b" }],
		})
	})

	it.each([
		["not JSON", "{oops"],
		["an array", "[]"],
		["unknown format", JSON.stringify({ format: "other/v1" })],
		["no crypto", JSON.stringify({ format: "password-manager-backup/v2", uid: "u", entries: [] })],
		[
			"bad rkVersion",
			JSON.stringify({
				format: "password-manager-backup/v2",
				uid: "u",
				entries: [],
				crypto: { wrappedDek: "v2.a.b", kdf: "hkdf-sha256", rkVersion: 0 },
			}),
		],
		[
			"entries not an array",
			JSON.stringify({
				format: "password-manager-backup/v2",
				uid: "u",
				entries: {},
				crypto: { wrappedDek: "v2.a.b", kdf: "hkdf-sha256", rkVersion: 1 },
			}),
		],
		[
			"duplicate ids",
			JSON.stringify({
				format: "password-manager-backup/v2",
				uid: "u",
				entries: [
					{ id: "a", ct: "x" },
					{ id: "a", ct: "y" },
				],
				crypto: { wrappedDek: "v2.a.b", kdf: "hkdf-sha256", rkVersion: 1 },
			}),
		],
		[
			"entry without ct",
			JSON.stringify({
				format: "password-manager-backup/v2",
				uid: "u",
				entries: [{ id: "a" }],
				crypto: { wrappedDek: "v2.a.b", kdf: "hkdf-sha256", rkVersion: 1 },
			}),
		],
	])("rejects %s as invalid-backup", (_name, text) => {
		const code = ((): unknown => {
			try {
				parseBackupFile(text)
				return null
			} catch (error) {
				return (error as { code?: unknown }).code
			}
		})()

		expect(code).toBe("invalid-backup")
	})
})

describe("VaultBackupService: import", () => {
	it("same account and keys: replaces everything, new ids, same content, verified", async () => {
		const a = account()
		const file = a.service.parse((await a.service.createBackup(UID, null, a.dek)).json)
		await a.remote.setEntry(UID, {
			id: "extra",
			ct: a.entryCodec.encrypt(a.dek, UID, "extra", payload("Лишняя")),
		})
		const oldIds = new Set(a.remote.entries.keys())

		const info = await a.service.inspect(UID, file)
		const plan = await a.service.prepareImport(UID, a.dek, file)
		await a.service.commitImport(plan)

		expect(info).toEqual({
			keySource: "current",
			exportedAt: "2026-11-26T12:34:56.000Z",
			fileCount: 3,
			currentCount: 4,
		})
		expect(titlesOnServer(a)).toEqual([...TITLES].sort())
		expect([...a.remote.entries.keys()].some(id => oldIds.has(id))).toBe(false)
		expect(await a.service.verifyImport(plan, a.dek)).toBe(true)
	})

	it("a file made with other keys needs that recovery key; a wrong one is rejected", async () => {
		const other = account("other-user", new FakeRandom(5000))
		const file = other.service.parse(
			(await other.service.createBackup("other-user", null, other.dek)).json,
		)
		const mine = account()
		const info = await mine.service.inspect(UID, file)

		await expect(mine.service.prepareImport(UID, mine.dek, file)).rejects.toMatchObject({
			code: "invalid-recovery-key",
		})
		await expect(
			mine.service.prepareImport(UID, mine.dek, file, { recoveryKey: mine.rk }),
		).rejects.toMatchObject({ code: "invalid-recovery-key" })
		const plan = await mine.service.prepareImport(UID, mine.dek, file, { recoveryKey: other.rk })
		await mine.service.commitImport(plan)

		expect(info.keySource).toBe("recovery-key")
		// Re-encrypted with MY dek and uid, not the file's.
		expect(titlesOnServer(mine)).toEqual([...TITLES].sort())
		expect(() => titlesOnServer(mine, other.dek)).toThrow("Decryption failed")
	})

	it("a v1 script file needs the old key; a wrong key stops it", async () => {
		const a = account()
		const items = [
			{
				id: 1_600_000_000_000,
				title: legacyEncrypt("Старая", "old key", 3),
				message: legacyEncrypt({ login: "l", password: "p", description: "d" }, "old key", 4),
			},
		]
		const file = parseBackupFile(
			JSON.stringify({
				format: "password-manager-firestore-backup/v1",
				exportedAt: "t",
				path: `users/${UID}`,
				data: { items },
			}),
		)

		const info = await a.service.inspect(UID, file)
		await expect(a.service.prepareImport(UID, a.dek, file)).rejects.toMatchObject({
			code: "invalid-credentials",
		})
		await expect(
			a.service.prepareImport(UID, a.dek, file, { legacyKey: "wrong" }),
		).rejects.toBeInstanceOf(LegacyDataError)
		const plan = await a.service.prepareImport(UID, a.dek, file, { legacyKey: "old key" })
		await a.service.commitImport(plan)

		expect(info).toMatchObject({ keySource: "legacy-key", fileCount: 1, currentCount: 3 })
		expect(titlesOnServer(a)).toEqual(["Старая"])
	})

	it("one damaged record stops the import with its id; the current data is untouched", async () => {
		const a = account()
		const backup = JSON.parse((await a.service.createBackup(UID, null, a.dek)).json) as {
			entries: { id: string; ct: string }[]
		}
		const victim = backup.entries[2]
		if (victim)
			victim.ct = a.entryCodec.encrypt(
				new Uint8Array(32).fill(1),
				UID,
				victim.id,
				payload("Подмена"),
			)
		const file = parseBackupFile(
			JSON.stringify({
				...backup,
				format: "password-manager-backup/v2",
				uid: UID,
				crypto: cryptoOfFile((await a.service.createBackup(UID, null, a.dek)).json),
			}),
		)
		const before = new Map(a.remote.entries)

		const error = await a.service.prepareImport(UID, a.dek, file).catch((e: unknown) => e)

		expect(error).toBeInstanceOf(BackupVerificationError)
		expect((error as BackupVerificationError).failedIds).toEqual([victim?.id])
		expect(a.remote.entries).toEqual(before)
	})

	it("a failure before the commit changes nothing; an edit in between is a conflict", async () => {
		const a = account()
		const file = a.service.parse((await a.service.createBackup(UID, null, a.dek)).json)
		const plan = await a.service.prepareImport(UID, a.dek, file)
		const before = new Map(a.remote.entries)
		a.remote.failNextTransaction = "before-commit"

		await expect(a.service.commitImport(plan)).rejects.toMatchObject({ code: "network" })
		expect(a.remote.entries).toEqual(before)

		const victim = a.ids[0] ?? ""
		await a.remote.setEntry(UID, {
			id: victim,
			ct: a.entryCodec.encrypt(a.dek, UID, victim, payload("Правка")),
		})
		const afterEdit = new Map(a.remote.entries)

		await expect(a.service.commitImport(plan)).rejects.toMatchObject({ code: "conflict" })
		expect(a.remote.entries).toEqual(afterEdit)
	})

	it("verification notices data that differs from the file", async () => {
		const a = account()
		const file = a.service.parse((await a.service.createBackup(UID, null, a.dek)).json)
		const plan = await a.service.prepareImport(UID, a.dek, file)
		await a.service.commitImport(plan)
		const [first] = [...a.remote.entries.values()]
		await a.remote.setEntry(UID, {
			id: first?.id ?? "",
			ct: a.entryCodec.encrypt(a.dek, UID, first?.id ?? "", payload("Другое")),
		})

		expect(await a.service.verifyImport(plan, a.dek)).toBe(false)
	})

	it("rollbackImport puts the old entries back (same ids and ciphertexts) after a failed check", async () => {
		const a = account()
		const file = a.service.parse((await a.service.createBackup(UID, null, a.dek)).json)
		const before = new Map([...a.remote.entries].map(([id, e]) => [id, e.ct]))
		await a.remote.setEntry(UID, {
			id: "extra",
			ct: a.entryCodec.encrypt(a.dek, UID, "extra", payload("Лишняя")),
		})
		const beforeAll = new Map([...a.remote.entries].map(([id, e]) => [id, e.ct]))
		const plan = await a.service.prepareImport(UID, a.dek, file)
		await a.service.commitImport(plan)
		expect(before.size).toBe(3)

		await a.service.rollbackImport(plan)

		expect(new Map([...a.remote.entries].map(([id, e]) => [id, e.ct]))).toEqual(beforeAll)
	})

	it("rollbackImport conflicts if the imported entries changed again; nothing is touched", async () => {
		const a = account()
		const file = a.service.parse((await a.service.createBackup(UID, null, a.dek)).json)
		const plan = await a.service.prepareImport(UID, a.dek, file)
		await a.service.commitImport(plan)
		const first = plan.writes[0]?.id ?? ""
		await a.remote.setEntry(UID, {
			id: first,
			ct: a.entryCodec.encrypt(a.dek, UID, first, payload("Новая правка")),
		})
		const afterEdit = new Map(a.remote.entries)

		await expect(a.service.rollbackImport(plan)).rejects.toMatchObject({ code: "conflict" })

		expect(a.remote.entries).toEqual(afterEdit)
	})

	it("a DEK change on another device between prepare and commit is a conflict (no unreadable entries)", async () => {
		const a = account()
		const file = a.service.parse((await a.service.createBackup(UID, null, a.dek)).json)
		const plan = await a.service.prepareImport(UID, a.dek, file)
		const profile = a.remote.profiles.get(UID)
		if (profile?.crypto)
			a.remote.seedProfile({ ...profile, crypto: { ...profile.crypto, rkVersion: 2 } })
		const before = new Map(a.remote.entries)

		await expect(a.service.commitImport(plan)).rejects.toMatchObject({ code: "conflict" })

		expect(a.remote.entries).toEqual(before)
	})

	it("imports an empty file (replaces with nothing) and needs the v2 profile", async () => {
		const a = account()
		const empty = parseBackupFile(
			JSON.stringify({
				format: "password-manager-backup/v2",
				uid: UID,
				exportedAt: "t",
				entries: [],
				crypto: cryptoOfFile((await a.service.createBackup(UID, null, a.dek)).json),
			}),
		)

		await a.service.commitImport(await a.service.prepareImport(UID, a.dek, empty))
		expect(a.remote.entries.size).toBe(0)

		a.remote.profiles.clear()
		await expect(a.service.prepareImport(UID, a.dek, empty)).rejects.toMatchObject({
			code: "not-found",
		})
	})
})
