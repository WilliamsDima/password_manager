import { AppError } from "@/shared/lib/errors"
import { NobleCryptoService } from "@/shared/services/crypto"
import { FakeRandom, FakeRemoteStore } from "@/shared/testing"

import { EntryCodec } from "../lib/entry-codec"
import { EntryRepository } from "./entry-repository"

const UID = "user-1"
const NOW = 1_800_000_000_000

const setup = () => {
	const random = new FakeRandom()
	const crypto = new NobleCryptoService(random)
	const remote = new FakeRemoteStore()
	const dek = random.bytes(32)
	const state = { locked: false, now: NOW, dek }
	const repo = new EntryRepository(
		remote,
		new EntryCodec(crypto),
		{
			getDek: () => {
				if (state.locked) throw new AppError("secure-storage", "Vault is locked")
				return state.dek
			},
		},
		random,
		() => state.now,
	)
	return { repo, remote, state, random, crypto }
}

const input = (title: string) => ({
	title,
	login: `${title}@mail.ru`,
	password: "p@ss",
	notes: "n",
})

describe("EntryRepository", () => {
	it("creates, lists, updates and removes entries", async () => {
		const { repo, state } = setup()
		const { entry: created, synced } = await repo.create(UID, input("Почта"))
		expect(synced).toBe(true)
		expect(created).toMatchObject({ title: "Почта", createdAt: NOW, updatedAt: NOW })

		state.now = NOW + 5000
		const { entry: updated } = await repo.update(UID, {
			...created,
			password: "new",
			favorite: true,
		})
		expect(updated).toMatchObject({ password: "new", favorite: true, createdAt: NOW })
		expect(updated.updatedAt).toBe(NOW + 5000)

		const { entries, unreadable } = await repo.list(UID)
		expect(unreadable).toEqual([])
		expect(entries).toEqual([updated])

		expect(await repo.remove(UID, created.id)).toEqual({ synced: true })
		expect((await repo.list(UID)).entries).toEqual([])
	})

	it("never stores plaintext on the server", async () => {
		const { repo, remote } = setup()
		await repo.create(UID, input("Банк"))
		const stored = JSON.stringify([...remote.entries.values()])
		expect(stored).not.toContain("Банк")
		expect(stored).not.toContain("p@ss")
	})

	it("reports unreadable documents without failing the list", async () => {
		const { repo, remote } = setup()
		const { entry: good } = await repo.create(UID, input("Хорошая"))
		const other = setup()
		const { entry: foreign } = await other.repo.create(UID, input("Чужая"))
		const foreignCt = other.remote.entries.get(foreign.id)?.ct ?? ""
		remote.entries.set("broken", { id: "broken", ct: foreignCt, updatedAt: 1 })
		const result = await repo.list(UID)
		expect(result.entries.map(entry => entry.id)).toEqual([good.id])
		expect(result.unreadable).toEqual(["broken"])
	})

	it("does not decrypt a document moved to another ID or account", async () => {
		const { repo, remote } = setup()
		const { entry } = await repo.create(UID, input("Почта"))
		const ct = remote.entries.get(entry.id)?.ct ?? ""
		remote.entries.set("other-id", { id: "other-id", ct, updatedAt: 1 })
		expect((await repo.list(UID)).unreadable).toEqual(["other-id"])
		expect((await repo.list("user-2")).entries).toEqual([])
	})

	it("rejects while the vault is locked", async () => {
		const { repo, state } = setup()
		const { entry } = await repo.create(UID, input("Почта"))
		state.locked = true
		await expect(repo.list(UID)).rejects.toMatchObject({ code: "secure-storage" })
		await expect(repo.create(UID, input("X"))).rejects.toMatchObject({ code: "secure-storage" })
		await expect(repo.update(UID, entry)).rejects.toMatchObject({ code: "secure-storage" })
	})

	it("leaves the vault key intact and works on a copy", async () => {
		const { repo, state } = setup()
		const before = Uint8Array.from(state.dek)
		await repo.create(UID, input("Почта"))
		await repo.list(UID)
		expect(state.dek).toEqual(before)
	})

	it("reports writes held in the offline queue as not synced", async () => {
		const { repo, remote } = setup()
		remote.offline = true
		const { entry, synced } = await repo.create(UID, input("Почта"))
		expect(synced).toBe(false)
		expect((await repo.update(UID, entry)).synced).toBe(false)
		expect(await repo.remove(UID, entry.id)).toEqual({ synced: false })
	})

	it("propagates a network failure of the store", async () => {
		const { repo, remote } = setup()
		remote.failNextListEntries = true
		await expect(repo.list(UID)).rejects.toMatchObject({ code: "network" })
	})
})
