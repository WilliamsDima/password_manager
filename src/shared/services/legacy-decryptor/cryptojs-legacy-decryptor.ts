import { cbc } from "@noble/ciphers/aes.js"
import { md5 } from "@noble/hashes/legacy.js"
import { concatBytes } from "@noble/hashes/utils.js"

import { decodeUtf8, encodeUtf8, fromBase64 } from "@/shared/lib/encoding"
import { AppError } from "@/shared/lib/errors"

import type { ILegacyDecryptor } from "./legacy-decryptor"

const MAGIC = encodeUtf8("Salted__")
const SALT_LENGTH = 8
const KEY_LENGTH = 32
const IV_LENGTH = 16

/** OpenSSL `EVP_BytesToKey` with MD5 and one iteration, as used by `CryptoJS.AES.encrypt(text, passphrase)`. */
const evpBytesToKey = (
	passphrase: Uint8Array,
	salt: Uint8Array,
): { readonly key: Uint8Array; readonly iv: Uint8Array } => {
	const blocks = Array.from({ length: Math.ceil((KEY_LENGTH + IV_LENGTH) / 16) }).reduce<
		readonly Uint8Array[]
	>(acc => [...acc, md5(concatBytes(acc.at(-1) ?? new Uint8Array(0), passphrase, salt))], [])
	const material = concatBytes(...blocks)
	return {
		key: material.slice(0, KEY_LENGTH),
		iv: material.slice(KEY_LENGTH, KEY_LENGTH + IV_LENGTH),
	}
}

/**
 * Decrypt-only reader of the v1 format (docs/CRYPTO.md §6). v1 is `base64("Salted__" ‖ salt ‖ AES-256-CBC)`.
 * CBC has no MAC: a wrong key usually fails PKCS7 padding, but about 1 in 256 wrong keys passes
 * and yields garbage, so callers must validate the shape of the parsed result.
 */
export class CryptoJsLegacyDecryptor implements ILegacyDecryptor {
	public readonly decrypt = (ciphertext: string, legacyKey: string): string => {
		const raw = this.parse(ciphertext)
		const salt = raw.slice(MAGIC.length, MAGIC.length + SALT_LENGTH)
		const body = raw.slice(MAGIC.length + SALT_LENGTH)
		if (body.length === 0 || body.length % 16 !== 0) {
			throw new AppError("crypto", "Malformed legacy ciphertext")
		}
		const { key, iv } = evpBytesToKey(encodeUtf8(legacyKey), salt)
		try {
			return decodeUtf8(cbc(key, iv).decrypt(body))
		} catch (error) {
			throw new AppError("crypto", "Legacy decryption failed", { cause: error })
		} finally {
			key.fill(0)
			iv.fill(0)
		}
	}

	private readonly parse = (ciphertext: string): Uint8Array => {
		const raw = fromBase64(ciphertext)
		const hasMagic = MAGIC.every((byte, index) => raw[index] === byte)
		if (!hasMagic || raw.length < MAGIC.length + SALT_LENGTH) {
			throw new AppError("crypto", "Malformed legacy ciphertext")
		}
		return raw
	}
}
