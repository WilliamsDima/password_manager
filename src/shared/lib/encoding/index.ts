/** Dependency-free base64 / base64url / UTF-8 helpers (Hermes `atob`/`btoa` are not relied on). */
import { utf8ToBytes } from "@noble/hashes/utils.js"

import { AppError } from "@/shared/lib/errors"

const STANDARD = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
const URL_SAFE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"

const encode = (bytes: Uint8Array, alphabet: string, pad: boolean): string => {
	const chars = Array.from({ length: Math.ceil(bytes.length / 3) }, (_, group) => {
		const i = group * 3
		const n = ((bytes[i] ?? 0) << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0)
		const available = Math.min(3, bytes.length - i) + 1
		return Array.from({ length: 4 }, (_unused, k) =>
			k < available ? (alphabet[(n >> (18 - 6 * k)) & 63] ?? "") : pad ? "=" : "",
		).join("")
	})
	return chars.join("")
}

const decode = (text: string, alphabet: string, padded: boolean): Uint8Array => {
	const body = padded ? text.replace(/={0,2}$/, "") : text
	const values = Array.from(body, char => alphabet.indexOf(char))
	if (values.includes(-1) || body.length % 4 === 1 || (padded && text.length % 4 !== 0)) {
		throw new AppError("crypto", "Invalid base64 data")
	}
	const out = new Uint8Array(Math.floor((body.length * 3) / 4))
	values.forEach((value, index) => {
		const bitOffset = index * 6
		const byte = bitOffset >> 3
		const shift = 10 - (bitOffset & 7)
		// A 6-bit group straddles at most two output bytes.
		if (byte < out.length) out[byte] = (out[byte] ?? 0) | ((value << shift) >> 8)
		if (byte + 1 < out.length) out[byte + 1] = (out[byte + 1] ?? 0) | ((value << shift) & 0xff)
	})
	return out
}

export const toBase64 = (bytes: Uint8Array): string => encode(bytes, STANDARD, true)

export const fromBase64 = (text: string): Uint8Array => decode(text, STANDARD, true)

/** RFC 4648 §5, no padding. */
export const toBase64Url = (bytes: Uint8Array): string => encode(bytes, URL_SAFE, false)

export const fromBase64Url = (text: string): Uint8Array => decode(text, URL_SAFE, false)

export const encodeUtf8 = (text: string): Uint8Array => utf8ToBytes(text)

const MIN_CODE_POINT = [0, 0x80, 0x800, 0x10000] as const

const invalidUtf8 = (): never => {
	throw new AppError("crypto", "Invalid UTF-8 data")
}

const continuationBits = (bytes: Uint8Array, index: number): number => {
	const byte = bytes[index]
	return byte !== undefined && (byte & 0xc0) === 0x80 ? byte & 0x3f : invalidUtf8()
}

/** Number of continuation bytes announced by the lead byte. */
const extraBytesOf = (lead: number): 0 | 1 | 2 | 3 => {
	if (lead < 0x80) return 0
	if (lead >= 0xc0 && lead < 0xe0) return 1
	if (lead >= 0xe0 && lead < 0xf0) return 2
	return lead >= 0xf0 && lead < 0xf8 ? 3 : invalidUtf8()
}

/** Strict UTF-8: overlong forms, surrogates, truncated and out-of-range sequences throw. */
export const decodeUtf8 = (bytes: Uint8Array): string => {
	// Iterative on purpose: entry notes can be long and recursion depth is limited in Hermes.
	const cursor = { index: 0 }
	const codePoints: number[] = []
	while (cursor.index < bytes.length) {
		const start = cursor.index
		const lead = bytes[start] ?? 0
		const extra = extraBytesOf(lead)
		const codePoint = Array.from({ length: extra }).reduce<number>(
			(acc, _unused, k) => (acc << 6) | continuationBits(bytes, start + 1 + k),
			extra === 0 ? lead : lead & (0x3f >> extra),
		)
		if (
			codePoint < MIN_CODE_POINT[extra] ||
			codePoint > 0x10ffff ||
			(codePoint >= 0xd800 && codePoint <= 0xdfff)
		) {
			invalidUtf8()
		}
		codePoints.push(codePoint)
		cursor.index += extra + 1
	}
	return codePoints.map(codePoint => String.fromCodePoint(codePoint)).join("")
}
