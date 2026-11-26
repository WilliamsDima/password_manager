import {
	decryptLegacyItems,
	type EntryCodec,
	type EntryPayload,
	samePayloads,
} from "@/entities/entry"
import type { IVaultKeyService } from "@/entities/session"
import { AppError } from "@/shared/lib/errors"
import type { ILegacyDecryptor } from "@/shared/services/legacy-decryptor"
import type { IRandom } from "@/shared/services/random"
import type { IRemoteStore, RemoteProfile } from "@/shared/services/remote-store"

import {
	BACKUP_FORMAT,
	type BackupFileV2,
	type ParsedBackup,
	parseBackupFile,
	serializeBackup,
} from "../lib/backup-format"
import type { BackupFileResult, BackupInspection, ImportPlan } from "./types"

/** Some entries do not decrypt: the export or import is stopped and the ids are reported. */
export class BackupVerificationError extends AppError {
	constructor(public readonly failedIds: readonly string[]) {
		super("crypto", "Backup entries failed the check")
	}
}

type ImportKeys = { readonly recoveryKey?: Uint8Array; readonly legacyKey?: string }

const requireCrypto = (profile: RemoteProfile | null): NonNullable<RemoteProfile["crypto"]> => {
	if (profile?.crypto == null) throw new AppError("not-found", "No v2 keys on the server yet")
	return profile.crypto
}

/**
 * Backup export and import (docs/CRYPTO.md §7). Everything is read **from the server** and every
 * entry is decrypted before anything is written or handed out. Import is a full replacement:
 * `prepareImport` checks the whole file, `commitImport` swaps the entries in one transaction,
 * `verifyImport` re-reads the server. The caller shows the warning and offers to save the current
 * backup first. No secret or decrypted value appears in an error message.
 */
export class VaultBackupService {
	constructor(
		private readonly remote: IRemoteStore,
		private readonly entryCodec: EntryCodec,
		private readonly vaultKeys: IVaultKeyService,
		private readonly legacy: ILegacyDecryptor,
		private readonly random: IRandom,
		private readonly now: () => Date,
	) {}

	public readonly createBackup = async (
		uid: string,
		email: string | null,
		dek: Uint8Array,
	): Promise<BackupFileResult> => {
		const [profile, entries] = await Promise.all([
			this.remote.getProfile(uid, "server"),
			this.remote.listEntries(uid, "server"),
		])
		const crypto = requireCrypto(profile)
		const failed = entries.filter(entry => !this.decryptsWith(dek, uid, entry))
		if (failed.length > 0) throw new BackupVerificationError(failed.map(entry => entry.id))
		const exportedAt = this.now().toISOString()
		const backup: BackupFileV2 = {
			format: BACKUP_FORMAT,
			exportedAt,
			uid,
			email,
			crypto: { wrappedDek: crypto.wrappedDek, kdf: crypto.kdf, rkVersion: crypto.rkVersion },
			entries: entries.map(entry => ({
				id: entry.id,
				ct: entry.ct,
				updatedAt: entry.updatedAt === null ? null : new Date(entry.updatedAt).toISOString(),
			})),
			...(Array.isArray(profile?.legacyItems) ? { legacyItems: profile.legacyItems } : {}),
		}
		return {
			fileName: `password-manager-backup-${exportedAt.slice(0, 16).replace(/[:T]/g, "-")}.json`,
			json: serializeBackup(backup),
			count: entries.length,
		}
	}

	public readonly parse = (text: string): ParsedBackup => parseBackupFile(text)

	/** Tells the UI which key to ask for and what the replacement would touch. */
	public readonly inspect = async (
		uid: string,
		parsed: ParsedBackup,
	): Promise<BackupInspection> => {
		const [profile, current] = await Promise.all([
			this.remote.getProfile(uid, "server"),
			this.remote.listEntries(uid, "server"),
		])
		const crypto = requireCrypto(profile)
		if (parsed.kind === "legacy") {
			return {
				keySource: "legacy-key",
				exportedAt: parsed.exportedAt,
				fileCount: Array.isArray(parsed.items) ? (parsed.items as readonly unknown[]).length : 0,
				currentCount: current.length,
			}
		}
		const same =
			parsed.crypto.wrappedDek === crypto.wrappedDek && parsed.crypto.rkVersion === crypto.rkVersion
		return {
			keySource: same ? "current" : "recovery-key",
			exportedAt: parsed.exportedAt,
			fileCount: parsed.entries.length,
			currentCount: current.length,
		}
	}

