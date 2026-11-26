import { EntryCodec, EntryRepository } from "@/entities/entry"
import { VaultKeyService, VaultLockService, VaultRecoveryService } from "@/entities/session"
import { baseApi, toQueryResult } from "@/shared/api"
import { AppError } from "@/shared/lib/errors"
import { NobleCryptoService, NobleScryptKdf } from "@/shared/services/crypto"
import { CryptoJsLegacyDecryptor } from "@/shared/services/legacy-decryptor"
import type { ISecureStorage } from "@/shared/services/secure-storage"
import { VaultBackupService } from "@/features/vault-backup"
import { VaultMigrationService } from "@/features/vault-migration"
import { FakeAuthService, FakeRandom, FakeRemoteStore, FakeSecureStorage } from "@/shared/testing"

import type { AppDependencies } from "../di/container"
import { createAppStore } from "./store"

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

const createTestDependencies = (secureStorage: ISecureStorage): AppDependencies => {
	const random = new FakeRandom()
	const crypto = new NobleCryptoService(random)
	const vaultKeys = new VaultKeyService(crypto, random)
	const entryCodec = new EntryCodec(crypto)
	const legacyDecryptor = new CryptoJsLegacyDecryptor()
	const remoteStore = new FakeRemoteStore()
	const vaultLock = new VaultLockService(
		secureStorage,
		crypto,
		new NobleScryptKdf(),
		random,
		Date.now,
	)
	return {
		authService: new FakeAuthService(),
		secureStorage,
		random,
		crypto,
		kdf: new NobleScryptKdf(),
		vaultKeys,
		entryCodec,
		legacyDecryptor,
		remoteStore,
		vaultMigration: new VaultMigrationService(
			remoteStore,
			legacyDecryptor,
			vaultKeys,
			entryCodec,
			random,
			secureStorage,
		),
		vaultLock,
		entryRepository: new EntryRepository(remoteStore, entryCodec, vaultLock, random, Date.now),
		vaultRecovery: new VaultRecoveryService(remoteStore, vaultKeys),
		clipboard: { copySensitive: () => Promise.resolve(), clear: () => Promise.resolve() },
		haptics: { impact: () => undefined, notify: () => undefined, selection: () => undefined },
		themeStore: { load: () => Promise.resolve("system" as const), save: () => Promise.resolve() },
		fileStorage: {
			saveToFolder: () => Promise.resolve("canceled"),
			share: () => Promise.resolve(),
			pickText: () => Promise.resolve(null),
		},
		vaultBackup: new VaultBackupService(
			remoteStore,
			entryCodec,
			vaultKeys,
			legacyDecryptor,
			random,
			() => new Date(),
		),
	}
}

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
		const store = createAppStore(createTestDependencies(secureStorage))

		const result = await store.dispatch(
			testApi.endpoints.readTestValue.initiate("k", { subscribe: false }),
		)

		expect(result.data).toBe("v")
	})

	it("stores errors in serializable AppError form", async () => {
		const store = createAppStore(createTestDependencies(new FakeSecureStorage()))

		const result = await store.dispatch(
			testApi.endpoints.failTestValue.initiate("k", { subscribe: false }),
		)

		expect(result.error).toEqual({ code: "crypto", message: "Decryption failed" })
	})

	it("wraps unknown errors without leaking their message", async () => {
		const store = createAppStore(createTestDependencies(new FakeSecureStorage()))
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
