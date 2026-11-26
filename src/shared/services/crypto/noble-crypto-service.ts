import { gcm } from "@noble/ciphers/aes.js"
import { hkdf } from "@noble/hashes/hkdf.js"
import { sha256 } from "@noble/hashes/sha2.js"

import { encodeUtf8, fromBase64Url, toBase64Url } from "@/shared/lib/encoding"
import { AppError } from "@/shared/lib/errors"
import type { IRandom } from "@/shared/services/random"

import type { Envelope, ICryptoService } from "./crypto"

const VERSION = "v2"
const KEY_LENGTH = 32
const NONCE_LENGTH = 12
const TAG_LENGTH = 16

const fail = (message: string, cause?: unknown): never => {
	throw new AppError("crypto", message, cause === undefined ? undefined : { cause })
}

/**
 * AES-256-GCM and HKDF-SHA256 on `@noble/*` (docs/CRYPTO.md §3). All randomness (nonces) comes from
 * `IRandom`; noble's own `randomBytes`/`managedNonce` are never used (no `crypto.getRandomValues`
 * in Hermes). Error messages are fixed strings: no key or plaintext bytes.
 */
export class NobleCryptoService implements ICryptoService {
	constructor(private readonly random: IRandom) {}

	public readonly encrypt = (key: Uint8Array, plaintext: Uint8Array, aad: Uint8Array): Envelope => {
		if (key.length !== KEY_LENGTH) return fail("Invalid key length")
		const nonce = this.random.bytes(NONCE_LENGTH)
		if (nonce.length !== NONCE_LENGTH) return fail("Invalid nonce length")
		const sealed = gcm(key, nonce, aad).encrypt(plaintext)
		return `${VERSION}.${toBase64Url(nonce)}.${toBase64Url(sealed)}`
	}

	public readonly decrypt = (key: Uint8Array, envelope: Envelope, aad: Uint8Array): Uint8Array => {
		if (key.length !== KEY_LENGTH) return fail("Invalid key length")
		const parts = envelope.split(".")
		if (parts.length !== 3 || parts[0] !== VERSION) return fail("Unknown envelope format")
		const [, nonceText = "", sealedText = ""] = parts
		const nonce = fromBase64Url(nonceText)
		const sealed = fromBase64Url(sealedText)
		if (nonce.length !== NONCE_LENGTH || sealed.length < TAG_LENGTH) {
			return fail("Malformed envelope")
		}
		try {
			return gcm(key, nonce, aad).decrypt(sealed)
		} catch (error) {
			// Wrong key, wrong AAD (entry moved between documents or accounts) and tampering all land here.
			return fail("Decryption failed", error)
		}
	}

	public readonly hkdf = (
		ikm: Uint8Array,
		salt: Uint8Array,
		info: string,
		length: number,
	): Uint8Array => hkdf(sha256, ikm, salt, encodeUtf8(info), length)
}
