export {
	canonicalPayload,
	decryptLegacyItems,
	LegacyDataError,
	samePayloads,
} from "./lib/legacy-items"
export { EntryCodec } from "./lib/entry-codec"
export {
	useCreateEntryMutation,
	useDeleteEntryMutation,
	useGetEntriesQuery,
	useUpdateEntryMutation,
} from "./api/entry-api"
export type { EntryApiDependencies } from "./api/entry-api"
export { EntryRepository } from "./api/entry-repository"
export type {
	EntryInput,
	EntryListResult,
	EntryRemoved,
	EntrySaved,
	IDekSource,
	IEntryRepository,
} from "./api/entry-repository"
export type { Entry, EntryPayload } from "./model/types"
