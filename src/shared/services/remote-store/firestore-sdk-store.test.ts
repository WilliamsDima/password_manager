import * as firestore from "@react-native-firebase/firestore"

import { FirestoreSdkStore } from "./firestore-sdk-store"

jest.mock("@react-native-firebase/firestore", () => ({
	collection: jest.fn(),
	deleteDoc: jest.fn(),
	deleteField: jest.fn(() => "DELETE_FIELD"),
	doc: jest.fn((_parent: unknown, ...path: string[]) => ({ path: path.join("/") })),
	getDoc: jest.fn(),
	getDocFromServer: jest.fn(),
	getDocs: jest.fn(),
	getDocsFromServer: jest.fn(),
	getFirestore: jest.fn(() => "db"),
	runTransaction: jest.fn(),
	serverTimestamp: jest.fn(() => "SERVER_TS"),
	setDoc: jest.fn(),
	updateDoc: jest.fn(),
	waitForPendingWrites: jest.fn(() => Promise.resolve()),
	writeBatch: jest.fn(),
}))

const sdk = jest.mocked(firestore)
const store = new FirestoreSdkStore()

const snapshot = (data: unknown, exists = true) => ({ exists: () => exists, data: () => data })

describe("FirestoreSdkStore", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it("maps a v1 profile and a v2 profile", async () => {
		sdk.getDocFromServer.mockResolvedValueOnce(
			snapshot({ email: "a@b.c", items: [{ id: 1 }] }) as never,
		)
		sdk.getDocFromServer.mockResolvedValueOnce(
			snapshot({
				schemaVersion: 2,
				crypto: {
					wrappedDek: "v2.a.b",
					kdf: "hkdf-sha256",
					rkVersion: 1,
					createdAt: { toMillis: () => 5 },
				},
				migratedAt: { toMillis: () => 7 },
			}) as never,
		)

		expect(await store.getProfile("u", "server")).toMatchObject({
			schemaVersion: 1,
			crypto: null,
			legacyItems: [{ id: 1 }],
			migratedAt: null,
		})
		expect(await store.getProfile("u", "server")).toMatchObject({
			schemaVersion: 2,
			crypto: { wrappedDek: "v2.a.b", rkVersion: 1, createdAt: 5 },
			migratedAt: 7,
		})
	})

	it("returns null for a missing profile and rejects a malformed crypto field", async () => {
		sdk.getDoc.mockResolvedValueOnce(snapshot(undefined, false) as never)
		sdk.getDoc.mockResolvedValueOnce(snapshot({ crypto: { wrappedDek: 1 } }) as never)

		expect(await store.getProfile("u", "default")).toBeNull()
		await expect(store.getProfile("u", "default")).rejects.toMatchObject({ code: "crypto" })
	})

	it("translates Firebase error codes to AppError without Firebase text", async () => {
		sdk.getDoc.mockRejectedValueOnce({
			code: "firestore/permission-denied",
			message: "secret path",
		})
		sdk.getDoc.mockRejectedValueOnce({ code: "firestore/unavailable" })

		await expect(store.getProfile("u", "default")).rejects.toMatchObject({
			code: "permission-denied",
			message: "Remote storage failed",
		})
		await expect(store.getProfile("u", "default")).rejects.toMatchObject({ code: "network" })
	})

	it("migrateToV2 refuses a profile that already has crypto (inside the transaction)", async () => {
		const set = jest.fn()
		const update = jest.fn()
		sdk.runTransaction.mockImplementation(((_db: unknown, fn: (tx: unknown) => Promise<void>) =>
			fn({
				get: () => Promise.resolve(snapshot({ crypto: {} })),
				set,
				update,
			})) as never)

		await expect(
			store.migrateToV2("u", {
				entries: [{ id: "e", ct: "v2.a.b" }],
				crypto: { wrappedDek: "v2.a.b", kdf: "hkdf-sha256", rkVersion: 1 },
			}),
		).rejects.toMatchObject({ code: "conflict" })
		expect(set).not.toHaveBeenCalled()
		expect(update).not.toHaveBeenCalled()
	})

	it("migrateToV2 writes entries, crypto, schemaVersion 2 and migratedAt together", async () => {
		const set = jest.fn()
		const update = jest.fn()
		sdk.runTransaction.mockImplementation(((_db: unknown, fn: (tx: unknown) => Promise<void>) =>
			fn({ get: () => Promise.resolve(snapshot({ items: [] })), set, update })) as never)

		await store.migrateToV2("u", {
			entries: [{ id: "e1", ct: "v2.a.b" }],
			crypto: { wrappedDek: "v2.w.w", kdf: "hkdf-sha256", rkVersion: 1 },
		})

		expect(set).toHaveBeenCalledWith(
			{ path: "users/u/entries/e1" },
			{ ct: "v2.a.b", updatedAt: "SERVER_TS" },
		)
		expect(update).toHaveBeenCalledWith(
			{ path: "users/u" },
			{
				crypto: { wrappedDek: "v2.w.w", kdf: "hkdf-sha256", rkVersion: 1, createdAt: "SERVER_TS" },
				schemaVersion: 2,
				migratedAt: "SERVER_TS",
			},
		)
	})

	it("rollback deletes the entries first and only then clears the profile fields", async () => {
		const order: string[] = []
		sdk.getDocFromServer.mockResolvedValue(
			snapshot({ migratedAt: { toMillis: () => Date.now() } }) as never,
		)
		const batch = {
			delete: jest.fn(() => order.push("batch.delete")),
			commit: jest.fn(() => {
				order.push("batch.commit")
				return Promise.resolve()
			}),
		}
		sdk.writeBatch.mockReturnValue(batch as never)
		sdk.getDocsFromServer.mockResolvedValue({ docs: [{ ref: "r1" }, { ref: "r2" }] } as never)
		sdk.updateDoc.mockImplementation(() => {
			order.push("updateDoc")
			return Promise.resolve()
		})

		await store.rollbackMigration("u")

		expect(order).toEqual(["batch.delete", "batch.delete", "batch.commit", "updateDoc"])
		expect(sdk.updateDoc).toHaveBeenCalledWith(
			{ path: "users/u" },
			{ crypto: "DELETE_FIELD", schemaVersion: "DELETE_FIELD", migratedAt: "DELETE_FIELD" },
		)
	})

	it("a failed entries deletion leaves the profile untouched so the rollback can be repeated", async () => {
		sdk.getDocFromServer.mockResolvedValue(
			snapshot({ migratedAt: { toMillis: () => Date.now() } }) as never,
		)
		sdk.getDocsFromServer.mockResolvedValue({ docs: [{ ref: "r1" }] } as never)
		sdk.writeBatch.mockReturnValue({
			delete: jest.fn(),
			commit: jest.fn(() =>
				Promise.reject(Object.assign(new Error("offline"), { code: "firestore/unavailable" })),
			),
		} as never)

		await expect(store.rollbackMigration("u")).rejects.toMatchObject({ code: "network" })
		expect(sdk.updateDoc).not.toHaveBeenCalled()
	})

	it("rekey fails with conflict on a stale key version or a changed entry, writing nothing", async () => {
		const set = jest.fn()
		const update = jest.fn()
		const input = {
			expectedRkVersion: 1,
			entries: [{ id: "e1", ct: "v2.new.new", expectedCt: "v2.old.old" }],
			crypto: { wrappedDek: "v2.w.w", kdf: "hkdf-sha256", rkVersion: 2 } as const,
		}
		const tx = (profile: unknown, entry: unknown) =>
			((_db: unknown, fn: (t: unknown) => Promise<void>) =>
				fn({
					get: (ref: { path: string }) =>
						Promise.resolve(ref.path === "users/u" ? snapshot(profile) : snapshot(entry)),
					set,
					update,
				})) as never
		const crypto = (rkVersion: number) => ({
			wrappedDek: "v2.a.b",
			kdf: "hkdf-sha256",
			rkVersion,
			createdAt: { toMillis: () => 1 },
		})

		sdk.runTransaction.mockImplementationOnce(tx({ crypto: crypto(2) }, { ct: "v2.old.old" }))
		await expect(store.rekey("u", input)).rejects.toMatchObject({ code: "conflict" })
		sdk.runTransaction.mockImplementationOnce(tx({ crypto: crypto(1) }, { ct: "v2.edited.edited" }))
		await expect(store.rekey("u", input)).rejects.toMatchObject({ code: "conflict" })

		expect(set).not.toHaveBeenCalled()
		expect(update).not.toHaveBeenCalled()
	})

	it("rekey replaces entries and crypto when everything matches", async () => {
		const set = jest.fn()
		const update = jest.fn()
		sdk.runTransaction.mockImplementation(((_db: unknown, fn: (t: unknown) => Promise<void>) =>
			fn({
				get: (ref: { path: string }) =>
					Promise.resolve(
						ref.path === "users/u"
							? snapshot({
									crypto: {
										wrappedDek: "v2.a.b",
										kdf: "hkdf-sha256",
										rkVersion: 1,
										createdAt: { toMillis: () => 1 },
									},
								})
							: snapshot({ ct: "v2.old.old" }),
					),
				set,
				update,
			})) as never)

		await store.rekey("u", {
			expectedRkVersion: 1,
			entries: [{ id: "e1", ct: "v2.new.new", expectedCt: "v2.old.old" }],
			crypto: { wrappedDek: "v2.w.w", kdf: "hkdf-sha256", rkVersion: 2 },
		})

		expect(set).toHaveBeenCalledWith(
			{ path: "users/u/entries/e1" },
			{ ct: "v2.new.new", updatedAt: "SERVER_TS" },
		)
		expect(update).toHaveBeenCalledWith(
			{ path: "users/u" },
			{
				crypto: { wrappedDek: "v2.w.w", kdf: "hkdf-sha256", rkVersion: 2, createdAt: "SERVER_TS" },
			},
		)
	})

	it("rejects a change larger than one transaction is trusted to carry, before touching the server", async () => {
		const entries = Array.from({ length: 401 }, (_, i) => ({ id: `e${String(i)}`, ct: "v2.a.b" }))

		await expect(
			store.migrateToV2("u", {
				entries,
				crypto: { wrappedDek: "v2.w.w", kdf: "hkdf-sha256", rkVersion: 1 },
			}),
		).rejects.toMatchObject({ code: "limit-exceeded" })
		await expect(
			store.rekey("u", {
				expectedRkVersion: 1,
				entries: entries.map(e => ({ ...e, expectedCt: "v2.o.o" })),
				crypto: { wrappedDek: "v2.w.w", kdf: "hkdf-sha256", rkVersion: 2 },
			}),
		).rejects.toMatchObject({ code: "limit-exceeded" })
		expect(sdk.runTransaction).not.toHaveBeenCalled()
	})

	it("rollback refuses to delete anything 23 h after migratedAt", async () => {
		sdk.getDocFromServer.mockResolvedValue(
			snapshot({ migratedAt: { toMillis: () => Date.now() - 24 * 3_600_000 } }) as never,
		)

		await expect(store.rollbackMigration("u")).rejects.toMatchObject({ code: "rollback-expired" })

		expect(sdk.getDocsFromServer).not.toHaveBeenCalled()
		expect(sdk.writeBatch).not.toHaveBeenCalled()
		expect(sdk.updateDoc).not.toHaveBeenCalled()
	})

	it("rollback refuses to delete entries once the DEK was changed (rkVersion > 1)", async () => {
		sdk.getDocFromServer.mockResolvedValue(
			snapshot({
				migratedAt: { toMillis: () => Date.now() },
				crypto: {
					wrappedDek: "v2.a.b",
					kdf: "hkdf-sha256",
					rkVersion: 2,
					createdAt: { toMillis: () => 1 },
				},
			}) as never,
		)

		await expect(store.rollbackMigration("u")).rejects.toMatchObject({ code: "conflict" })

		expect(sdk.getDocsFromServer).not.toHaveBeenCalled()
		expect(sdk.writeBatch).not.toHaveBeenCalled()
	})

	it("flushPendingWrites waits for the SDK queue", async () => {
		await store.flushPendingWrites()

		expect(sdk.waitForPendingWrites).toHaveBeenCalledTimes(1)
	})

	it("replaceEntries deletes the current entries and creates the new ones in one transaction", async () => {
		const del = jest.fn()
		const set = jest.fn()
		sdk.runTransaction.mockImplementation(((_db: unknown, fn: (t: unknown) => Promise<void>) =>
			fn({
				get: (ref: { path: string }) =>
					Promise.resolve(
						ref.path === "users/u"
							? snapshot({
									crypto: {
										wrappedDek: "v2.a.b",
										kdf: "hkdf-sha256",
										rkVersion: 1,
										createdAt: { toMillis: () => 1 },
									},
								})
							: snapshot({ ct: "v2.old.old" }),
					),
				delete: del,
				set,
			})) as never)

		await store.replaceEntries("u", {
			expectedRkVersion: 1,
			current: [{ id: "old1", expectedCt: "v2.old.old" }],
			writes: [{ id: "new1", ct: "v2.new.new" }],
		})

		expect(del).toHaveBeenCalledWith({ path: "users/u/entries/old1" })
		expect(set).toHaveBeenCalledWith(
			{ path: "users/u/entries/new1" },
			{ ct: "v2.new.new", updatedAt: "SERVER_TS" },
		)
	})

	it("replaceEntries: a changed entry means conflict and nothing is deleted or written", async () => {
		const del = jest.fn()
		const set = jest.fn()
		sdk.runTransaction.mockImplementation(((_db: unknown, fn: (t: unknown) => Promise<void>) =>
			fn({
				get: (ref: { path: string }) =>
					Promise.resolve(
						ref.path === "users/u"
							? snapshot({
									crypto: {
										wrappedDek: "v2.a.b",
										kdf: "hkdf-sha256",
										rkVersion: 1,
										createdAt: { toMillis: () => 1 },
									},
								})
							: snapshot({ ct: "v2.edited.edited" }),
					),
				delete: del,
				set,
			})) as never)

		await expect(
			store.replaceEntries("u", {
				expectedRkVersion: 1,
				current: [{ id: "old1", expectedCt: "v2.old.old" }],
				writes: [{ id: "new1", ct: "v2.new.new" }],
			}),
		).rejects.toMatchObject({ code: "conflict" })

		expect(del).not.toHaveBeenCalled()
		expect(set).not.toHaveBeenCalled()
	})

	it("replaceEntries rejects an oversized change before touching the server", async () => {
		const writes = Array.from({ length: 401 }, (_, i) => ({ id: `e${String(i)}`, ct: "v2.a.b" }))

		await expect(
			store.replaceEntries("u", { expectedRkVersion: 1, current: [], writes }),
		).rejects.toMatchObject({
			code: "limit-exceeded",
		})
		expect(sdk.runTransaction).not.toHaveBeenCalled()
	})

	it("replaceEntries: a changed key version (DEK change elsewhere) is a conflict, nothing is written", async () => {
		const del = jest.fn()
		const set = jest.fn()
		sdk.runTransaction.mockImplementation(((_db: unknown, fn: (t: unknown) => Promise<void>) =>
			fn({
				get: () =>
					Promise.resolve(
						snapshot({
							crypto: {
								wrappedDek: "v2.a.b",
								kdf: "hkdf-sha256",
								rkVersion: 2,
								createdAt: { toMillis: () => 1 },
							},
						}),
					),
				delete: del,
				set,
			})) as never)

		await expect(
			store.replaceEntries("u", {
				expectedRkVersion: 1,
				current: [],
				writes: [{ id: "n", ct: "v2.n.n" }],
			}),
		).rejects.toMatchObject({ code: "conflict" })

		expect(set).not.toHaveBeenCalled()
		expect(del).not.toHaveBeenCalled()
	})
})
