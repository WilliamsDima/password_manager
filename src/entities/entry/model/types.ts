/** Decrypted entry payload, encrypted as a whole (docs/CRYPTO.md §3, SECURITY_AUDIT L3). */
export type EntryPayload = {
	readonly title: string
	readonly login: string
	readonly password: string
	readonly url?: string
	readonly notes?: string
	readonly favorite?: boolean
	/** ms since epoch */
	readonly createdAt: number
	readonly updatedAt: number
}

export type Entry = EntryPayload & {
	/** UUID v4: Firestore document ID and part of the AAD. */
	readonly id: string
}
