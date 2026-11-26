import { scryptAsync } from "@noble/hashes/scrypt.js"
import { requireNativeModule } from "expo"

import { encodeUtf8, fromBase64, toBase64 } from "@/shared/lib/encoding"

import { NativeScryptKdf } from "./native-scrypt-kdf"

jest.mock("expo", () => ({ requireNativeModule: jest.fn() }))

const params = { algorithm: "scrypt", N: 16, r: 1, p: 1 } as const
const salt = new Uint8Array(16).fill(4)

/** Stand-in for the Kotlin module: the same scrypt, computed by noble. */
const fakeNative = {
	scrypt: jest.fn(
		async (password: string, saltBase64: string, n: number, r: number, p: number, len: number) =>
			toBase64(
				await scryptAsync(encodeUtf8(password), fromBase64(saltBase64), { N: n, r, p, dkLen: len }),
			),
	),
}

describe("NativeScryptKdf", () => {
	beforeEach(() => {
		jest.clearAllMocks()
		jest.mocked(requireNativeModule).mockReturnValue(fakeNative)
	})

	it("passes NFKC password, base64 salt and parameters; decodes the base64 result", async () => {
		const out = await new NativeScryptKdf().derive("é", salt, params, 32)

		expect(fakeNative.scrypt).toHaveBeenCalledWith("é", toBase64(salt), 16, 1, 1, 32)
		expect(out).toEqual(await scryptAsync(encodeUtf8("é"), salt, { N: 16, r: 1, p: 1, dkLen: 32 }))
	})

	it("loads the native module once, lazily", async () => {
		const kdf = new NativeScryptKdf()
		expect(requireNativeModule).not.toHaveBeenCalled()

		await kdf.derive("a", salt, params, 32)
		await kdf.derive("b", salt, params, 32)

		expect(requireNativeModule).toHaveBeenCalledTimes(1)
	})

	it("wraps native failures without echoing the password", async () => {
		fakeNative.scrypt.mockRejectedValueOnce(new Error("INVALID_PARAMS correct horse"))

		const error = await new NativeScryptKdf()
			.derive("correct horse", salt, params, 32)
			.catch((e: unknown) => e)

		expect(error).toMatchObject({ code: "crypto", message: "Key derivation failed" })
	})
})
