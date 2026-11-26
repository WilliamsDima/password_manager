import { combineReducers, configureStore } from "@reduxjs/toolkit"

import { baseApi } from "@/shared/api"

import type { AppDependencies } from "../di/container"

const rootReducer = combineReducers({
	[baseApi.reducerPath]: baseApi.reducer,
})

/**
 * The DI container becomes the thunk `extraArgument`, which RTK Query exposes to every
 * `queryFn` as `api.extra`.
 */
export const createAppStore = (dependencies: AppDependencies) =>
	configureStore({
		reducer: rootReducer,
		middleware: getDefaultMiddleware =>
			getDefaultMiddleware({ thunk: { extraArgument: dependencies } }).concat(baseApi.middleware),
	})

export type AppStore = ReturnType<typeof createAppStore>
export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = AppStore["dispatch"]
