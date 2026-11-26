/**
 * The only source of randomness (docs/CRYPTO.md §3): RK, DEK, nonces, salts and UUIDs.
 * Implementation: `ExpoRandom` (`expo-crypto`). Never use `Math.random` or noble `randomBytes`
 * (Hermes has no `crypto.getRandomValues`).
 */
export type IRandom = {
	/** Cryptographically secure random bytes. */
	readonly bytes: (length: number) => Uint8Array
	/** Random UUID v4 (entry IDs). */
	readonly uuid: () => string
}