	/**
	 * Decrypts and validates **every** record of the file (a failure stops everything and the current
	 * data is untouched), then re-encrypts with the current DEK, this account's `uid` and new UUIDs.
	 * `keys` must match what `inspect` asked for.
	 */
	public readonly prepareImport = async (
		uid: string,
		currentDek: Uint8Array,
		parsed: ParsedBackup,
		keys: ImportKeys = {},
	): Promise<ImportPlan> => {
		const [profile, current] = await Promise.all([
			this.remote.getProfile(uid, "server"),
			this.remote.listEntries(uid, "server"),
		])
		const crypto = requireCrypto(profile)
		const payloads = this.readFile(parsed, crypto, currentDek, keys)
		const writes = payloads.map(payload => {
			const id = this.random.uuid()
			return { id, ct: this.entryCodec.encrypt(currentDek, uid, id, payload) }
		})
		return {
			uid,
			rkVersion: crypto.rkVersion,
			payloads,
			writes,
			current: current.map(entry => ({ id: entry.id, expectedCt: entry.ct })),
			exportedAt: parsed.exportedAt,
		}
	}

	/** One transaction: the old entries are deleted and the new ones created, or nothing changes. */
	public readonly commitImport = (plan: ImportPlan): Promise<void> =>
		this.remote.replaceEntries(plan.uid, {
			expectedRkVersion: plan.rkVersion,
			current: plan.current,
			writes: plan.writes,
		})

	/**
	 * Puts the replaced entries back: the old ciphertexts are still in the plan (same ids, same
	 * DEK), so a failed verification does not have to cost the user their data. Conflicts if the
	 * entries changed again in the meantime.
	 */
	public readonly rollbackImport = (plan: ImportPlan): Promise<void> =>
		this.remote.replaceEntries(plan.uid, {
			expectedRkVersion: plan.rkVersion,
			current: plan.writes.map(entry => ({ id: entry.id, expectedCt: entry.ct })),
			writes: plan.current.map(entry => ({ id: entry.id, ct: entry.expectedCt })),
		})

	/** Re-reads the server and compares with the file. `false` means: restore from the saved backup. */
	public readonly verifyImport = async (plan: ImportPlan, dek: Uint8Array): Promise<boolean> => {
		const entries = await this.remote.listEntries(plan.uid, "server")
		try {
			const decrypted = entries.map(entry =>
				this.entryCodec.decrypt(dek, plan.uid, entry.id, entry.ct),
			)
			return samePayloads(decrypted, plan.payloads)
		} catch (error) {
			if (error instanceof AppError && error.code === "crypto") return false
			throw error
		}
	}

	private readonly readFile = (
		parsed: ParsedBackup,
		crypto: NonNullable<RemoteProfile["crypto"]>,
		currentDek: Uint8Array,
		keys: ImportKeys,
	): readonly EntryPayload[] => {
		if (parsed.kind === "legacy") {
			if (keys.legacyKey === undefined) {
				throw new AppError("invalid-credentials", "Legacy key required")
			}
			return decryptLegacyItems(parsed.items, keys.legacyKey, this.legacy)
		}
		const same =
			parsed.crypto.wrappedDek === crypto.wrappedDek && parsed.crypto.rkVersion === crypto.rkVersion
		const fileDek = same ? currentDek : this.unwrapFileDek(parsed, keys)
		try {
			const failed: string[] = []
			const payloads = parsed.entries.flatMap(entry => {
				try {
					return [this.entryCodec.decrypt(fileDek, parsed.uid, entry.id, entry.ct)]
				} catch {
					failed.push(entry.id)
					return []
				}
			})
			if (failed.length > 0) throw new BackupVerificationError(failed)
			return payloads
		} finally {
			if (fileDek !== currentDek) fileDek.fill(0)
		}
	}

	private readonly unwrapFileDek = (
		parsed: Extract<ParsedBackup, { kind: "v2" }>,
		keys: ImportKeys,
	): Uint8Array => {
		if (keys.recoveryKey === undefined) {
			throw new AppError("invalid-recovery-key", "Invalid recovery key: required")
		}
		try {
			return this.vaultKeys.unwrapDek(
				keys.recoveryKey,
				parsed.crypto.wrappedDek,
				parsed.uid,
				parsed.crypto.rkVersion,
			)
		} catch (error) {
			if (error instanceof AppError && error.code === "crypto") {
				throw new AppError("invalid-recovery-key", "Invalid recovery key: mismatch", {
					cause: error,
				})
			}
			throw error
		}
	}

	private readonly decryptsWith = (
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
}
