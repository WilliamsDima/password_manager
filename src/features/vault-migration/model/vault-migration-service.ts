import { decryptLegacyItems, type EntryCodec, samePayloads } from "@/entities/entry"
import type { IVaultKeyService } from "@/entities/session"
import { bytesEqual, fromBase64, toBase64 } from "@/shared/lib/encoding"
import { AppError } from "@/shared/lib/errors"
import type { ILegacyDecryptor } from "@/shared/services/legacy-decryptor"
import type { IRandom } from "@/shared/services/random"
import type { IRemoteStore, RemoteProfile } from "@/shared/services/remote-store"
import type { ISecureStorage } from "@/shared/services/secure-storage"

import type {
	AccountSetupKind,
	DekChangePlan,
	MigrationOutcome,
	MigrationPlan,
	NewAccountPlan,
} from "./types"

/** SecureStore key of the pair generated before the recovery key is shown (docs/CRYPTO.md §6.3). */
export const PENDING_MIGRATION_KEY = "pm.pendingMigration"

type PendingMigration = {
	readonly v: 1
	readonly uid: string
	readonly rk: string
	readonly dek: string
	/** ms since epoch, when the pair was generated (CRYPTO.md §6.3) */
	readonly startedAt: number
}

const isPending = (value: unknown, uid: string): value is PendingMigration =>
	typeof value === "object" &&
	value !== null &&
	"v" in value &&
	value.v === 1 &&
	"uid" in value &&
	value.uid === uid &&
	"rk" in value &&
	typeof value.rk === "string" &&
	"dek" in value &&
	typeof value.dek === "string"

/** The account a saved pair belongs to; `null` for nothing saved or data that is not a pair. */
const ownerOfPending = (raw: string | null): string | null => {
	if (raw === null) return null
	try {
		const parsed: unknown = JSON.parse(raw)
		return typeof parsed === "object" &&
			parsed !== null &&
			"v" in parsed &&
			parsed.v === 1 &&
			"uid" in parsed &&
			typeof parsed.uid === "string"
			? parsed.uid
			: null
	} catch {
		return null
	}
}

const FIRST_RK_VERSION = 1

/**
 * v1 → v2 migration and DEK change (docs/CRYPTO.md §6, §2). Steps are separate methods so that the
 * UI can show and confirm the recovery key between them:
 * `prepare` → (show + confirm RK) → `commit` → `verify` → store the DEK → `clearPending`.
 * No secret or decrypted value appears in an error message.
 */
export class VaultMigrationService {
	constructor(
		private readonly remote: IRemoteStore,
		private readonly legacy: ILegacyDecryptor,
		private readonly vaultKeys: IVaultKeyService,
		private readonly entryCodec: EntryCodec,
		private readonly random: IRandom,
		private readonly secureStorage: ISecureStorage,
	) {}

	/** Reads the profile from the server and tells which setup the account needs. */
	public readonly detect = async (uid: string): Promise<AccountSetupKind> => {
		const profile = await this.remote.getProfile(uid, "server")
		if (profile === null) return "new"
		if (profile.crypto !== null) return "has-keys"
		if (!Array.isArray(profile.legacyItems)) return "unsupported"
		return profile.legacyItems.length === 0 ? "migrate-empty" : "migrate"
	}

	/**
	 * New account, step 1: loads or creates the key pair and persists it **before returning**
	 * (before the recovery key can be shown). Throws `conflict` if the profile already exists
	 * without a pending pair that opens it (another device got there first).
	 */
	public readonly prepareNewAccount = async (uid: string): Promise<NewAccountPlan> => {
		const profile = await this.remote.getProfile(uid, "server")
		const pending = await this.loadPending(uid)
		if (profile !== null) {
			// A v1 profile is a migration, not a new account: leave any saved pair alone.
			if (profile.crypto === null) throw new AppError("conflict", "Profile already exists")
			if (pending === null) throw new AppError("conflict", "Profile created by another device")
			try {
				this.unwrapOrConflict(pending.recoveryKey, profile, uid).fill(0)
			} catch (error) {
				// Another device created the profile first: the key shown here is void. Forget it
				// so that the screen can ask for the recovery key of the other device instead.
				await this.clearPending()
				throw error
			}
			return { uid, ...pending, stage: "verify", keysCreated: false }
		}
		const keys = pending ?? (await this.createPending(uid))
		return { uid, ...keys, stage: "write", keysCreated: pending === null }
	}

