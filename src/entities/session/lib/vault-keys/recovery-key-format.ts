import { sha256 } from "@noble/hashes/sha2.js"

import { AppError } from "@/shared/lib/errors"

/**
 * Recovery Key text format (docs/CRYPTO.md §2.1): `RK (32 bytes) ‖ checksum` in Crockford Base32,
 * checksum = first 20 bits of SHA-256(RK). 276 bits + 4 zero padding bits = 56 characters,
 * shown as 14 groups of 4. The QR payload is `pmrk1:` + the same 56 characters.
 */
export const RECOVERY_KEY_BYTES = 32
export const QR_PREFIX = "pmrk1:"

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
const CHECKSUM_BITS = 20
const TOTAL_CHARS = 56
const PADDING_BITS = TOTAL_CHARS * 5 - RECOVERY_KEY_BYTES * 8 - CHECKSUM_BITS

export type RecoveryKeyParseFailure = "length" | "character" | "checksum" | "padding"

export type RecoveryKeyParseResult =
	| { readonly ok: true; readonly key: Uint8Array }
	| { readonly ok: false; readonly reason: RecoveryKeyParseFailure }

const checksumOf = (key: Uint8Array): number => {
	const digest = sha256(key)
	return (((digest[0] ?? 0) << 12) | ((digest[1] ?? 0) << 4) | ((digest[2] ?? 0) >> 4)) >>> 0
}

const bitsOf = (key: Uint8Array): readonly number[] => {
	const checksum = checksumOf(key)
	return [
		...Array.from(key).flatMap(byte => Array.from({ length: 8 }, (_, i) => (byte >> (7 - i)) & 1)),
		...Array.from({ length: CHECKSUM_BITS }, (_, i) => (checksum >> (CHECKSUM_BITS - 1 - i)) & 1),
		...Array.from({ length: PADDING_BITS }, () => 0),
	]
}

/** 56 Crockford Base32 characters, no separators. */
export const encodeRecoveryKeyRaw = (key: Uint8Array): string => {
	if (key.length !== RECOVERY_KEY_BYTES)
		throw new AppError("crypto", "Recovery key must be 32 bytes")
	const bits = bitsOf(key)
	return Array.from({ length: TOTAL_CHARS }, (_, i) => {
		const value = bits.slice(i * 5, i * 5 + 5).reduce((acc, bit) => (acc << 1) | bit, 0)
		return ALPHABET[value] ?? ""
	}).join("")
}

/** Display form: `XXXX-XXXX-…` (14 groups of 4). */
export const formatRecoveryKey = (key: Uint8Array): string =>
	(encodeRecoveryKeyRaw(key).match(/.{4}/g) ?? []).join("-")

export const formatRecoveryKeyQr = (key: Uint8Array): string =>
	`${QR_PREFIX}${encodeRecoveryKeyRaw(key)}`

const normalize = (text: string): string => {
	const trimmed = text.trim()
	const body = trimmed.toLowerCase().startsWith(QR_PREFIX)
		? trimmed.slice(QR_PREFIX.length)
		: trimmed
	return body.replace(/[\s-]/g, "").toUpperCase().replace(/O/g, "0").replace(/[IL]/g, "1")
}

/**
 * Parses typed, pasted or scanned text. Case, spaces and dashes are ignored, `O→0`, `I/L→1`.
 * One string ↔ one key: non-zero padding bits are rejected.
 */
export const parseRecoveryKey = (text: string): RecoveryKeyParseResult => {
	const chars = normalize(text)
	const values = Array.from(chars, char => ALPHABET.indexOf(char))
	if (values.includes(-1)) return { ok: false, reason: "character" }
	if (values.length !== TOTAL_CHARS) return { ok: false, reason: "length" }

	const bits = values.flatMap(value => Array.from({ length: 5 }, (_, i) => (value >> (4 - i)) & 1))
	const key = Uint8Array.from({ length: RECOVERY_KEY_BYTES }, (_, i) =>
		bits.slice(i * 8, i * 8 + 8).reduce((acc, bit) => (acc << 1) | bit, 0),
	)
	const checksumBits = bits.slice(RECOVERY_KEY_BYTES * 8, RECOVERY_KEY_BYTES * 8 + CHECKSUM_BITS)
	const checksum = checksumBits.reduce((acc, bit) => (acc << 1) | bit, 0)
	if (checksum !== checksumOf(key)) return { ok: false, reason: "checksum" }
	if (bits.slice(-PADDING_BITS).some(bit => bit !== 0)) return { ok: false, reason: "padding" }
	return { ok: true, key }
}
