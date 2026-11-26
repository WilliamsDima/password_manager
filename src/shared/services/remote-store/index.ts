/**
 * Remote storage of ciphertext (docs/CRYPTO.md §5). Implementation: `FirestoreSdkStore` on
 * `@react-native-firebase/firestore` (5.x). The adapter only maps documents; it never sees keys
 * or plaintext. Values read from the server are untrusted: repositories validate them.
 *
 * Migration and backup import need transactional operations (§6.5, §7); they are added to this
 * interface in 5.2 / 5.5 together with their tests.
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

export type RemoteProfile = {
	readonly uid: string
	/** 1 when the field is missing (v1 profile). */
	readonly schemaVersion: number
	readonly email: string | null
	readonly displayName: string | null
	readonly crypto: RemoteCrypto | null
	/** v1 `items` array as stored (ciphertext); validated by the migration. */
	readonly legacyItems: unknown
	readonly migratedAt: number | null
}

export type RemoteEntry = {
	/** Document ID = entry UUID, also part of the AAD. */
	readonly id: string
	readonly ct: string
	/** ms since epoch; `null` while a local write has not reached the server yet. */
	readonly updatedAt: number | null
}

export type IRemoteStore = {
	readonly getProfile: (uid: string, source: ReadSource) => Promise<RemoteProfile | null>
	readonly listEntries: (uid: string, source: ReadSource) => Promise<readonly RemoteEntry[]>
	/** Creates or replaces one entry document; `updatedAt` is set by the server. */
	readonly setEntry: (uid: string, entry: Pick<RemoteEntry, "id" | "ct">) => Promise<void>
	readonly deleteEntry: (uid: string, entryId: string) => Promise<void>
}
