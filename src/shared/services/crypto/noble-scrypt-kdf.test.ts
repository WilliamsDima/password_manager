import { bytesToHex } from "@noble/hashes/utils.js"

import { NobleScryptKdf } from "./noble-scrypt-kdf"

describe("NobleScryptKdf", () => {
	const kdf = new NobleScryptKdf()
	const params = { algorithm: "scrypt", N: 16, r: 1, p: 1 } as const

	it("matches the RFC 7914 test vector (empty password and salt)", async () => {
		const out = await kdf.derive("", new Uint8Array(0), params, 64)

		expect(bytesToHex(out)).toBe(
			"77d6576238657b203b19ca42c18a0497f16b4844e3074ae8dfdffa3fede21442fcd0069ded0948f8326a753a0fc81f17e8d3e0fb2e0d3628cf35e20c38d18906",
		)
	})

	it("depends on password, salt and parameters", async () => {
		const salt = new Uint8Array(16).fill(3)
		const base = await kdf.derive("пароль", salt, params, 32)

		expect(await kdf.derive("пароль", salt, params, 32)).toEqual(base)
		expect(await kdf.derive("пароль2", salt, params, 32)).not.toEqual(base)
		expect(await kdf.derive("пароль", new Uint8Array(16).fill(4), params, 32)).not.toEqual(base)
		expect(await kdf.derive("пароль", salt, { ...params, N: 32 }, 32)).not.toEqual(base)
	})

	it("treats canonically equivalent Unicode passwords as the same password", async () => {
		const salt = new Uint8Array(16)

		expect(await kdf.derive("é", salt, params, 32)).toEqual(await kdf.derive("é", salt, params, 32))
	})

	it("wraps invalid parameters into AppError('crypto')", async () => {
		await expect(kdf.derive("p", new Uint8Array(1), { ...params, N: 3 }, 32)).rejects.toMatchObject(
			{
				code: "crypto",
				message: "Key derivation failed",
			},
		)
	})

	it("rejects an unknown algorithm read from stored parameters", async () => {
		const stored = JSON.parse('{"algorithm":"md5","N":16,"r":1,"p":1}') as typeof params

		await expect(kdf.derive("p", new Uint8Array(1), stored, 32)).rejects.toMatchObject({
			message: "Unsupported KDF",
		})
	})
})
