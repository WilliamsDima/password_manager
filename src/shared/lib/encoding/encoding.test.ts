import { decodeUtf8, encodeUtf8, fromBase64, fromBase64Url, toBase64, toBase64Url } from "./index"

const bytes = (...values: number[]): Uint8Array => new Uint8Array(values)

describe("encoding", () => {
	it.each([
		["", ""],
		["f", "Zg=="],
		["fo", "Zm8="],
		["foo", "Zm9v"],
		["foob", "Zm9vYg=="],
		["fooba", "Zm9vYmE="],
		["foobar", "Zm9vYmFy"],
	])("base64 matches RFC 4648 vector %p", (plain, expected) => {
		const input = new Uint8Array(Array.from(plain, char => char.charCodeAt(0)))
		expect(toBase64(input)).toBe(expected)
		expect(fromBase64(expected)).toEqual(input)
	})

	it("base64url is unpadded and uses - and _", () => {
		expect(toBase64Url(bytes(0xfb, 0xff, 0xfe))).toBe("-__-")
		expect(toBase64Url(bytes(0xff))).toBe("_w")
		expect(fromBase64Url("_w")).toEqual(bytes(0xff))
	})

	it("round-trips every length and all byte values", () => {
		const all = new Uint8Array(256).map((_, i) => i)
		Array.from({ length: 41 }, (_, length) => all.subarray(length, length + 40 + length)).forEach(
			input => {
				expect(fromBase64(toBase64(input))).toEqual(input)
				expect(fromBase64Url(toBase64Url(input))).toEqual(input)
			},
		)
	})

	it.each(["Zg=", "Zm9v!", "Z", "Zm9vY"])("rejects malformed base64 %p", text => {
		expect(() => fromBase64(text)).toThrow("Invalid base64 data")
	})

	it("rejects characters of the other alphabet in base64url", () => {
		expect(() => fromBase64Url("ab+/")).toThrow("Invalid base64 data")
	})

	it("round-trips UTF-8 including astral characters", () => {
		const text = "Пароль ключ 🔑 日本"
		expect(decodeUtf8(encodeUtf8(text))).toBe(text)
	})

	it.each([[[0xff]], [[0xc3]], [[0xc0, 0x80]], [[0xed, 0xa0, 0x80]], [[0xf4, 0x90, 0x80, 0x80]]])(
		"rejects invalid UTF-8 %p",
		raw => {
			expect(() => decodeUtf8(new Uint8Array(raw))).toThrow("Invalid UTF-8 data")
		},
	)
})
