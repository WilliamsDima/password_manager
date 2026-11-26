import { configureStore } from "@reduxjs/toolkit"

import { baseApi } from "@/shared/api"
import { AppError } from "@/shared/lib/errors"
import { FakeAuthService } from "@/shared/testing"

import { sessionApi } from "./session-api"

const createStore = (authService: FakeAuthService) =>
	configureStore({
		reducer: { [baseApi.reducerPath]: baseApi.reducer },
		middleware: getDefaultMiddleware =>
			getDefaultMiddleware({ thunk: { extraArgument: { authService } } }).concat(
				baseApi.middleware,
			),
	})

describe("sessionApi", () => {
	// RTK Query schedules work on timers after a request settles: fake them, flush before teardown.
	beforeEach(() => {
		jest.useFakeTimers({ doNotFake: ["queueMicrotask", "nextTick"] })
	})

	afterEach(() => {
		jest.runAllTimers()
		jest.useRealTimers()
	})

	it("signs in through the auth service from `extra`", async () => {
		const authService = new FakeAuthService()
		const store = createStore(authService)

		const result = await store.dispatch(
			sessionApi.endpoints.signIn.initiate({ email: "a@b.c", password: "pw" }),
		)

		expect(result).toEqual({ data: { uid: "uid-1", email: "a@b.c", displayName: null } })
		expect(authService.signInCalls).toEqual([{ email: "a@b.c", password: "pw" }])
	})

	it("returns auth failures as serializable errors that carry no credentials", async () => {
		const authService = new FakeAuthService()
		authService.failWith = new AppError("invalid-credentials", "Authentication failed")
		const store = createStore(authService)

		const result = await store.dispatch(
			sessionApi.endpoints.signIn.initiate({ email: "a@b.c", password: "secret-pw" }),
		)

		expect(result).toEqual({
			error: { code: "invalid-credentials", message: "Authentication failed" },
		})
		expect(JSON.stringify(result)).not.toContain("secret-pw")
	})

	it("signs up", async () => {
		const store = createStore(new FakeAuthService())

		const result = await store.dispatch(
			sessionApi.endpoints.signUp.initiate({ email: "new@b.c", password: "pw" }),
		)

		expect(result).toEqual({ data: { uid: "uid-1", email: "new@b.c", displayName: null } })
	})

	it("signs out, and reports a failure", async () => {
		const authService = new FakeAuthService()
		const store = createStore(authService)

		expect(await store.dispatch(sessionApi.endpoints.signOut.initiate())).toEqual({
			data: undefined,
		})

		authService.failWith = new AppError("network", "Authentication failed")

		expect(await store.dispatch(sessionApi.endpoints.signOut.initiate())).toEqual({
			error: { code: "network", message: "Authentication failed" },
		})
	})
})
