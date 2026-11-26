import type { Entry } from "../model/types"
import { visibleEntries, type EntryListOptions } from "./entry-view"

const entry = (id: string, title: string, extra: Partial<Entry> = {}): Entry => ({
	id,
	title,
	login: `${title}@mail.ru`,
	password: "secret-pass",
	createdAt: 1000,
	updatedAt: 1000,
	...extra,
})

const options = (extra: Partial<EntryListOptions> = {}): EntryListOptions => ({
	query: "",
	order: "title",
	favoritesOnly: false,
	...extra,
})

const ids = (entries: readonly Entry[]) => entries.map(item => item.id)

describe("visibleEntries", () => {
	const all = [
		entry("b", "Банк", { updatedAt: 3000, createdAt: 1000 }),
		entry("a", "авито", { updatedAt: 1000, createdAt: 3000 }),
		entry("c", "Почта", { updatedAt: 2000, createdAt: 2000, favorite: true }),
	]

	it("sorts by title ignoring case, favorites first", () => {
		expect(ids(visibleEntries(all, options()))).toEqual(["c", "a", "b"])
	})

	it("sorts by last change or creation, newest first", () => {
		expect(ids(visibleEntries(all, options({ order: "updated" })))).toEqual(["c", "b", "a"])
		expect(ids(visibleEntries(all, options({ order: "created" })))).toEqual(["c", "a", "b"])
	})

	it("keeps only favorites on request", () => {
		expect(ids(visibleEntries(all, options({ favoritesOnly: true })))).toEqual(["c"])
	})

	it("searches title, login, address and notes without case or surrounding spaces", () => {
		const data = [
			entry("t", "Госуслуги"),
			entry("l", "Один", { login: "ivan.petrov" }),
			entry("u", "Два", { url: "https://example.org" }),
			entry("n", "Три", { notes: "Рабочий аккаунт" }),
		]
		expect(ids(visibleEntries(data, options({ query: "  ГОСУС " })))).toEqual(["t"])
		expect(ids(visibleEntries(data, options({ query: "PETROV" })))).toEqual(["l"])
		expect(ids(visibleEntries(data, options({ query: "example" })))).toEqual(["u"])
		expect(ids(visibleEntries(data, options({ query: "рабочий" })))).toEqual(["n"])
	})

	it("never matches the password", () => {
		expect(visibleEntries(all, options({ query: "secret-pass" }))).toEqual([])
	})

	it("combines search and favorites, and does not mutate the input", () => {
		const input = [...all]
		expect(ids(visibleEntries(input, options({ query: "а", favoritesOnly: true })))).toEqual(["c"])
		expect(input).toEqual(all)
	})

	it("orders equal items by ID so the list does not jump", () => {
		const twins = [entry("z", "Same"), entry("y", "Same")]
		expect(ids(visibleEntries(twins, options()))).toEqual(["y", "z"])
	})
})