	/** New account, step 2 (after the recovery key is confirmed): one transaction, online only. */
	public readonly commitNewAccount = async (
		plan: NewAccountPlan,
		profile: { readonly email: string | null; readonly displayName: string | null },
	): Promise<void> => {
		if (plan.stage !== "write") return
		try {
			await this.remote.createV2Profile(plan.uid, {
				...profile,
				crypto: {
					wrappedDek: this.vaultKeys.wrapDek(
						plan.recoveryKey,
						plan.dek,
						plan.uid,
						FIRST_RK_VERSION,
					),
					kdf: "hkdf-sha256",
					rkVersion: FIRST_RK_VERSION,
				},
			})
		} catch (error) {
			// A retry after a lost answer: the profile may already be ours. A key that opens it
			// proves that, so the retry succeeds instead of reporting a conflict on our own write.
			if (!(error instanceof AppError) || error.code !== "conflict") throw error
			const existing = await this.remote.getProfile(plan.uid, "server")
			if (existing?.crypto == null) throw error
			try {
				this.unwrapOrConflict(plan.recoveryKey, existing, plan.uid).fill(0)
			} catch (conflict) {
				// Another device created the profile between our prepare and commit: our key is void.
				await this.clearPending()
				throw conflict
			}
		}
	}

	/**
	 * New account, step 3: reads **from the server** and unwraps the DEK with the saved recovery
	 * key. Returns the DEK to store for the chosen lock mode; the caller then calls `clearPending`.
	 */
	public readonly verifyNewAccount = async (plan: NewAccountPlan): Promise<Uint8Array> => {
		const profile = await this.remote.getProfile(plan.uid, "server")
		if (profile?.crypto == null) throw new AppError("not-found", "Profile was not created")
		const unwrapped = this.unwrapOrConflict(plan.recoveryKey, profile, plan.uid)
		const same = bytesEqual(unwrapped, plan.dek)
		unwrapped.fill(0)
		if (!same) throw new AppError("conflict", "Server key differs from the generated one")
		return plan.dek
	}

	/**
	 * Reads the profile from the server, decrypts and validates all v1 items (throws
	 * `LegacyDataError` / `AppError("crypto")` before anything is generated or written), then
	 * loads or creates the key pair and **persists it before returning** — i.e. before the
	 * recovery key can be shown.
	 */
	public readonly prepare = async (uid: string, legacyKey: string): Promise<MigrationPlan> => {
		const profile = await this.remote.getProfile(uid, "server")
		if (profile === null) throw new AppError("not-found", "No profile")
		const pending = await this.loadPending(uid)
		if (profile.crypto !== null && pending === null) {
			// Committed earlier but the local keys are gone: the shown recovery key cannot be recovered.
			// The caller offers `rollback` (allowed for 24 h by the rules) and a fresh start.
			throw new AppError("conflict", "Migration committed, local keys missing")
		}
		const payloads = decryptLegacyItems(profile.legacyItems, legacyKey, this.legacy)
		if (profile.crypto !== null && pending !== null) {
			// Resume only with keys that really open the committed profile.
			this.unwrapOrConflict(pending.recoveryKey, profile, uid).fill(0)
		}
		const keys = pending ?? (await this.createPending(uid))
		return {
			uid,
			payloads,
			recoveryKey: keys.recoveryKey,
			dek: keys.dek,
			stage: profile.crypto === null ? "write" : "verify",
			keysCreated: pending === null,
		}
	}

