/**
 * Crypto primitives (docs/CRYPTO.md §2–4). Implementations arrive in 5.1:
 * `NobleCryptoService` (`@noble/ciphers` gcm, `@noble/hashes` hkdf) and `NobleScryptKdf`.
 * Key material is passed as `Uint8Array` so callers can wipe it with `fill(0)`.
 * Failures throw `AppError("crypto")`; messages never include key or plaintext bytes.
 */

/** AES-256-GCM envelope in the versioned text format `v2.<base64url(nonce)>.<base64url(ct‖tag)>`. */
export type Envelope = string

export type ICryptoService = {
	/** Encrypts with a fresh 96-bit nonce from `IRandom`; `aad` binds the ciphertext to its context. */
	readonly encrypt: (key: Uint8Array, plaintext: Uint8Array, aad: Uint8Array) => Envelope
	/** Verifies the tag and decrypts; an unknown version or tag mismatch throws. */
	readonly decrypt: (key: Uint8Array, envelope: Envelope, aad: Uint8Array) => Uint8Array
	/** HKDF-SHA256. */
	readonly hkdf: (ikm: Uint8Array, salt: Uint8Array, info: string, length: number) => Uint8Array
}

/** Password KDF parameters, stored next to the local wrapper so they can change later (§4). */
export type KdfParams = {
	readonly algorithm: "scrypt"
	readonly N: number
	readonly r: number
	readonly p: number
}

/** Password-based KDF. Async so a native implementation can replace the JS one (§4, task 5.3). */
export type IKdf = {
	readonly derive: (
		password: string,
		salt: Uint8Array,
		params: KdfParams,
		length: number,
	) => Promise<Uint8Array>
}
