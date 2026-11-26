import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js"

import { encodeUtf8, fromBase64Url } from "@/shared/lib/encoding"
import type { IRandom } from "@/shared/services/random"
import { FakeRandom } from "@/shared/testing"

import { NobleCryptoService } from "./noble-crypto-service"

const key = new Uint8Array(32).fill(1)
const aad = encodeUtf8("pm/v2/entry|uid|id")
const plaintext = encodeUtf8("secret")

const withTag = (envelope: string, index: 1 | 2, edit: (part: string) => string): string =>
	envelope
		.split(".")
		.map((part, i) => (i === index ? edit(part) : part))
		.join(".")

describe("NobleCryptoService", () => {
	const crypto = new NobleCryptoService(new FakeRandom())

	it("round-trips and produces the v2.<nonce>.<ct> format", () => {
		const envelope = crypto.encrypt(key, plaintext, aad)

		expect(envelope).toMatch(/^v2\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+$/)
		expect(crypto.decrypt(key, envelope, aad)).toEqual(plaintext)
	})

	it("matches the McGrew–Viega AES-256-GCM test vector", () => {
		// Test case 15 (AES-256, 96-bit IV, no AAD) through a fixed-nonce random.
		const nistKey = hexToBytes("feffe9928665731c6d6a8f9467308308feffe9928665731c6d6a8f9467308308")
		const nonce = hexToBytes("cafebabefacedbaddecaf888")
		const fixed: IRandom = { bytes: () => nonce, uuid: () => "" }
		const pt = hexToBytes(
			"d9313225f88406e5a55909c5aff5269a86a7a9531534f7da2e4c303d8a318a721c3c0c95956809532fcf0e2449a6b525b16aedf5aa0de657ba637b391aafd255",
		)

		const envelope = new NobleCryptoService(fixed).encrypt(nistKey, pt, new Uint8Array(0))
		const sealed = fromBase64Url(envelope.split(".")[2] ?? "")

		expect(bytesToHex(sealed.subarray(0, 16))).toBe("522dc1f099567d07f47f37a32a84427d")
		expect(bytesToHex(sealed.subarray(-16))).toBe("b094dac5d93471bdec1a502270e3cc6c")
	})

	it("uses a fresh nonce for every encryption", () => {
		const a = crypto.encrypt(key, plaintext, aad)
		const b = crypto.encrypt(key, plaintext, aad)

		expect(a.split(".")[1]).not.toBe(b.split(".")[1])
	})

	it("rejects a wrong key, a wrong AAD and every kind of tampering", () => {
		const envelope = crypto.encrypt(key, plaintext, aad)

		expect(() => crypto.decrypt(new Uint8Array(32).fill(2), envelope, aad)).toThrow(
			"Decryption failed",
		)
		expect(() => crypto.decrypt(key, envelope, encodeUtf8("pm/v2/entry|uid|other"))).toThrow(
			"Decryption failed",
		)
		expect(() =>
			crypto.decrypt(
				key,
				withTag(envelope, 2, p => `${p.slice(0, -2)}AA`),
				aad,
			),
		).toThrow("Decryption failed")
		expect(() =>
			crypto.decrypt(
				key,
				withTag(envelope, 1, p => `A${p.slice(1)}`),
				aad,
			),
		).toThrow("Decryption failed")
	})

	it.each(["", "v2", "v2.a", "v1.AAAAAAAAAAAAAAAA.AAAA", "v3.AAAAAAAAAAAAAAAA.AAAA", "a.b.c.d"])(
		"rejects malformed or unknown envelope %p",
		envelope => {
			expect(() => crypto.decrypt(key, envelope, aad)).toThrow()
		},
	)

	it("rejects keys that are not 256 bits", () => {
		expect(() => crypto.encrypt(new Uint8Array(16), plaintext, aad)).toThrow("Invalid key length")
		expect(() => crypto.decrypt(new Uint8Array(31), "v2.a.b", aad)).toThrow("Invalid key length")
	})

	it("never puts key or plaintext bytes into error messages", () => {
		const envelope = crypto.encrypt(key, plaintext, aad)
		const message = (() => {
			try {
				crypto.decrypt(new Uint8Array(32).fill(2), envelope, aad)
				return ""
			} catch (error) {
				return String(error)
			}
		})()

		expect(message).not.toContain("secret")
		expect(message).not.toContain(envelope)
	})

	it("implements HKDF-SHA256 (RFC 5869 test case 3: empty salt and info)", () => {
		const okm = crypto.hkdf(new Uint8Array(22).fill(0x0b), new Uint8Array(0), "", 42)

		expect(bytesToHex(okm)).toBe(
			"8da4e775a563c18f715f802a063c5a31b8a11f5c5ee1879ec3454e5f3c738d2d9d201395faa4b61a96c8",
		)
	})

	it("derives different keys for different info and salt", () => {
		const ikm = new Uint8Array(32).fill(9)
		const salt = encodeUtf8("uid")
		const a = crypto.hkdf(ikm, salt, "pm/v2/kek", 32)

		expect(crypto.hkdf(ikm, salt, "pm/v2/kek", 32)).toEqual(a)
		expect(crypto.hkdf(ikm, salt, "pm/v2/other", 32)).not.toEqual(a)
		expect(crypto.hkdf(ikm, encodeUtf8("uid2"), "pm/v2/kek", 32)).not.toEqual(a)
	})
})
