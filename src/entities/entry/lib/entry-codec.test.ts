import { encodeUtf8 } from "@/shared/lib/encoding"
import { NobleCryptoService } from "@/shared/services/crypto"
import { FakeRandom } from "@/shared/testing"

import type { EntryPayload } from "../model/types"
import { entryAad } from "./entry-aad"
import { EntryCodec } from "./entry-codec"

const crypto = new NobleCryptoService(new FakeRandom())
const codec = new EntryCodec(crypto)
const dek = new Uint8Array(32).fill(5)
const ID = "11111111-1111-4111-8111-111111111111"

const payload: EntryPayload = {
	title: "Почта",
	login: "user@mail.ru",
	password: "п@ss🔑",
	url: "https://mail.ru",
	notes: "заметка",
	favorite: true,
	createdAt: 1_700_000_000_000,
	updatedAt: 1_700_000_100_000,
}
const minimal: EntryPayload = {
	title: "t",
	login: "l",
	password: "p",
	createdAt: 1,
	updatedAt: 2,
}

describe("EntryCodec", () => {
	it("round-trips a full and a minimal payload", () => {
		expect(codec.decrypt(dek, "uid", ID, codec.encrypt(dek, "uid", ID, payload))).toEqual(payload)
		expect(codec.decrypt(dek, "uid", ID, codec.encrypt(dek, "uid", ID, minimal))).toEqual(minimal)
	})

	it("pads the plaintext to a multiple of 64 bytes, hiding small length differences", () => {
		const plainLength = (value: EntryPayload): number =>
			crypto.decrypt(dek, codec.encrypt(dek, "uid", ID, value), entryAad("uid", ID)).length
		const lengths = Array.from({ length: 200 }, (_, n) =>
			plainLength({ ...minimal, password: "x".repeat(n) }),
		)

		expect(lengths.every(length => length % 64 === 0)).toBe(true)
		expect(plainLength({ ...minimal, password: "abcd" })).toBe(
			plainLength({ ...minimal, password: "abcdefgh" }),
		)
		expect(new Set(lengths).size).toBeLessThan(6)
	})

	it("binds the ciphertext to uid and entryId (no moving between documents or accounts)", () => {
		const envelope = codec.encrypt(dek, "uid", ID, payload)

		expect(() => codec.decrypt(dek, "other", ID, envelope)).toThrow("Decryption failed")
		expect(() =>
			codec.decrypt(dek, "uid", "22222222-2222-4222-8222-222222222222", envelope),
		).toThrow("Decryption failed")
	})

	it("fails with a wrong DEK", () => {
		const envelope = codec.encrypt(dek, "uid", ID, payload)

		expect(() => codec.decrypt(new Uint8Array(32).fill(6), "uid", ID, envelope)).toThrow(
			"Decryption failed",
		)
	})

	it.each([
		["not JSON", "not json"],
		["array", "[]"],
		["missing password", '{"title":"t","login":"l","createdAt":1,"updatedAt":2}'],
		["wrong type", '{"title":"t","login":"l","password":1,"createdAt":1,"updatedAt":2}'],
		[
			"bad optional",
			'{"title":"t","login":"l","password":"p","createdAt":1,"updatedAt":2,"url":5}',
		],
		["bad timestamp", '{"title":"t","login":"l","password":"p","createdAt":"1","updatedAt":2}'],
	])("rejects a tag-valid but malformed payload: %s", (_name, json) => {
		const envelope = crypto.encrypt(dek, encodeUtf8(json), entryAad("uid", ID))

		expect(() => codec.decrypt(dek, "uid", ID, envelope)).toThrow("Invalid entry payload")
	})
})
