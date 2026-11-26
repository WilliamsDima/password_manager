import { NobleCryptoService } from "@/shared/services/crypto"
import { FakeRandom, FakeRemoteStore } from "@/shared/testing"

import { formatRecoveryKey, VaultKeyService } from "../lib/vault-keys"
import { VaultRecoveryService } from "./vault-recovery-service"

const UID = "u1"

const setup = (withCrypto = true) => {
	const random = new FakeRandom()
	const vaultKeys = new VaultKeyService(new NobleCryptoService(random), random)
	const remote = new FakeRemoteStore()
	const rk = vaultKeys.generateRecoveryKey()
	const dek = vaultKeys.generateDek()
	remote.seedProfile({
		uid: UID,
		schemaVersion: withCrypto ? 2 : 1,
		email: null,
		displayName: null,
		crypto: withCrypto
			? {
					wrappedDek: vaultKeys.wrapDek(rk, dek, UID, 1),
					kdf: "hkdf-sha256",
					rkVersion: 1,
					createdAt: 1,
				}
			: null,
		legacyItems: undefined,
		migratedAt: null,
	})
	return { service: new VaultRecoveryService(remote, vaultKeys), rk, dek, vaultKeys, remote }
}

describe("VaultRecoveryService", () => {
	it("returns the DEK for the right key, however it is typed", async () => {
		const { service, rk, dek } = setup()
		const text = formatRecoveryKey(rk)

		expect(await service.recover(UID, text)).toEqual(dek)
		expect(await service.recover(UID, text.toLowerCase().replaceAll("-", " "))).toEqual(dek)
	})

	it("a typo is rejected by the checksum without asking the server", async () => {
		const { service, rk, remote } = setup()
		const spy = jest.spyOn(remote, "getProfile")
		const text = formatRecoveryKey(rk)
		const typo = `${text.slice(0, 5)}${text[5] === "0" ? "1" : "0"}${text.slice(6)}`

		await expect(service.recover(UID, typo)).rejects.toMatchObject({ code: "invalid-recovery-key" })
		expect(spy).not.toHaveBeenCalled()
	})

	it("a valid key of another account is a mismatch", async () => {
		const { service, vaultKeys } = setup()

		const error = await service
			.recover(UID, formatRecoveryKey(vaultKeys.generateRecoveryKey()))
			.catch((e: unknown) => e)

		expect(error).toMatchObject({ code: "invalid-recovery-key" })
		expect((error as Error).message).toContain("mismatch")
	})

	it("reports a profile without v2 keys", async () => {
		const { service, rk } = setup(false)

		await expect(service.recover(UID, formatRecoveryKey(rk))).rejects.toMatchObject({
			code: "not-found",
		})
	})
})
