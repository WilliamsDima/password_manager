import { CryptoJsLegacyDecryptor } from "./cryptojs-legacy-decryptor"

// Fixtures produced by `openssl enc -aes-256-cbc -md md5 -salt -pass pass:<key> -a -A`, the same
// OpenSSL "Salted__" / EVP_BytesToKey(MD5) format that CryptoJS.AES.encrypt(text, passphrase) writes.
const KEY = "ключ-key 123"
const JSON_FIXTURE =
	"U2FsdGVkX18rPcFMEUItct0Yr0jHh4c8QOZqF4IX5RZoXpMwzwWTsbHpQq6n4+TdMBS0w5NDc8BbuYgzQaAGpvOd9yIBs23zPolXMF59aBOVteHL51eiSWPg7Dw3fr7D"
const SHORT_FIXTURE = "U2FsdGVkX1/vbtI/U4vnOndXfEbinHYNfjeylLdjDGM="

describe("CryptoJsLegacyDecryptor", () => {
	const decryptor = new CryptoJsLegacyDecryptor()

	it("decrypts an OpenSSL/CryptoJS payload with a non-ASCII key and UTF-8 content", () => {
		expect(decryptor.decrypt(JSON_FIXTURE, KEY)).toBe(
			'{"login":"user@mail.ru","password":"п@ss🔑","description":"заметка"}',
		)
	})

	it("returns the JSON.stringify form that v1 stored", () => {
		expect(decryptor.decrypt(SHORT_FIXTURE, "k")).toBe('"abc"')
	})

	it("fails (padding or garbage) with a wrong key, never returning the plaintext", () => {
		const attempt = (): string | null => {
			try {
				return decryptor.decrypt(JSON_FIXTURE, "wrong key")
			} catch (error) {
				expect(error).toMatchObject({ code: "crypto" })
				return null
			}
		}
		const result = attempt()

		// CBC has no MAC: a wrong key may rarely pass PKCS7 and give garbage, but never the real text.
		expect(result?.includes("user@mail.ru") ?? false).toBe(false)
	})

	it.each([
		["not base64", "###"],
		["no Salted__ header", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"],
		["header only", "U2FsdGVkX19ABCDEFGg="],
		["body not a multiple of 16", "U2FsdGVkX1/vbtI/U4vnOndXfEbinHYNfjeylA=="],
	])("rejects malformed input: %s", (_name, input) => {
		expect(() => decryptor.decrypt(input, KEY)).toThrow()
	})
})
