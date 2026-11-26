import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"

import { serializeAppError, type SerializedAppError } from "@/shared/lib/errors"

/**
 * Root RTK Query API (docs/ARCHITECTURE.md §3.1). There is no HTTP base query: every endpoint
 * uses `queryFn` and calls a repository taken from `api.extra`, which is the thunk
 * `extraArgument` set in `app/store` (the DI container).
 *
 * Entities add endpoints with `baseApi.injectEndpoints` and declare the dependencies they need
 * as their own type (e.g. `{ entryRepository: IEntryRepository }`). `AppDependencies` in
 * `app/di` is the intersection of those types, so the compiler checks that the container
 * provides everything. Inside `queryFn`, `extra` is typed `unknown` by RTK and is narrowed
 * with `extra as <EntityDependencies>`: the store is created only from the container.
 */
export const baseApi = createApi({
	reducerPath: "api",
	baseQuery: fakeBaseQuery<SerializedAppError>(),
	tagTypes: ["Entry", "Profile"],
	endpoints: () => ({}),
})

export type QueryResult<T> = { data: T } | { error: SerializedAppError }

/** Runs a repository call and converts the outcome into the `queryFn` result shape. */
export const toQueryResult = async <T>(run: () => Promise<T>): Promise<QueryResult<T>> => {
	try {
		return { data: await run() }
	} catch (error: unknown) {
		return { error: serializeAppError(error) }
	}
}
