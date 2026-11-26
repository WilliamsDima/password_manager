import type { Entry } from "../model/types"

export type EntrySortOrder = "title" | "updated" | "created"

/** Shown in this order; the first one is the default (newest added first). */
export const ENTRY_SORT_ORDERS: readonly EntrySortOrder[] = ["created", "updated", "title"]

export const DEFAULT_ENTRY_SORT_ORDER: EntrySortOrder = "created"

export type EntryListOptions = {
	readonly query: string
	readonly order: EntrySortOrder
	readonly favoritesOnly: boolean
}

const normalize = (text: string): string => text.trim().toLocaleLowerCase("ru-RU")

/** Search runs on title, login, address and notes. The password is never searched. */
const matches = (entry: Entry, needle: string): boolean =>
	[entry.title, entry.login, entry.url ?? "", entry.notes ?? ""].some(field =>
		normalize(field).includes(needle),
	)

const compare = (order: EntrySortOrder, a: Entry, b: Entry): number => {
	switch (order) {
		case "title":
			return a.title.localeCompare(b.title, "ru-RU", { sensitivity: "base" })
		case "updated":
			return b.updatedAt - a.updatedAt
		case "created":
			return b.createdAt - a.createdAt
	}
}

/**
 * What the list shows: filtered by the search text (and favorites if asked), favorites first,
 * then by the chosen order. Ties keep a stable order by ID. Does not mutate `entries`.
 */
export const visibleEntries = (
	entries: readonly Entry[],
	{ query, order, favoritesOnly }: EntryListOptions,
): readonly Entry[] => {
	const needle = normalize(query)
	return entries
		.filter(entry => (!favoritesOnly || entry.favorite === true) && matches(entry, needle))
		.sort((a, b) => {
			const byFavorite = Number(b.favorite === true) - Number(a.favorite === true)
			if (byFavorite !== 0) return byFavorite
			return compare(order, a, b) || a.id.localeCompare(b.id)
		})
}