	/** Step 5: one transaction writes all entries and `crypto`. Offline it fails; nothing is queued. */
	public readonly commit = async (plan: MigrationPlan): Promise<void> => {
		if (plan.stage !== "write") return
		const entries = plan.payloads.map(payload => {
			const id = this.random.uuid()
			return { id, ct: this.entryCodec.encrypt(plan.dek, plan.uid, id, payload) }
		})
		await this.remote.migrateToV2(plan.uid, {
			entries,
			crypto: {
				wrappedDek: this.vaultKeys.wrapDek(plan.recoveryKey, plan.dek, plan.uid, FIRST_RK_VERSION),
				kdf: "hkdf-sha256",
				rkVersion: FIRST_RK_VERSION,
			},
		})
	}

	/**
	 * Step 6: reads **from the server**, unwraps the DEK with the saved recovery key, decrypts every
	 * entry and compares field by field with the v1 data. A definite mismatch rolls everything
	 * back. A connection error is rethrown without rollback: the state is unknown, run again.
	 * On success the caller stores the DEK for the current lock mode and calls `clearPending`.
	 */
	public readonly verify = async (plan: MigrationPlan): Promise<MigrationOutcome> => {
		const [profile, entries] = await Promise.all([
			this.remote.getProfile(plan.uid, "server"),
			this.remote.listEntries(plan.uid, "server"),
		])
		const matches = this.matchesLegacy(plan, profile, entries)
		if (!matches) {
			// Either our recovery key opened the server DEK and the content differs, or the profile
			// has no `crypto` at all (nothing committed). A foreign DEK throws `conflict` earlier.
			await this.remote.rollbackMigration(plan.uid)
			return { status: "rolled-back" }
		}
		return { status: "verified", dek: plan.dek }
	}

	/** Rolls back a committed migration (also for the "keys lost" case) and forgets the keys. */
	public readonly rollback = async (uid: string): Promise<void> => {
		await this.remote.rollbackMigration(uid)
		await this.clearPending()
	}

	/** Removes the saved pair once the DEK lives in the regular key storage. */
	public readonly clearPending = (): Promise<void> =>
		this.secureStorage.remove(PENDING_MIGRATION_KEY)

	/**
	 * DEK change after a leak (§2): new RK + new DEK, every entry re-encrypted. Reads from the
	 * server and decrypts with the current `dek` first, so a bad entry stops it before anything is
	 * written. The caller shows and confirms the new RK, then calls `commitDekChange`.
	 */
	public readonly prepareDekChange = async (
		uid: string,
		currentDek: Uint8Array,
	): Promise<DekChangePlan> => {
		// A queued offline write would otherwise land after the swap with the old DEK.
		await this.remote.flushPendingWrites()
		const [profile, entries] = await Promise.all([
			this.remote.getProfile(uid, "server"),
			this.remote.listEntries(uid, "server"),
		])
		if (profile?.crypto == null) throw new AppError("not-found", "No crypto profile")
		const newRecoveryKey = this.vaultKeys.generateRecoveryKey()
		const newDek = this.vaultKeys.generateDek()
		const rewrites = entries.map(entry => ({
			id: entry.id,
			expectedCt: entry.ct,
			ct: this.entryCodec.encrypt(
				newDek,
				uid,
				entry.id,
				this.entryCodec.decrypt(currentDek, uid, entry.id, entry.ct),
			),
		}))
		return {
			uid,
			expectedRkVersion: profile.crypto.rkVersion,
			newRecoveryKey,
			newDek,
			entries: rewrites,
			wrappedDek: this.vaultKeys.wrapDek(newRecoveryKey, newDek, uid, profile.crypto.rkVersion + 1),
		}
	}

	/** One transaction: all entries and `crypto` change together or not at all. */
	public readonly commitDekChange = (plan: DekChangePlan): Promise<void> =>
		this.remote.rekey(plan.uid, {
			expectedRkVersion: plan.expectedRkVersion,
			entries: plan.entries,
			crypto: {
				wrappedDek: plan.wrappedDek,
				kdf: "hkdf-sha256",
				rkVersion: plan.expectedRkVersion + 1,
			},
		})

