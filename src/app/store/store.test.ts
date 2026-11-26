import { baseApi, toQueryResult } from "@/shared/api"
import { AppError } from "@/shared/lib/errors"
import type { ISecureStorage } from "@/shared/services/secure-storage"
import { FakeAuthService } from "@/shared/testing"

import type { AppDependencies } from "../di/container"
import { createAppStore } from "./store"

class FakeSecureStorage implements ISecureStorage {
	private readonly values = new Map<string, string>()

	public get(key: string): Promise<string | null> {
		return Promise.resolve(this.values.get(key) ?? null)
	}

	public set(key: string, value: string): Promise<void> {
		this.values.set(key, value)
		return Promise.resolve()
	}

	public remove(key: string): Promise<void> {
		this.values.delete(key)
		return Promise.resolve()
	}

	public canUseBiometricAuthentication(): boolean {
		return false
	}
}

// Same pattern an entity uses: queryFn takes its dependencies from `extra`.
const testApi = baseApi.injectEndpoints({
	endpoints: build => ({
		readTestValue: build.query<string | null, string>({
			queryFn: (key, { extra }) => {
				const { secureStorage } = extra as AppDependencies
				return toQueryResult(() => secureStorage.get(key))
			},
		}),
		failTestValue: build.query<string, string>({
			queryFn: () =>
				toQueryResult<string>(() => Promise.reject(new AppError("crypto", "Decryption failed"))),
		}),
	}),
})

describe("createAppStore", () => {
	// RTK Query and its autoBatchEnhancer schedule work on timers / requestAnimationFrame after a
	// query settles. Fake them (promises stay real) and flush them before teardown.
	beforeEach(() => {
		jest.useFakeTimers({ doNotFake: ["queueMicrotask", "nextTick"] })
	})

	afterEach(() => {
		jest.runAllTimers()
		jest.useRealTimers()
	})

	it("passes the DI container to queryFn as `extra`", async () => {
		const secureStorage = new FakeSecureStorage()
		await secureStorage.set("k", "v")
		const store = createAppStore({ authService: new FakeAuthService(), secureStorage })

		const result = await store.dispatch(
			testApi.endpoints.readTestValue.initiate("k", { subscribe: false }),
		)

		expect(result.data).toBe("v")
	})

	it("stores errors in serializable AppError form", async () => {
		const store = createAppStore({
			authService: new FakeAuthService(),
			secureStorage: new FakeSecureStorage(),
		})

		const result = await store.dispatch(
			testApi.endpoints.failTestValue.initiate("k", { subscribe: false }),
		)

		expect(result.error).toEqual({ code: "crypto", message: "Decryption failed" })
	})

	it("wraps unknown errors without leaking their message", async () => {
		const store = createAppStore({
			authService: new FakeAuthService(),
			secureStorage: new FakeSecureStorage(),
		})
		const leaky = baseApi.injectEndpoints({
			endpoints: build => ({
				leakyTestValue: build.query<string, string>({
					queryFn: () => toQueryResult<string>(() => Promise.reject(new Error("secret-value"))),
				}),
			}),
		})

		const result = await store.dispatch(
			leaky.endpoints.leakyTestValue.initiate("k", { subscribe: false }),
		)

		expect(result.error).toEqual({ code: "unknown", message: "Unexpected error" })
	})
})
