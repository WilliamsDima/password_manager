/**
 * Remote storage of ciphertext (docs/CRYPTO.md §5). Implementation: `FirestoreSdkStore` on
 * `@react-native-firebase/firestore`. The adapter only maps documents and runs the transactions;
 * it never sees keys or plaintext. Values read from the server are untrusted: callers validate them.
 *
 * Failures throw `AppError` (`network`, `permission-denied`, `conflict`, …).
 *
 * Size guard: one transaction carries at most `MAX_TRANSACTION_ENTRIES` entries (conservative, far
 * below Firestore's request-size limit for ~1 KB documents); more rejects with `limit-exceeded`.
 */

/** `"server"` bypasses the offline cache (used by migration and backup checks). */
export type ReadSource = "default" | "server"

export type RemoteCrypto = {
	readonly wrappedDek: string
	readonly kdf: "hkdf-sha256"
	readonly rkVersion: number
	/** ms since epoch */
	readonly createdAt: number
}

/** What the app writes: `createdAt` is set by the server. */
export type RemoteCryptoInput = Omit<RemoteCrypto, "createdAt">

export type RemoteProfile = {
	readonly uid: string
	/** 1 when the field is missing (v1 profile). */
	readonly schemaVersion: number
	readonly email: string | null
	readonly displayName: string | null
	readonly crypto: RemoteCrypto | null
	/** v1 `items` array as stored (ciphertext); validated by the migration. `undefined` if absent. */
	readonly legacyItems: unknown
	/** ms since epoch */
	readonly migratedAt: number | null
}

export type RemoteEntry = {
	/** Document ID = entry UUID, also part of the AAD. */
	readonly id: string
	readonly ct: string
	/** ms since epoch; `null` while a local write has not reached the server yet. */
	readonly updatedAt: number | null
}

/** Conservative cap for migration / DEK-change transactions (docs/CRYPTO.md §8). */
export const MAX_TRANSACTION_ENTRIES = 400

export type EntryWrite = Pick<RemoteEntry, "id" | "ct">

/** One entry of a DEK change: the new ciphertext and the one it must still replace. */
export type EntryRewrite = EntryWrite & { readonly expectedCt: string }

export type IRemoteStore = {
	readonly getProfile: (uid: string, source: ReadSource) => Promise<RemoteProfile | null>
	readonly listEntries: (uid: string, source: ReadSource) => Promise<readonly RemoteEntry[]>
	/** Creates or replaces one entry document; `updatedAt` is set by the server. */
	readonly setEntry: (uid: string, entry: EntryWrite) => Promise<void>
	readonly deleteEntry: (uid: string, entryId: string) => Promise<void>

	/**
	 * v1 → v2 (§6.5), one transaction (online only, never queued offline): the profile must exist
	 * and have no `crypto`; writes all `entries`, `crypto`, `schemaVersion: 2`, `migratedAt`.
	 * Rejects with `AppError("conflict")` if `crypto` already exists.
	 */
	readonly migrateToV2: (
		uid: string,
		input: { readonly entries: readonly EntryWrite[]; readonly crypto: RemoteCryptoInput },
	) => Promise<void>

	/** Resolves when every queued local write has reached the server (before a DEK change). */
	readonly flushPendingWrites: () => Promise<void>

	/**
	 * Migration rollback (§6.6): deletes every entry, then drops `crypto`, `schemaVersion` and
	 * `migratedAt` in one write. `items` are never touched. Safe to repeat after a failure.
	 * The rules allow the final write only within 24 h of `migratedAt`, so the profile is read
	 * first and, 23 h after `migratedAt` or later, this rejects with `AppError("rollback-expired")`
	 * **before deleting anything** (otherwise the account would be left v2 with no entries). After
	 * a DEK change (`rkVersion` > 1) it rejects with `AppError("conflict")`: those entries are newer
	 * than the v1 data and must not be deleted.
	 */
	readonly rollbackMigration: (uid: string) => Promise<void>

	/**
	 * Full replacement of the entries (backup import, docs/CRYPTO.md §7), one transaction: every
	 * entry in `current` must still hold `expectedCt` and the profile must still be at
	 * `expectedRkVersion` (a DEK change on another device in between would make the new entries
	 * unreadable; else `AppError("conflict")`, nothing changes);
	 * all of them are deleted and `writes` are created. `current.length + writes.length` is
	 * capped by `MAX_TRANSACTION_ENTRIES` (`limit-exceeded`). An entry created after `current` was
	 * read is not detected (same limit as `rekey`).
	 */
	readonly replaceEntries: (
		uid: string,
		input: {
			/** `crypto.rkVersion` the entries are encrypted for; must still be the server's (else `conflict`). */
			readonly expectedRkVersion: number
			readonly current: readonly { readonly id: string; readonly expectedCt: string }[]
			readonly writes: readonly EntryWrite[]
		},
	) => Promise<void>

	/**
	 * DEK change (§2), one transaction: `crypto.rkVersion` must equal `expectedRkVersion` and every
	 * listed entry must still hold `expectedCt`; then all entries are replaced and `crypto` is
	 * written with `rkVersion + 1`. Rejects with `AppError("conflict")` if anything changed.
	 * An entry created after the list was read is not detected here: the caller flushes pending
	 * writes first and repairs stragglers afterwards (`VaultMigrationService.repairAfterDekChange`).
	 */
	readonly rekey: (
		uid: string,
		input: {
			readonly expectedRkVersion: number
			readonly entries: readonly EntryRewrite[]
			readonly crypto: RemoteCryptoInput
		},
	) => Promise<void>
}