	/**
	 * After `commitDekChange`: re-reads the server and re-encrypts, with the new DEK, any entry
	 * that still holds a ciphertext of the old DEK (a straggler written during the swap). Run it
	 * while the old DEK is still in memory. Returns the number repaired; an entry that neither DEK
	 * opens throws `AppError("crypto")`.
	 */
	public readonly repairAfterDekChange = async (
		plan: DekChangePlan,
		oldDek: Uint8Array,
	): Promise<number> => {
		const entries = await this.remote.listEntries(plan.uid, "server")
		const stale = entries.filter(entry => !this.opensWith(plan.newDek, plan.uid, entry))
		const repaired = stale.map(entry => ({
			id: entry.id,
			ct: this.entryCodec.encrypt(
				plan.newDek,
				plan.uid,
				entry.id,
				this.entryCodec.decrypt(oldDek, plan.uid, entry.id, entry.ct),
			),
		}))
		await repaired.reduce(async (previous, write) => {
			await previous
			await this.remote.setEntry(plan.uid, write)
		}, Promise.resolve())
		return repaired.length
	}

	private readonly opensWith = (
		dek: Uint8Array,
		uid: string,
		entry: { readonly id: string; readonly ct: string },
	): boolean => {
		try {
			this.entryCodec.decrypt(dek, uid, entry.id, entry.ct)
			return true
		} catch {
			return false
		}
	}

	private readonly matchesLegacy = (
		plan: MigrationPlan,
		profile: RemoteProfile | null,
		entries: readonly { readonly id: string; readonly ct: string }[],
	): boolean => {
		if (profile?.crypto == null) return false
		const dek = this.unwrapOrConflict(plan.recoveryKey, profile, plan.uid)
		try {
			const decrypted = entries.map(entry =>
				this.entryCodec.decrypt(dek, plan.uid, entry.id, entry.ct),
			)
			return samePayloads(decrypted, plan.payloads)
		} catch (error) {
			if (error instanceof AppError && error.code === "crypto") return false
			throw error
		} finally {
			dek.fill(0)
		}
	}

	/**
	 * A server DEK that our saved recovery key cannot open was written by someone else's migration
	 * (another device). That is a conflict, never a reason to roll anything back.
	 */
	private readonly unwrapOrConflict = (
		recoveryKey: Uint8Array,
		profile: RemoteProfile,
		uid: string,
	): Uint8Array => {
		if (profile.crypto === null) throw new AppError("conflict", "No crypto profile")
		try {
			return this.vaultKeys.unwrapDek(
				recoveryKey,
				profile.crypto.wrappedDek,
				uid,
				profile.crypto.rkVersion,
			)
		} catch (error) {
			if (error instanceof AppError && error.code === "crypto") {
				throw new AppError("conflict", "Server keys belong to another migration", { cause: error })
			}
			throw error
		}
	}

	private readonly loadPending = async (
		uid: string,
	): Promise<{ readonly recoveryKey: Uint8Array; readonly dek: Uint8Array } | null> => {
		const raw = await this.secureStorage.get(PENDING_MIGRATION_KEY)
		if (raw === null) return null
		try {
			const parsed: unknown = JSON.parse(raw)
			return isPending(parsed, uid)
				? { recoveryKey: fromBase64(parsed.rk), dek: fromBase64(parsed.dek) }
				: null
		} catch {
			return null
		}
	}

	private readonly createPending = async (
		uid: string,
	): Promise<{ readonly recoveryKey: Uint8Array; readonly dek: Uint8Array }> => {
		// An unfinished setup of another account holds a recovery key that may already be shown:
		// overwriting it would lose that key. Finish (or roll back) that account first.
		const owner = ownerOfPending(await this.secureStorage.get(PENDING_MIGRATION_KEY))
		if (owner !== null && owner !== uid) {
			throw new AppError("conflict", "Unfinished setup of another account on this phone")
		}
		const recoveryKey = this.vaultKeys.generateRecoveryKey()
		const dek = this.vaultKeys.generateDek()
		const pending: PendingMigration = {
			v: 1,
			uid,
			rk: toBase64(recoveryKey),
			dek: toBase64(dek),
			startedAt: Date.now(),
		}
		await this.secureStorage.set(PENDING_MIGRATION_KEY, JSON.stringify(pending))
		return { recoveryKey, dek }
	}
}
