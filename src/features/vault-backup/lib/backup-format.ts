import { AppError } from "@/shared/lib/errors"

/** In-app backup (docs/CRYPTO.md §7). Ciphertext only: the file plus the recovery key is all the data. */
export const BACKUP_FORMAT = "password-manager-backup/v2"
const SCRIPT_FORMATS = [
	"password-manager-firestore-backup/v1",
	"password-manager-firestore-backup/v2",
] as const

export type BackupCrypto = {
	readonly wrappedDek: string
	readonly kdf: "hkdf-sha256"
	readonly rkVersion: number
}

export type BackupEntry = { readonly id: string; readonly ct: string }

export type BackupFileV2 = {
	readonly format: typeof BACKUP_FORMAT
	readonly exportedAt: string
	readonly uid: string
	readonly email: string | null
	readonly crypto: BackupCrypto
	readonly entries: readonly (BackupEntry & { readonly updatedAt: string | null })[]
	/** v1 data (old key) while it has not been deleted from the profile. */
	readonly legacyItems?: unknown
}

export type ParsedBackup =
	| {
			readonly kind: "v2"
			readonly uid: string
			readonly exportedAt: string
			readonly crypto: BackupCrypto
			readonly entries: readonly BackupEntry[]
	  }
	| { readonly kind: "legacy"; readonly exportedAt: string; readonly items: unknown }

const invalid = (): never => {
	throw new AppError("invalid-backup", "Not a valid backup file")
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value)

const parseCrypto = (value: unknown): BackupCrypto | null =>
	isRecord(value) &&
	typeof value.wrappedDek === "string" &&
	value.kdf === "hkdf-sha256" &&
	typeof value.rkVersion === "number" &&
	Number.isInteger(value.rkVersion) &&
	value.rkVersion >= 1
		? { wrappedDek: value.wrappedDek, kdf: "hkdf-sha256", rkVersion: value.rkVersion }
		: null

const parseEntries = (value: unknown): readonly BackupEntry[] | null => {
	if (!Array.isArray(value)) return null
	const entries = (value as readonly unknown[]).map(item =>
		isRecord(item) && typeof item.id === "string" && typeof item.ct === "string"
			? { id: item.id, ct: item.ct }
			: null,
	)
	const ids = entries.flatMap(entry => (entry === null ? [] : [entry.id]))
	// Duplicate ids would let one document win silently.
	if (entries.includes(null) || new Set(ids).size !== ids.length) return null
	return entries.flatMap(entry => (entry === null ? [] : [entry]))
}

const exportedAtOf = (value: unknown): string => (typeof value === "string" ? value : "")

export const serializeBackup = (backup: BackupFileV2): string => JSON.stringify(backup, null, 2)

/**
 * Reads the in-app format and the files of `scripts/backup-firestore.mjs` (v1: only old `items`;
 * v2: also `entries` and `crypto`). Anything else, damaged JSON included, is `invalid-backup`.
 */
export const parseBackupFile = (text: string): ParsedBackup => {
	const value = ((): unknown => {
		try {
			return JSON.parse(text) as unknown
		} catch {
			return invalid()
		}
	})()
	if (!isRecord(value)) return invalid()
	const format = value.format
	const exportedAt = exportedAtOf(value.exportedAt)

	if (format === BACKUP_FORMAT) {
		const crypto = parseCrypto(value.crypto)
		const entries = parseEntries(value.entries)
		if (crypto === null || entries === null || typeof value.uid !== "string") return invalid()
		return { kind: "v2", uid: value.uid, exportedAt, crypto, entries }
	}

	if (typeof format === "string" && (SCRIPT_FORMATS as readonly string[]).includes(format)) {
		const data = value.data
		if (!isRecord(data)) return invalid()
		const path = typeof value.path === "string" ? value.path : ""
		const uid = path.startsWith("users/") ? path.slice("users/".length) : ""
		const crypto = parseCrypto(data.crypto)
		const entries = parseEntries(value.entries)
		if (crypto !== null && entries !== null && uid !== "") {
			return { kind: "v2", uid, exportedAt, crypto, entries }
		}
		// A v2 script file with a broken crypto/entries part must not silently fall back to old items.
		if (data.crypto !== undefined || value.entries !== undefined) return invalid()
		if (Array.isArray(data.items)) return { kind: "legacy", exportedAt, items: data.items }
	}
	return invalid()
}
