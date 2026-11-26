import { cbc } from "@noble/ciphers/aes.js"
import { md5 } from "@noble/hashes/legacy.js"
import { concatBytes } from "@noble/hashes/utils.js"

import { EntryCodec, type EntryPayload, LegacyDataError } from "@/entities/entry"
import { VaultKeyService } from "@/entities/session"
import { encodeUtf8, toBase64 } from "@/shared/lib/encoding"
import { AppError } from "@/shared/lib/errors"
import { NobleCryptoService } from "@/shared/services/crypto"
import { CryptoJsLegacyDecryptor } from "@/shared/services/legacy-decryptor"
import type { RemoteProfile } from "@/shared/services/remote-store"
import { FakeRandom, FakeRemoteStore, FakeSecureStorage } from "@/shared/testing"

import { PENDING_MIGRATION_KEY, VaultMigrationService } from "./vault-migration-service"

const UID = "user-1"
const LEGACY_KEY = "old v1 key"

/** CryptoJS-compatible encryption (OpenSSL "Salted__", EVP_BytesToKey MD5, AES-256-CBC) for fixtures. */
const legacyEncrypt = (value: unknown, key: string, saltSeed: number): string => {
	const salt = new Uint8Array(8).fill(saltSeed)
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

const legacyItem = (id: number, title: string, message: unknown, key = LEGACY_KEY) => ({
	id,
	title: legacyEncrypt(title, key, id % 250),
	message: legacyEncrypt(message, key, (id + 1) % 250),
})

const LEGACY_ITEMS = [
	legacyItem(1_600_000_000_000, "Почта", {
		login: "me@mail.ru",
		password: "п@ss🔑",
		description: "заметка",
	}),
	legacyItem(1_600_000_100_000, "Банк", { login: "bank", password: "123456", description: "" }),
	legacyItem(1_600_000_200_000, "Форум", { login: "f", password: "x" }),
]

const MAIL = 0
const BANK = 1
const EXPECTED: readonly EntryPayload[] = [
	{
		title: "Почта",
		login: "me@mail.ru",
		password: "п@ss🔑",
		notes: "заметка",
		createdAt: 1_600_000_000_000,
		updatedAt: 1_600_000_000_000,
	},
	{
		title: "Банк",
		login: "bank",
		password: "123456",
		createdAt: 1_600_000_100_000,
		updatedAt: 1_600_000_100_000,
	},
	{
		title: "Форум",
		login: "f",
		password: "x",
		createdAt: 1_600_000_200_000,
		updatedAt: 1_600_000_200_000,
	},
]

const at = (index: number): EntryPayload => {
	const payload = EXPECTED[index]
	if (payload === undefined) throw new Error("fixture index")
	return payload
}

const v1Profile = (items: unknown): RemoteProfile => ({
	uid: UID,
	schemaVersion: 1,
	email: "a@b.c",
	displayName: null,
	crypto: null,
	legacyItems: items,
	migratedAt: null,
})

const setup = (items: unknown = LEGACY_ITEMS, seed = 0) => {
	const random = new FakeRandom(seed)
	const crypto = new NobleCryptoService(random)
	const remote = new FakeRemoteStore()
	const secureStorage = new FakeSecureStorage()
	const vaultKeys = new VaultKeyService(crypto, random)
	const entryCodec = new EntryCodec(crypto)
	remote.seedProfile(v1Profile(items))
	const service = new VaultMigrationService(
		remote,
		new CryptoJsLegacyDecryptor(),
		vaultKeys,
		entryCodec,
		random,
		secureStorage,
	)
	return { remote, secureStorage, service, vaultKeys, entryCodec, crypto }
}

const decryptServer = (ctx: ReturnType<typeof setup>, dek: Uint8Array): EntryPayload[] =>
	[...ctx.remote.entries.values()].map(e => ctx.entryCodec.decrypt(dek, UID, e.id, e.ct))

describe("VaultMigrationService: v1 → v2", () => {
	it("migrates: prepare → commit → verify, entries match v1 field by field", async () => {
		const ctx = setup()

		const plan = await ctx.service.prepare(UID, LEGACY_KEY)
		expect(plan.stage).toBe("write")
		expect(plan.payloads).toEqual(EXPECTED)
		await ctx.service.commit(plan)
		const outcome = await ctx.service.verify(plan)

		expect(outcome.status).toBe("verified")
		const profile = ctx.remote.profiles.get(UID)
		expect(profile?.schemaVersion).toBe(2)
		expect(profile?.crypto?.rkVersion).toBe(1)
		expect(profile?.legacyItems).toBe(LEGACY_ITEMS)
		expect(decryptServer(ctx, plan.dek)).toEqual(expect.arrayContaining(EXPECTED))
		expect(ctx.remote.entries.size).toBe(3)
	})

	it("saves the key pair before the recovery key can be shown, and clears it on request", async () => {
		const ctx = setup()

		const plan = await ctx.service.prepare(UID, LEGACY_KEY)
		const saved = JSON.parse(
			ctx.secureStorage.values.get(PENDING_MIGRATION_KEY) ?? "null",
		) as unknown

		expect(saved).toMatchObject({
			v: 1,
			uid: UID,
			rk: toBase64(plan.recoveryKey),
			dek: toBase64(plan.dek),
		})
		await ctx.service.clearPending()
		expect(ctx.secureStorage.values.has(PENDING_MIGRATION_KEY)).toBe(false)
	})

	it("recovery key from the plan unwraps the stored wrappedDek (the saved key really works)", async () => {
		const ctx = setup()
		const plan = await ctx.service.prepare(UID, LEGACY_KEY)
		await ctx.service.commit(plan)

		const crypto = ctx.remote.profiles.get(UID)?.crypto
		const dek = ctx.vaultKeys.unwrapDek(plan.recoveryKey, crypto?.wrappedDek ?? "", UID, 1)

		expect(dek).toEqual(plan.dek)
	})

	it("stops on a broken record with the list of ids, writes and generates nothing", async () => {
		const broken = {
			...LEGACY_ITEMS[1],
			message: legacyEncrypt({ login: "only login" }, LEGACY_KEY, 9),
		}
		const ctx = setup([LEGACY_ITEMS[0], broken, LEGACY_ITEMS[2]])

		const error = await ctx.service.prepare(UID, LEGACY_KEY).catch((e: unknown) => e)

		expect(error).toBeInstanceOf(LegacyDataError)
		expect((error as LegacyDataError).failedIds).toEqual(["1600000100000"])
		expect(ctx.secureStorage.values.size).toBe(0)
		expect(ctx.remote.entries.size).toBe(0)
		expect(ctx.remote.profiles.get(UID)?.crypto).toBeNull()
	})

	it("rejects a wrong legacy key: every item is reported, nothing is written", async () => {
		const ctx = setup()

		const error = await ctx.service.prepare(UID, "wrong key").catch((e: unknown) => e)

		expect(error).toBeInstanceOf(LegacyDataError)
		expect((error as LegacyDataError).failedIds).toHaveLength(3)
		expect(ctx.secureStorage.values.size).toBe(0)
	})

	it("reports items with a non-string title or a non-array items field", async () => {
		const bad = setup([{ id: 5, title: 1, message: "x" }, "junk"])
		await expect(bad.service.prepare(UID, LEGACY_KEY)).rejects.toMatchObject({
			failedIds: ["5", "#1"],
		})
		const none = setup(null)
		await expect(none.service.prepare(UID, LEGACY_KEY)).rejects.toMatchObject({ code: "not-found" })
	})

	it("migrates an empty v1 list", async () => {
		const ctx = setup([])
		const plan = await ctx.service.prepare(UID, LEGACY_KEY)

		await ctx.service.commit(plan)

		expect((await ctx.service.verify(plan)).status).toBe("verified")
		expect(ctx.remote.entries.size).toBe(0)
	})

	it("failure before the commit: nothing written, retry reuses the same keys", async () => {
		const ctx = setup()
		const first = await ctx.service.prepare(UID, LEGACY_KEY)
		ctx.remote.failNextTransaction = "before-commit"

		await expect(ctx.service.commit(first)).rejects.toMatchObject({ code: "network" })

		expect(ctx.remote.entries.size).toBe(0)
		expect(ctx.remote.profiles.get(UID)?.crypto).toBeNull()
		const second = await ctx.service.prepare(UID, LEGACY_KEY)
		expect(second.recoveryKey).toEqual(first.recoveryKey)
		expect(second.dek).toEqual(first.dek)
		await ctx.service.commit(second)
		expect((await ctx.service.verify(second)).status).toBe("verified")
		expect(ctx.remote.entries.size).toBe(3)
	})

	it("commit went through but the answer was lost: resume only verifies, no second set of entries", async () => {
		const ctx = setup()
		const first = await ctx.service.prepare(UID, LEGACY_KEY)
		ctx.remote.failNextTransaction = "after-commit"

		await expect(ctx.service.commit(first)).rejects.toMatchObject({ code: "network" })
		const resumed = await ctx.service.prepare(UID, LEGACY_KEY)

		expect(resumed.stage).toBe("verify")
		expect(resumed.recoveryKey).toEqual(first.recoveryKey)
		await ctx.service.commit(resumed)
		expect((await ctx.service.verify(resumed)).status).toBe("verified")
		expect(ctx.remote.entries.size).toBe(3)
	})

	it("rolls back when the server data does not match v1 (entry replaced after the write)", async () => {
		const ctx = setup()
		const plan = await ctx.service.prepare(UID, LEGACY_KEY)
		await ctx.service.commit(plan)
		const [victim] = [...ctx.remote.entries.values()]
		const forged = ctx.entryCodec.encrypt(plan.dek, UID, victim?.id ?? "", {
			...at(MAIL),
			password: "tampered",
		})
		await ctx.remote.setEntry(UID, { id: victim?.id ?? "", ct: forged })

		const outcome = await ctx.service.verify(plan)

		expect(outcome.status).toBe("rolled-back")
		expect(ctx.remote.entries.size).toBe(0)
		expect(ctx.remote.profiles.get(UID)).toMatchObject({
			crypto: null,
			schemaVersion: 1,
			migratedAt: null,
		})
		expect(ctx.remote.profiles.get(UID)?.legacyItems).toBe(LEGACY_ITEMS)
	})

	it.each([
		[
			"a missing entry",
			(ctx: ReturnType<typeof setup>) =>
				ctx.remote.entries.delete([...ctx.remote.entries.keys()][0] ?? ""),
		],
		[
			"an extra entry",
			(ctx: ReturnType<typeof setup>) =>
				ctx.remote.entries.set("extra", {
					id: "extra",
					ct: "v2.AAAAAAAAAAAAAAAA.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
					updatedAt: 1,
				}),
		],
	])("rolls back on %s", async (_name, tamper) => {
		const ctx = setup()
		const plan = await ctx.service.prepare(UID, LEGACY_KEY)
		await ctx.service.commit(plan)
		tamper(ctx)

		expect((await ctx.service.verify(plan)).status).toBe("rolled-back")
	})

	it("a connection error during verification does not roll back", async () => {
		const ctx = setup()
		const plan = await ctx.service.prepare(UID, LEGACY_KEY)
		await ctx.service.commit(plan)
		ctx.remote.failNextListEntries = true

		await expect(ctx.service.verify(plan)).rejects.toMatchObject({ code: "network" })

		expect(ctx.remote.rollbackCalls).toBe(0)
		expect(ctx.remote.entries.size).toBe(3)
		expect((await ctx.service.verify(plan)).status).toBe("verified")
	})

	it("committed but the local keys are gone: conflict, rollback then a fresh start works", async () => {
		const ctx = setup()
		const plan = await ctx.service.prepare(UID, LEGACY_KEY)
		await ctx.service.commit(plan)
		await ctx.service.clearPending()

		await expect(ctx.service.prepare(UID, LEGACY_KEY)).rejects.toMatchObject({ code: "conflict" })
		await ctx.service.rollback(UID)
		const fresh = await ctx.service.prepare(UID, LEGACY_KEY)

		expect(fresh.stage).toBe("write")
		expect(fresh.recoveryKey).not.toEqual(plan.recoveryKey)
		await ctx.service.commit(fresh)
		expect((await ctx.service.verify(fresh)).status).toBe("verified")
	})

	it("a commit that races with another migration gets a conflict and writes nothing", async () => {
		const ctx = setup()
		const plan = await ctx.service.prepare(UID, LEGACY_KEY)
		const other = await new VaultMigrationService(
			ctx.remote,
			new CryptoJsLegacyDecryptor(),
			ctx.vaultKeys,
			ctx.entryCodec,
			new FakeRandom(),
			new FakeSecureStorage(),
		).prepare(UID, LEGACY_KEY)
		await ctx.service.commit(other)
		const entriesBefore = ctx.remote.entries.size

		await expect(ctx.service.commit(plan)).rejects.toMatchObject({ code: "conflict" })

		expect(ctx.remote.entries.size).toBe(entriesBefore)
	})

	it("refuses to overwrite a pending pair that belongs to another account", async () => {
		const ctx = setup()
		await ctx.secureStorage.set(
			PENDING_MIGRATION_KEY,
			JSON.stringify({
				v: 1,
				uid: "someone-else",
				rk: toBase64(new Uint8Array(32)),
				dek: toBase64(new Uint8Array(32)),
			}),
		)

		// That account may have shown its recovery key already: never replace the pair silently.
		await expect(ctx.service.prepare(UID, LEGACY_KEY)).rejects.toMatchObject({
			code: "setup-pending",
		})
		expect(ctx.secureStorage.values.get(PENDING_MIGRATION_KEY)).toContain("someone-else")
	})

	it("never leaks keys or plaintext in error messages", async () => {
		const ctx = setup()
		const error = await ctx.service.prepare(UID, "wrong key").catch((e: unknown) => e)

		expect((error as Error).message).not.toMatch(/wrong key|me@mail|п@ss/)
		expect(error).toBeInstanceOf(AppError)
	})
})

describe("VaultMigrationService: safety of the rollback", () => {
	it("keys that do not open the server profile (another device migrated) → conflict, no rollback, entries intact", async () => {
		const deviceA = setup()
		const planA = await deviceA.service.prepare(UID, LEGACY_KEY)
		const deviceB = new VaultMigrationService(
			deviceA.remote,
			new CryptoJsLegacyDecryptor(),
			deviceA.vaultKeys,
			deviceA.entryCodec,
			new FakeRandom(),
			new FakeSecureStorage(),
		)
		const planB = await deviceB.prepare(UID, LEGACY_KEY)
		await deviceA.service.commit(planA)
		await deviceA.service.verify(planA)
		await deviceA.remote.setEntry(UID, {
			id: "added-later",
			ct: deviceA.entryCodec.encrypt(planA.dek, UID, "added-later", at(MAIL)),
		})

		await expect(deviceB.verify(planB)).rejects.toMatchObject({ code: "conflict" })

		expect(deviceA.remote.rollbackCalls).toBe(0)
		expect(deviceA.remote.entries.size).toBe(4)
		expect(deviceA.remote.profiles.get(UID)?.crypto).not.toBeNull()
	})

	it("prepare refuses to resume with saved keys that do not open the committed profile", async () => {
		const ctx = setup()
		const plan = await ctx.service.prepare(UID, LEGACY_KEY)
		await ctx.service.commit(plan)
		await ctx.secureStorage.set(
			PENDING_MIGRATION_KEY,
			JSON.stringify({
				v: 1,
				uid: UID,
				rk: toBase64(new Uint8Array(32).fill(7)),
				dek: toBase64(plan.dek),
			}),
		)

		await expect(ctx.service.prepare(UID, LEGACY_KEY)).rejects.toMatchObject({ code: "conflict" })
		expect(ctx.remote.rollbackCalls).toBe(0)
	})

	it("past the 24 h window nothing is deleted: rollback-expired, the data stays as it was", async () => {
		const ctx = setup()
		const plan = await ctx.service.prepare(UID, LEGACY_KEY)
		await ctx.service.commit(plan)
		const [victim] = [...ctx.remote.entries.values()]
		await ctx.remote.setEntry(UID, {
			id: victim?.id ?? "",
			ct: ctx.entryCodec.encrypt(plan.dek, UID, victim?.id ?? "", at(BANK)),
		})
		ctx.remote.nowMs += 25 * 3_600_000

		await expect(ctx.service.verify(plan)).rejects.toMatchObject({ code: "rollback-expired" })
		await expect(ctx.service.rollback(UID)).rejects.toMatchObject({ code: "rollback-expired" })

		expect(ctx.remote.entries.size).toBe(3)
		expect(ctx.remote.profiles.get(UID)?.crypto).not.toBeNull()
		expect(ctx.remote.rollbackCalls).toBe(0)
	})

	it("never rolls back after a DEK change: those entries are newer than the v1 data", async () => {
		const ctx = setup()
		const plan = await ctx.service.prepare(UID, LEGACY_KEY)
		await ctx.service.commit(plan)
		await ctx.service.commitDekChange(await ctx.service.prepareDekChange(UID, plan.dek))

		await expect(ctx.service.rollback(UID)).rejects.toMatchObject({ code: "conflict" })

		expect(ctx.remote.entries.size).toBe(3)
		expect(ctx.remote.profiles.get(UID)?.crypto?.rkVersion).toBe(2)
	})

	it("saves when the pair was generated", async () => {
		const ctx = setup()

		await ctx.service.prepare(UID, LEGACY_KEY)

		const saved = JSON.parse(ctx.secureStorage.values.get(PENDING_MIGRATION_KEY) ?? "{}") as {
			startedAt?: unknown
		}
		expect(typeof saved.startedAt).toBe("number")
	})

	it("flags freshly generated keys so the UI can warn that an earlier recovery key is void", async () => {
		const ctx = setup()

		const first = await ctx.service.prepare(UID, LEGACY_KEY)
		const second = await ctx.service.prepare(UID, LEGACY_KEY)

		expect(first.keysCreated).toBe(true)
		expect(second.keysCreated).toBe(false)
	})
})

describe("VaultMigrationService: DEK change", () => {
	const migrated = async () => {
		const ctx = setup()
		const plan = await ctx.service.prepare(UID, LEGACY_KEY)
		await ctx.service.commit(plan)
		return { ctx, plan }
	}

	it("re-encrypts every entry and swaps the wrapped DEK in one transaction", async () => {
		const { ctx, plan } = await migrated()

		const change = await ctx.service.prepareDekChange(UID, plan.dek)
		await ctx.service.commitDekChange(change)

		const profile = ctx.remote.profiles.get(UID)
		expect(profile?.crypto?.rkVersion).toBe(2)
		const unwrapped = ctx.vaultKeys.unwrapDek(
			change.newRecoveryKey,
			profile?.crypto?.wrappedDek ?? "",
			UID,
			2,
		)
		expect(unwrapped).toEqual(change.newDek)
		expect(decryptServer(ctx, change.newDek)).toEqual(expect.arrayContaining(EXPECTED))
		expect(ctx.remote.entries.size).toBe(3)
		expect(() => decryptServer(ctx, plan.dek)).toThrow("Decryption failed")
		expect(() =>
			ctx.vaultKeys.unwrapDek(plan.recoveryKey, profile?.crypto?.wrappedDek ?? "", UID, 2),
		).toThrow()
	})

	it("an undecryptable entry stops it before anything is written", async () => {
		const { ctx, plan } = await migrated()
		const [victim] = [...ctx.remote.entries.values()]
		await ctx.remote.setEntry(UID, {
			id: victim?.id ?? "",
			ct: ctx.entryCodec.encrypt(new Uint8Array(32).fill(1), UID, victim?.id ?? "", at(MAIL)),
		})
		const before = new Map(ctx.remote.entries)

		await expect(ctx.service.prepareDekChange(UID, plan.dek)).rejects.toMatchObject({
			code: "crypto",
		})

		expect(ctx.remote.entries).toEqual(before)
		expect(ctx.remote.profiles.get(UID)?.crypto?.rkVersion).toBe(1)
	})

	it("an entry edited between prepare and commit: conflict, nothing changes", async () => {
		const { ctx, plan } = await migrated()
		const change = await ctx.service.prepareDekChange(UID, plan.dek)
		const [victim] = [...ctx.remote.entries.values()]
		await ctx.remote.setEntry(UID, {
			id: victim?.id ?? "",
			ct: ctx.entryCodec.encrypt(plan.dek, UID, victim?.id ?? "", at(BANK)),
		})
		const before = new Map(ctx.remote.entries)

		await expect(ctx.service.commitDekChange(change)).rejects.toMatchObject({ code: "conflict" })

		expect(ctx.remote.entries).toEqual(before)
		expect(ctx.remote.profiles.get(UID)?.crypto?.rkVersion).toBe(1)
	})

	it("a failure before the commit leaves the old keys fully working", async () => {
		const { ctx, plan } = await migrated()
		const change = await ctx.service.prepareDekChange(UID, plan.dek)
		ctx.remote.failNextTransaction = "before-commit"

		await expect(ctx.service.commitDekChange(change)).rejects.toMatchObject({ code: "network" })

		expect(decryptServer(ctx, plan.dek)).toEqual(expect.arrayContaining(EXPECTED))
		expect(ctx.remote.profiles.get(UID)?.crypto?.rkVersion).toBe(1)
	})

	it("a second device that changed the key version first wins: conflict", async () => {
		const { ctx, plan } = await migrated()
		const change = await ctx.service.prepareDekChange(UID, plan.dek)
		await ctx.service.commitDekChange(await ctx.service.prepareDekChange(UID, plan.dek))

		await expect(ctx.service.commitDekChange(change)).rejects.toMatchObject({ code: "conflict" })
	})

	it("flushes queued offline writes before it reads the entries", async () => {
		const { ctx, plan } = await migrated()

		await ctx.service.prepareDekChange(UID, plan.dek)

		expect(ctx.remote.flushCalls).toBe(1)
	})

	it("repairs a straggler written with the old DEK after the swap", async () => {
		const { ctx, plan } = await migrated()
		const change = await ctx.service.prepareDekChange(UID, plan.dek)
		await ctx.service.commitDekChange(change)
		const [victim] = [...ctx.remote.entries.values()]
		const id = victim?.id ?? ""
		await ctx.remote.setEntry(UID, { id, ct: ctx.entryCodec.encrypt(plan.dek, UID, id, at(MAIL)) })

		const repaired = await ctx.service.repairAfterDekChange(change, plan.dek)

		expect(repaired).toBe(1)
		expect(decryptServer(ctx, change.newDek)).toHaveLength(3)
		expect(await ctx.service.repairAfterDekChange(change, plan.dek)).toBe(0)
	})

	it("an entry that neither key opens is reported, not silently dropped", async () => {
		const { ctx, plan } = await migrated()
		const change = await ctx.service.prepareDekChange(UID, plan.dek)
		await ctx.service.commitDekChange(change)
		await ctx.remote.setEntry(UID, {
			id: "junk",
			ct: "v2.AAAAAAAAAAAAAAAA.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
		})

		await expect(ctx.service.repairAfterDekChange(change, plan.dek)).rejects.toMatchObject({
			code: "crypto",
		})
	})
})

describe("VaultMigrationService: setup kind and new account", () => {
	const empty = (seed = 0) => {
		const ctx = setup(LEGACY_ITEMS, seed)
		ctx.remote.profiles.clear()
		return ctx
	}

	it("tells which setup the account needs", async () => {
		const migrate = setup()
		expect(await migrate.service.detect(UID)).toBe("migrate")

		const noEntries = setup([])
		expect(await noEntries.service.detect(UID)).toBe("migrate-empty")

		const odd = setup(undefined)
		odd.remote.seedProfile(v1Profile(undefined))
		expect(await odd.service.detect(UID)).toBe("unsupported")

		const fresh = empty()
		expect(await fresh.service.detect(UID)).toBe("new")

		const plan = await fresh.service.prepareNewAccount(UID)
		await fresh.service.commitNewAccount(plan, { email: "a@b.c", displayName: null })
		// The saved pair is still on the phone until the check ends: the run is resumed.
		expect(await fresh.service.detect(UID)).toBe("resume-new")
		await fresh.service.clearPending()
		expect(await fresh.service.detect(UID)).toBe("has-keys")
	})

	it("creates a new account: prepare → commit → verify returns the same key", async () => {
		const ctx = empty()
		const plan = await ctx.service.prepareNewAccount(UID)
		expect(plan).toMatchObject({ stage: "write", keysCreated: true })
		// The pair is on the phone before the profile exists, so the shown key is never lost.
		expect(ctx.secureStorage.values.has(PENDING_MIGRATION_KEY)).toBe(true)

		await ctx.service.commitNewAccount(plan, { email: "a@b.c", displayName: null })
		const dek = await ctx.service.verifyNewAccount(plan)

		expect(dek).toEqual(plan.dek)
		const profile = ctx.remote.profiles.get(UID)
		expect(profile).toMatchObject({ schemaVersion: 2, email: "a@b.c" })
		expect(profile?.crypto?.rkVersion).toBe(1)
		expect(ctx.remote.entries.size).toBe(0)
		// The server holds only the wrapped key: the DEK is not in the profile in clear.
		expect(JSON.stringify(profile)).not.toContain(toBase64(plan.dek))
	})

	it("reuses the same keys after an interruption and only repeats the check", async () => {
		const ctx = empty()
		const first = await ctx.service.prepareNewAccount(UID)
		ctx.remote.failNextTransaction = "after-commit"
		await expect(
			ctx.service.commitNewAccount(first, { email: "a@b.c", displayName: null }),
		).rejects.toMatchObject({ code: "network" })

		const second = await ctx.service.prepareNewAccount(UID)
		expect(second).toMatchObject({ stage: "verify", keysCreated: false })
		expect(second.recoveryKey).toEqual(first.recoveryKey)
		expect(await ctx.service.verifyNewAccount(second)).toEqual(first.dek)
	})

	it("starts again with the same keys when the commit never reached the server", async () => {
		const ctx = empty()
		const first = await ctx.service.prepareNewAccount(UID)
		ctx.remote.failNextTransaction = "before-commit"
		await expect(
			ctx.service.commitNewAccount(first, { email: "a@b.c", displayName: null }),
		).rejects.toMatchObject({ code: "network" })

		const second = await ctx.service.prepareNewAccount(UID)
		expect(second).toMatchObject({ stage: "write", keysCreated: false })
		expect(second.recoveryKey).toEqual(first.recoveryKey)
	})

	it("refuses when a profile appeared without our keys (another device)", async () => {
		const ctx = empty()
		const other = empty()
		const theirs = await other.service.prepareNewAccount(UID)
		await other.service.commitNewAccount(theirs, { email: "a@b.c", displayName: null })
		ctx.remote.profiles = other.remote.profiles

		await expect(ctx.service.prepareNewAccount(UID)).rejects.toMatchObject({ code: "conflict" })
	})

	it("does not overwrite an existing profile on commit", async () => {
		const ctx = empty()
		const plan = await ctx.service.prepareNewAccount(UID)
		ctx.remote.seedProfile(v1Profile(LEGACY_ITEMS))
		await expect(
			ctx.service.commitNewAccount(plan, { email: "a@b.c", displayName: null }),
		).rejects.toMatchObject({ code: "conflict" })
		expect(ctx.remote.profiles.get(UID)?.crypto).toBeNull()
	})

	it("treats a retry after a lost answer as success when the profile is ours", async () => {
		const ctx = empty()
		const plan = await ctx.service.prepareNewAccount(UID)
		ctx.remote.failNextTransaction = "after-commit"
		await expect(
			ctx.service.commitNewAccount(plan, { email: "a@b.c", displayName: null }),
		).rejects.toMatchObject({ code: "network" })

		// The same plan again, e.g. a plain "Retry" button: no conflict on our own profile.
		await expect(
			ctx.service.commitNewAccount(plan, { email: "a@b.c", displayName: null }),
		).resolves.toBeUndefined()
		expect(await ctx.service.verifyNewAccount(plan)).toEqual(plan.dek)
	})

	it("forgets a void key when another device created the profile first", async () => {
		const ctx = empty()
		const ours = await ctx.service.prepareNewAccount(UID)
		expect(ours.keysCreated).toBe(true)

		const other = empty(7)
		const theirs = await other.service.prepareNewAccount(UID)
		await other.service.commitNewAccount(theirs, { email: "a@b.c", displayName: null })
		ctx.remote.profiles = other.remote.profiles

		await expect(ctx.service.prepareNewAccount(UID)).rejects.toMatchObject({ code: "conflict" })
		expect(ctx.secureStorage.values.has(PENDING_MIGRATION_KEY)).toBe(false)
	})

	it("never overwrites an unfinished setup of another account", async () => {
		const ctx = empty()
		await ctx.service.prepareNewAccount("someone-else")
		const saved = ctx.secureStorage.values.get(PENDING_MIGRATION_KEY)

		await expect(ctx.service.prepareNewAccount(UID)).rejects.toMatchObject({
			code: "setup-pending",
		})
		expect(ctx.secureStorage.values.get(PENDING_MIGRATION_KEY)).toBe(saved)
	})

	it("replaces data that is not a saved pair", async () => {
		const ctx = empty()
		ctx.secureStorage.values.set(PENDING_MIGRATION_KEY, "garbage")
		const plan = await ctx.service.prepareNewAccount(UID)
		expect(plan.keysCreated).toBe(true)
	})

	it("forgets a void key when another device wins between prepare and commit", async () => {
		const ctx = empty()
		const ours = await ctx.service.prepareNewAccount(UID)

		const other = empty(9)
		const theirs = await other.service.prepareNewAccount(UID)
		await other.service.commitNewAccount(theirs, { email: "a@b.c", displayName: null })
		ctx.remote.profiles = other.remote.profiles

		await expect(
			ctx.service.commitNewAccount(ours, { email: "a@b.c", displayName: null }),
		).rejects.toMatchObject({ code: "conflict" })
		expect(ctx.secureStorage.values.has(PENDING_MIGRATION_KEY)).toBe(false)
	})

	it("resumes an unfinished new account after a restart instead of asking for the key", async () => {
		const ctx = empty()
		const plan = await ctx.service.prepareNewAccount(UID)
		ctx.remote.failNextTransaction = "after-commit"
		await expect(
			ctx.service.commitNewAccount(plan, { email: "a@b.c", displayName: null }),
		).rejects.toMatchObject({ code: "network" })

		expect(await ctx.service.detect(UID)).toBe("resume-new")
		await ctx.service.clearPending()
		expect(await ctx.service.detect(UID)).toBe("has-keys")
	})

	it("resumes an unfinished migration after a restart", async () => {
		const ctx = setup()
		const plan = await ctx.service.prepare(UID, LEGACY_KEY)
		ctx.remote.failNextTransaction = "after-commit"
		await expect(ctx.service.commit(plan)).rejects.toMatchObject({ code: "network" })

		expect(await ctx.service.detect(UID)).toBe("resume-migrate")
		const again = await ctx.service.prepare(UID, LEGACY_KEY)
		expect(again.stage).toBe("verify")
		expect((await ctx.service.verify(again)).status).toBe("verified")
	})

	it("does not resume with another account's saved pair", async () => {
		const ctx = empty()
		await ctx.service.prepareNewAccount("someone-else")
		const plan = await setup()
			.service.prepareNewAccount(UID)
			.catch(() => null)
		expect(plan).toBeNull()
		ctx.remote.seedProfile({
			...v1Profile(LEGACY_ITEMS),
			schemaVersion: 2,
			crypto: { wrappedDek: "v2.x.y", kdf: "hkdf-sha256", rkVersion: 1, createdAt: 1 },
		})
		expect(await ctx.service.detect(UID)).toBe("has-keys")
	})

	it("clears only its own saved pair", async () => {
		const ctx = empty()
		await ctx.service.prepareNewAccount("someone-else")
		await ctx.service.clearPendingFor(UID)
		expect(ctx.secureStorage.values.has(PENDING_MIGRATION_KEY)).toBe(true)
		await ctx.service.clearPendingFor("someone-else")
		expect(ctx.secureStorage.values.has(PENDING_MIGRATION_KEY)).toBe(false)
	})
})
