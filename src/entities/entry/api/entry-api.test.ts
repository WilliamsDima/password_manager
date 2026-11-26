import { configureStore } from "@reduxjs/toolkit"

import { baseApi } from "@/shared/api"

import type { Entry } from "../model/types"
import { entryApi, type EntryApiDependencies } from "./entry-api"
import type { EntryListResult, IEntryRepository } from "./entry-repository"

const UID = "user-1"
const entry = (id: string, favorite?: boolean): Entry => ({
	id,
	title: id,
	login: "l",
	password: "p",
	createdAt: 1,
	updatedAt: 1,
	...(favorite === undefined ? {} : { favorite }),
})

/** A repository whose `setFavorite` finishes only when the test says so (a slow network). */
const slowRepository = () => {
	const state = { entries: [entry("a"), entry("b", true)] }
	const pending: { resolve: () => void; reject: () => void }[] = []
	const repo: IEntryRepository = {
		list: (): Promise<EntryListResult> =>
			Promise.resolve({ entries: state.entries, unreadable: [] }),
		create: () => Promise.reject(new Error("unused")),
		update: () => Promise.reject(new Error("unused")),
		remove: () => Promise.reject(new Error("unused")),
		setFavorite: (_uid, id, favorite) =>
			new Promise((resolve, reject) => {
				pending.push({
					resolve: () => {
						state.entries = state.entries.map(item =>
							item.id === id ? { ...item, favorite } : item,
						)
						resolve({ entry: entry(id, favorite), synced: true })
					},
					reject: () => {
						reject(new Error("offline"))
					},
				})
			}),
	}
	return { repo, pending }
}

const setup = () => {
	const { repo, pending } = slowRepository()
	const deps: EntryApiDependencies = { entryRepository: repo }
	const store = configureStore({
		reducer: { [baseApi.reducerPath]: baseApi.reducer },
		middleware: getDefault =>
			getDefault({ thunk: { extraArgument: deps } }).concat(baseApi.middleware),
	})
	const favorites = () =>
		entryApi.endpoints.getEntries
			.select(UID)(store.getState())
			.data?.entries.map(item => `${item.id}:${String(item.favorite === true)}`)
	return { store, pending, favorites }
}

describe("setEntryFavorite", () => {
	it("shows the new star at once, before the server has answered", async () => {
		const { store, pending, favorites } = setup()
		await store.dispatch(entryApi.endpoints.getEntries.initiate(UID))
		expect(favorites()).toEqual(["a:false", "b:true"])

		const request = store.dispatch(
			entryApi.endpoints.setEntryFavorite.initiate({ uid: UID, entryId: "a", favorite: true }),
		)
		await Promise.resolve()
		expect(pending).toHaveLength(1)
		expect(favorites()).toEqual(["a:true", "b:true"])

		pending[0]?.resolve()
		await request
		expect(favorites()).toEqual(["a:true", "b:true"])
	})

	it("puts the star back when saving fails", async () => {
		const { store, pending, favorites } = setup()
		await store.dispatch(entryApi.endpoints.getEntries.initiate(UID))

		const request = store.dispatch(
			entryApi.endpoints.setEntryFavorite.initiate({ uid: UID, entryId: "b", favorite: false }),
		)
		await Promise.resolve()
		expect(favorites()).toEqual(["a:false", "b:false"])

		pending[0]?.reject()
		await request
		expect(favorites()).toEqual(["a:false", "b:true"])
	})
})
