import { baseApi, toQueryResult } from "@/shared/api"

import type { Entry } from "../model/types"
import type {
	EntryInput,
	EntryListResult,
	EntryRemoved,
	EntrySaved,
	IEntryRepository,
} from "./entry-repository"

/** What the entry endpoints take from the DI container (`api.extra`). */
export type EntryApiDependencies = {
	readonly entryRepository: IEntryRepository
}

/**
 * Entries of the signed-in account. The cache holds **plaintext**, so it is dropped on every
 * lock and sign-out (`app/session`, docs/CRYPTO.md §4). Every mutation invalidates the list.
 */
export const entryApi = baseApi.injectEndpoints({
	endpoints: build => ({
		getEntries: build.query<EntryListResult, string>({
			// Decrypted text: keep it for seconds after the list screen is left, not the default minute.
			keepUnusedDataFor: 5,
			queryFn: (uid, { extra }) => {
				const { entryRepository } = extra as EntryApiDependencies
				return toQueryResult(() => entryRepository.list(uid))
			},
			providesTags: ["Entry"],
		}),
		createEntry: build.mutation<EntrySaved, { readonly uid: string; readonly input: EntryInput }>({
			queryFn: ({ uid, input }, { extra }) => {
				const { entryRepository } = extra as EntryApiDependencies
				return toQueryResult(() => entryRepository.create(uid, input))
			},
			invalidatesTags: ["Entry"],
		}),
		updateEntry: build.mutation<EntrySaved, { readonly uid: string; readonly entry: Entry }>({
			queryFn: ({ uid, entry }, { extra }) => {
				const { entryRepository } = extra as EntryApiDependencies
				return toQueryResult(() => entryRepository.update(uid, entry))
			},
			invalidatesTags: ["Entry"],
		}),
		setEntryFavorite: build.mutation<
			EntrySaved,
			{ readonly uid: string; readonly entryId: string; readonly favorite: boolean }
		>({
			queryFn: ({ uid, entryId, favorite }, { extra }) => {
				const { entryRepository } = extra as EntryApiDependencies
				return toQueryResult(() => entryRepository.setFavorite(uid, entryId, favorite))
			},
			invalidatesTags: ["Entry"],
		}),
		deleteEntry: build.mutation<EntryRemoved, { readonly uid: string; readonly entryId: string }>({
			queryFn: ({ uid, entryId }, { extra }) => {
				const { entryRepository } = extra as EntryApiDependencies
				return toQueryResult(() => entryRepository.remove(uid, entryId))
			},
			invalidatesTags: ["Entry"],
		}),
	}),
})

export const {
	useGetEntriesQuery,
	useCreateEntryMutation,
	useUpdateEntryMutation,
	useSetEntryFavoriteMutation,
	useDeleteEntryMutation,
} = entryApi
