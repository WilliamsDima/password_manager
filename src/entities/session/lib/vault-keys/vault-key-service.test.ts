import { NobleCryptoService } from "@/shared/services/crypto"
import { FakeRandom } from "@/shared/testing"

import { VaultKeyService } from "./vault-key-service"

describe("VaultKeyService", () => {
	const random = new FakeRandom()
	const crypto = new NobleCryptoService(random)
	const service = new VaultKeyService(crypto, random)

	it("generates 256-bit keys that differ between calls", () => {
		expect(service.generateRecoveryKey()).toHaveLength(32)
		expect(service.generateDek()).toHaveLength(32)
		expect(service.generateDek()).not.toEqual(service.generateDek())
	})

	it("unwraps the DEK with the same recovery key, uid and rkVersion", () => {
		const rk = service.generateRecoveryKey()
		const dek = service.generateDek()
		const wrapped = service.wrapDek(rk, dek, "uid-1", 1)

		expect(wrapped).toMatch(/^v2\./)
		expect(service.unwrapDek(rk, wrapped, "uid-1", 1)).toEqual(dek)
	})

	it("rejects a wrong recovery key (this is the key check, C4)", () => {
		const dek = service.generateDek()
		const wrapped = service.wrapDek(service.generateRecoveryKey(), dek, "uid-1", 1)

		expect(() => service.unwrapDek(service.generateRecoveryKey(), wrapped, "uid-1", 1)).toThrow(
			"Decryption failed",
		)
	})

	it("binds the wrapped DEK to the account and to rkVersion", () => {
		const rk = service.generateRecoveryKey()
		const wrapped = service.wrapDek(rk, service.generateDek(), "uid-1", 1)

		expect(() => service.unwrapDek(rk, wrapped, "uid-2", 1)).toThrow("Decryption failed")
		expect(() => service.unwrapDek(rk, wrapped, "uid-1", 2)).toThrow("Decryption failed")
	})

	it("re-wrapping with a new recovery key keeps the same DEK (RK reissue)", () => {
		const dek = service.generateDek()
		const oldRk = service.generateRecoveryKey()
		const newRk = service.generateRecoveryKey()
		const rewrapped = service.wrapDek(
			newRk,
			service.unwrapDek(oldRk, service.wrapDek(oldRk, dek, "u", 1), "u", 1),
			"u",
			2,
		)

		expect(service.unwrapDek(newRk, rewrapped, "u", 2)).toEqual(dek)
		expect(() => service.unwrapDek(oldRk, rewrapped, "u", 2)).toThrow()
	})

	it("rejects a recovery key that is not 32 bytes", () => {
		expect(() => service.wrapDek(new Uint8Array(16), service.generateDek(), "u", 1)).toThrow(
			"Invalid key length",
		)
	})

	it("rejects a DEK of the wrong size and an invalid account or version", () => {
		const rk = service.generateRecoveryKey()

		expect(() => service.wrapDek(rk, new Uint8Array(16), "u", 1)).toThrow("Invalid key length")
		expect(() => service.wrapDek(rk, service.generateDek(), "", 1)).toThrow("Invalid key context")
		expect(() => service.wrapDek(rk, service.generateDek(), "u", 0)).toThrow("Invalid key context")
		expect(() => service.wrapDek(rk, service.generateDek(), "u", Number.NaN)).toThrow(
			"Invalid key context",
		)
	})
})
