import { encodeUtf8, toBase64 } from "@/shared/lib/encoding"
import { NobleCryptoService, type IKdf, type KdfParams } from "@/shared/services/crypto"
import { FakeRandom, FakeSecureStorage } from "@/shared/testing"

import { LockoutError } from "../lib/lockout"
import { VaultLockService } from "./vault-lock-service"
import { DEFAULT_LOCK_TIMINGS } from "./vault-lock-types"

const UID = "user-1"
const DEK = new Uint8Array(32).fill(9)
const PASSWORD = "correct horse"

/** Cheap deterministic KDF: records the parameters it was called with. */
class FakeKdf implements IKdf {
	public readonly calls: KdfParams[] = []
	constructor(private readonly crypto: NobleCryptoService) {}
	public readonly derive = (
		password: string,
		salt: Uint8Array,
		params: KdfParams,
	): Promise<Uint8Array> => {
		this.calls.push(params)
		return Promise.resolve(this.crypto.hkdf(encodeUtf8(password), salt, "test-kdf", 32))
	}
}

const setup = () => {
	const random = new FakeRandom()
	const crypto = new NobleCryptoService(random)
	const storage = new FakeSecureStorage()
	const kdf = new FakeKdf(crypto)
	const clock = { now: 1_700_000_000_000 }
	const create = () => new VaultLockService(storage, crypto, kdf, random, () => clock.now)
	return { storage, kdf, clock, crypto, create, service: create() }
}

const enrolledPassword = async () => {
	const ctx = setup()
	await ctx.service.initialize(UID)
	await ctx.service.enroll({ dek: DEK, mode: "password", password: PASSWORD })
	return ctx
}

describe("VaultLockService: setup and unlock", () => {
	it("starts as setup-required on a fresh device", async () => {
		const { service } = setup()
		await service.initialize(UID)

		expect(service.getState()).toEqual({
			status: "setup-required",
			mode: null,
			biometricInvalidated: false,
		})
		expect(() => service.getDek()).toThrow("locked")
	})

	it("password mode: enroll unlocks, a new session starts locked and the password opens it", async () => {
		const { create, service } = await enrolledPassword()
		expect(service.getState().status).toBe("unlocked")
		expect(service.getDek()).toEqual(DEK)

		const next = create()
		await next.initialize(UID)
		expect(next.getState()).toMatchObject({ status: "locked", mode: "password" })
		await next.unlockWithPassword(PASSWORD)

		expect(next.getState().status).toBe("unlocked")
		expect(next.getDek()).toEqual(DEK)
	})

	it("stores a wrapper with the calibrated KDF parameters and no plaintext DEK", async () => {
		const { storage, kdf } = await enrolledPassword()
		const wrapper = JSON.parse(storage.values.get("pm.lock.wrapper") ?? "{}") as Record<
			string,
			unknown
		>

		expect(wrapper).toMatchObject({ v: 1, kdf: "scrypt", r: 8, p: 1 })
		expect(String(wrapper.wrapped)).toMatch(/^v2\./)
		expect(kdf.calls.at(-1)).toMatchObject({ N: wrapper.N })
		expect([...storage.values.keys()]).not.toContain("pm.lock.dek.plain")
		expect([...storage.values.values()].join("")).not.toContain(toBase64(DEK))
	})

	it("refuses a stored wrapper with a tiny scrypt cost like a missing one", async () => {
		const { create, storage } = await enrolledPassword()
		const wrapper = JSON.parse(storage.values.get("pm.lock.wrapper") ?? "{}") as Record<
			string,
			unknown
		>
		storage.values.set("pm.lock.wrapper", JSON.stringify({ ...wrapper, N: 2 }))

		const next = create()
		await next.initialize(UID)
		await expect(next.unlockWithPassword(PASSWORD)).rejects.toMatchObject({
			code: "secure-storage",
		})
		expect(next.getState().status).toBe("locked")
	})

	it("rejects a short password and a wrong password without unlocking", async () => {
		const { service } = setup()
		await service.initialize(UID)
		await expect(
			service.enroll({ dek: DEK, mode: "password", password: "123" }),
		).rejects.toMatchObject({
			code: "weak-password",
		})

		const ctx = await enrolledPassword()
		const next = ctx.create()
		await next.initialize(UID)
		await expect(next.unlockWithPassword("wrong password")).rejects.toMatchObject({
			code: "invalid-credentials",
		})
		expect(next.getState().status).toBe("locked")
	})

	it("none mode unlocks immediately on the next start and never locks", async () => {
		const { service, create } = setup()
		await service.initialize(UID)
		await service.enroll({ dek: DEK, mode: "none" })

		const next = create()
		await next.initialize(UID)

		expect(next.getState()).toMatchObject({ status: "unlocked", mode: "none" })
		next.lock()
		expect(next.getState().status).toBe("unlocked")
	})

	it("lock zeroes the DEK in memory", async () => {
		const { service } = await enrolledPassword()
		const held = service.getDek()

		service.lock()

		expect(service.getState().status).toBe("locked")
		expect(held).toEqual(new Uint8Array(32))
		expect(() => service.getDek()).toThrow("locked")
	})

	it("data of another account is wiped, the new account must set up again", async () => {
		const { storage, create } = await enrolledPassword()

		const other = create()
		await other.initialize("someone-else")

		expect(other.getState().status).toBe("setup-required")
		expect([...storage.values.keys()].filter(key => key.startsWith("pm.lock."))).toEqual([])
	})

	it("wipe forgets every local key", async () => {
		const { service, storage } = await enrolledPassword()

		await service.wipe()

		expect(storage.values.size).toBe(0)
		expect(service.getState().status).toBe("uninitialized")
	})
})

describe("VaultLockService: attempt limit", () => {
	const fail = (service: VaultLockService) =>
		service.unlockWithPassword("nope-nope").catch((e: unknown) => e)

	it("three free attempts, then 30 s, 1 min, 5 min, 15 min, 1 h; the key is never deleted", async () => {
		const { create, clock, storage } = await enrolledPassword()
		const service = create()
		await service.initialize(UID)
		const waits = [30_000, 60_000, 300_000, 900_000, 3_600_000, 3_600_000]

		const first3 = await Promise.all([0, 1, 2].map(async () => fail(service)))
		first3.forEach(error => {
			expect(error).toMatchObject({ code: "invalid-credentials" })
		})
		for (const wait of waits) {
			const blocked = await fail(service)
			expect(blocked).toBeInstanceOf(LockoutError)
			expect((blocked as LockoutError).retryAfterMs).toBe(wait)
			clock.now += wait - 1
			expect(await fail(service)).toBeInstanceOf(LockoutError)
			clock.now += 1
			expect(await fail(service)).toMatchObject({ code: "invalid-credentials" })
		}

		expect(storage.values.has("pm.lock.wrapper")).toBe(true)
	})

	it("the attempt is counted before the password is checked (killing the app mid-KDF still counts)", async () => {
		const { create, storage } = await enrolledPassword()
		const service = create()
		await service.initialize(UID)
		const slow = new Promise<Uint8Array>(() => undefined) // KDF that never finishes
		jest.spyOn(storage, "get")
		const killed = new VaultLockService(
			storage,
			new NobleCryptoService(new FakeRandom()),
			{ derive: () => slow },
			new FakeRandom(),
			() => 1_700_000_000_000,
		)
		await killed.initialize(UID)
		void killed.unlockWithPassword("x").catch(() => undefined)
		await new Promise(resolve => setTimeout(resolve, 20))

		expect(JSON.parse(storage.values.get("pm.lock.attempts") ?? "{}")).toMatchObject({ count: 1 })
	})

	it("success resets the counter", async () => {
		const { create, storage } = await enrolledPassword()
		const service = create()
		await service.initialize(UID)
		await fail(service)
		await fail(service)

		await service.unlockWithPassword(PASSWORD)

		expect(storage.values.has("pm.lock.attempts")).toBe(false)
	})

	it("a clock set back does not extend the wait beyond one period", async () => {
		const { create, clock } = await enrolledPassword()
		const service = create()
		await service.initialize(UID)
		await Promise.all([0, 1, 2, 3].map(async () => fail(service)))
		clock.now -= 365 * 24 * 3_600_000

		const blocked = (await fail(service)) as LockoutError

		expect(blocked).toBeInstanceOf(LockoutError)
		expect(blocked.retryAfterMs).toBeLessThanOrEqual(3_600_000)
	})

	it("a damaged counter blocks instead of granting free attempts", async () => {
		const { create, storage } = await enrolledPassword()
		storage.values.set("pm.lock.attempts", "{not json")
		const service = create()
		await service.initialize(UID)

		expect(await fail(service)).toBeInstanceOf(LockoutError)
	})

	it("reports the remaining wait for the lock screen", async () => {
		const { create, clock } = await enrolledPassword()
		const service = create()
		await service.initialize(UID)
		await Promise.all([0, 1, 2].map(async () => fail(service)))

		expect(await service.getRetryAfterMs()).toBe(30_000)
		clock.now += 30_000
		expect(await service.getRetryAfterMs()).toBe(0)
	})
})

describe("VaultLockService: biometrics", () => {
	const biometric = async () => {
		const ctx = setup()
		ctx.storage.biometricAvailable = true
		await ctx.service.initialize(UID)
		await ctx.service.enroll({ dek: DEK, mode: "biometric" })
		return ctx
	}

	it("enrolls with one prompt, then asks once per unlock and not on lock/unlock of entries", async () => {
		const { create, storage } = await biometric()
		expect(storage.prompts).toBe(1)

		const next = create()
		await next.initialize(UID)
		expect(storage.prompts).toBe(1)
		await next.unlockWithBiometrics()

		expect(storage.prompts).toBe(2)
		expect(next.getDek()).toEqual(DEK)
	})

	it("refuses biometric mode when no Class 3 biometric is enrolled", async () => {
		const { service } = setup()
		await service.initialize(UID)

		await expect(service.enroll({ dek: DEK, mode: "biometric" })).rejects.toMatchObject({
			code: "auth-unavailable",
		})
	})

	it("a canceled prompt leaves the vault locked and does not flag invalidation", async () => {
		const { create, storage } = await biometric()
		const next = create()
		await next.initialize(UID)
		storage.cancelNextPrompt = true

		await expect(next.unlockWithBiometrics()).rejects.toMatchObject({ code: "auth-canceled" })

		expect(next.getState()).toMatchObject({ status: "locked", biometricInvalidated: false })
	})

	it("a new fingerprint invalidates the key: flagged, and the recovery path re-enrolls", async () => {
		const { create, storage } = await biometric()
		storage.invalidateBiometricValues()
		const next = create()
		await next.initialize(UID)

		await expect(next.unlockWithBiometrics()).rejects.toMatchObject({ code: "auth-unavailable" })
		expect(next.getState()).toMatchObject({
			status: "locked",
			mode: "biometric",
			biometricInvalidated: true,
		})

		await next.enroll({ dek: DEK, mode: "biometric" })

		expect(next.getState()).toMatchObject({ status: "unlocked", biometricInvalidated: false })
	})
})

describe("VaultLockService: changing the mode", () => {
	it("password → none needs the current password and removes the wrapper", async () => {
		const { service, storage } = await enrolledPassword()

		await expect(service.changeMode({ mode: "none" })).rejects.toMatchObject({
			code: "invalid-credentials",
		})
		await expect(
			service.changeMode({ mode: "none" }, { password: "wrong one" }),
		).rejects.toMatchObject({
			code: "invalid-credentials",
		})
		expect(service.getState().mode).toBe("password")
		await service.changeMode({ mode: "none" }, { password: PASSWORD })

		expect(service.getState()).toMatchObject({ status: "unlocked", mode: "none" })
		expect(storage.values.has("pm.lock.wrapper")).toBe(false)
		expect(storage.values.has("pm.lock.dek.plain")).toBe(true)
	})

	it("wrong password attempts while changing the mode count toward the limit", async () => {
		const { service } = await enrolledPassword()
		await Promise.all(
			[0, 1, 2].map(async () =>
				service.changeMode({ mode: "none" }, { password: "wrong one" }).catch(() => undefined),
			),
		)

		await expect(
			service.changeMode({ mode: "none" }, { password: PASSWORD }),
		).rejects.toBeInstanceOf(LockoutError)
	})

	it("none → password and password → new password need no extra proof for none, the old one for password", async () => {
		const ctx = setup()
		await ctx.service.initialize(UID)
		await ctx.service.enroll({ dek: DEK, mode: "none" })

		await ctx.service.changeMode({ mode: "password", password: "brand new pw" })
		await ctx.service.changeMode(
			{ mode: "password", password: "another pw 1" },
			{ password: "brand new pw" },
		)

		const next = ctx.create()
		await next.initialize(UID)
		await expect(next.unlockWithPassword("brand new pw")).rejects.toMatchObject({
			code: "invalid-credentials",
		})
		await next.unlockWithPassword("another pw 1")
		expect(next.getDek()).toEqual(DEK)
	})

	it("password → biometric asks for the current password; biometric → password asks for a prompt", async () => {
		const ctx = await enrolledPassword()
		ctx.storage.biometricAvailable = true

		await ctx.service.changeMode({ mode: "biometric" }, { password: PASSWORD })
		expect(ctx.storage.values.has("pm.lock.wrapper")).toBe(false)
		const promptsBefore = ctx.storage.prompts
		await ctx.service.changeMode({ mode: "password", password: "pw after bio" })

		expect(ctx.storage.prompts).toBeGreaterThan(promptsBefore)
		expect(ctx.storage.values.has("pm.lock.dek.biometric")).toBe(false)
		expect(ctx.service.getState().mode).toBe("password")
	})

	it("cannot change the mode while locked", async () => {
		const { service } = await enrolledPassword()
		service.lock()

		await expect(
			service.changeMode({ mode: "none" }, { password: PASSWORD }),
		).rejects.toMatchObject({
			code: "secure-storage",
		})
	})

	it("a failed switch keeps the old setup working", async () => {
		const { service, create } = await enrolledPassword()

		await expect(
			service.changeMode({ mode: "biometric" }, { password: PASSWORD }),
		).rejects.toMatchObject({
			code: "auth-unavailable",
		})

		const next = create()
		await next.initialize(UID)
		await next.unlockWithPassword(PASSWORD)
		expect(next.getDek()).toEqual(DEK)
	})
})

describe("VaultLockService: auto-lock", () => {
	it("locks after the background grace period, not before", async () => {
		const { service, clock } = await enrolledPassword()

		service.noteBackgrounded()
		clock.now += DEFAULT_LOCK_TIMINGS.backgroundGraceMs - 1
		service.noteForegrounded()
		expect(service.getState().status).toBe("unlocked")

		service.noteBackgrounded()
		clock.now += DEFAULT_LOCK_TIMINGS.backgroundGraceMs
		service.noteForegrounded()
		expect(service.getState().status).toBe("locked")
	})

	it("locks after idling in the foreground; activity postpones it", async () => {
		const { service, clock } = await enrolledPassword()

		clock.now += DEFAULT_LOCK_TIMINGS.idleTimeoutMs - 1
		service.noteActivity()
		clock.now += DEFAULT_LOCK_TIMINGS.idleTimeoutMs - 1
		service.checkAutoLock()
		expect(service.getState().status).toBe("unlocked")

		clock.now += 1
		service.checkAutoLock()
		expect(service.getState().status).toBe("locked")
	})

	it("does not apply to the no-check mode", async () => {
		const ctx = setup()
		await ctx.service.initialize(UID)
		await ctx.service.enroll({ dek: DEK, mode: "none" })

		ctx.service.noteBackgrounded()
		ctx.clock.now += 3_600_000
		ctx.service.noteForegrounded()

		expect(ctx.service.getState().status).toBe("unlocked")
	})

	it("notifies subscribers on every state change", async () => {
		const { service } = await enrolledPassword()
		const listener = jest.fn()
		const unsubscribe = service.subscribe(listener)

		service.lock()
		unsubscribe()
		await service.unlockWithPassword(PASSWORD)

		expect(listener).toHaveBeenCalledTimes(1)
	})
})

describe("VaultLockService: races and partial failures", () => {
	it("a lock during changeMode never stores a zeroed key or unlocks the screen", async () => {
		const ctx = await enrolledPassword()
		ctx.storage.onBeforeSet = async () => {
			ctx.storage.onBeforeSet = null
			ctx.service.lock()
			await Promise.resolve()
		}

		await expect(
			ctx.service.changeMode({ mode: "none" }, { password: PASSWORD }),
		).rejects.toMatchObject({ code: "secure-storage" })

		expect(ctx.service.getState().status).toBe("locked")
		const stored = ctx.storage.values.get("pm.lock.dek.plain")
		expect(stored === undefined || stored === toBase64(DEK)).toBe(true)
		expect(ctx.storage.values.get("pm.lock.mode")).toBe("password")
	})

	it("a sign-out during changeMode writes nothing for the old account afterwards", async () => {
		const ctx = await enrolledPassword()
		ctx.storage.onBeforeSet = async () => {
			ctx.storage.onBeforeSet = null
			await ctx.service.wipe()
		}

		await expect(
			ctx.service.changeMode({ mode: "none" }, { password: PASSWORD }),
		).rejects.toMatchObject({ code: "secure-storage" })

		expect(ctx.service.getState().status).toBe("uninitialized")
		expect(ctx.storage.values.has("pm.lock.mode")).toBe(false)
		expect(ctx.storage.values.has("pm.lock.uid")).toBe(false)
	})

	it("changeMode hands enroll a copy: the live DEK is not the stored one", async () => {
		const ctx = await enrolledPassword()
		const live = ctx.service.getDek()

		await ctx.service.changeMode({ mode: "none" }, { password: PASSWORD })

		expect(ctx.service.getDek()).toEqual(DEK)
		expect(ctx.service.getDek()).not.toBe(live)
	})

	it("a clock set back is persisted once: the wait is one period from then, not 'until the old date'", async () => {
		const ctx = await enrolledPassword()
		const service = ctx.create()
		await service.initialize(UID)
		await Promise.all(
			[0, 1, 2, 3].map(async () => service.unlockWithPassword("nope-nope").catch(() => undefined)),
		)
		ctx.clock.now -= 365 * 24 * 3_600_000

		const first = await service.getRetryAfterMs()
		ctx.clock.now += 20_000
		const second = await service.getRetryAfterMs()
		ctx.clock.now += 10_000

		expect(first).toBe(30_000)
		expect(second).toBe(10_000)
		expect(await service.getRetryAfterMs()).toBe(0)
	})

	it("a damaged counter blocks for one hour, then lets the password through", async () => {
		const ctx = await enrolledPassword()
		ctx.storage.values.set("pm.lock.attempts", "{not json")
		const service = ctx.create()
		await service.initialize(UID)

		expect(await service.getRetryAfterMs()).toBe(3_600_000)
		ctx.clock.now += 3_600_000
		await service.unlockWithPassword(PASSWORD)

		expect(service.getState().status).toBe("unlocked")
	})

	it("mode switch from none: the plaintext key is removed first and a failure is reported", async () => {
		const ctx = setup()
		await ctx.service.initialize(UID)
		await ctx.service.enroll({ dek: DEK, mode: "none" })
		ctx.storage.failRemoveKeys.add("pm.lock.dek.plain")

		await expect(
			ctx.service.changeMode({ mode: "password", password: "new password" }),
		).rejects.toMatchObject({ message: "Old key not removed" })

		// The marker says password and the vault works with it; the leftover is dropped on the next start.
		expect(ctx.storage.values.get("pm.lock.mode")).toBe("password")
		ctx.storage.failRemoveKeys.clear()
		const next = ctx.create()
		await next.initialize(UID)
		expect(next.getState()).toMatchObject({ status: "locked", mode: "password" })
		expect(ctx.storage.values.has("pm.lock.dek.plain")).toBe(false)
	})

	it("a failing biometric removal does not stop the plaintext key from being removed", async () => {
		const ctx = setup()
		ctx.storage.biometricAvailable = true
		await ctx.service.initialize(UID)
		await ctx.service.enroll({ dek: DEK, mode: "none" })
		ctx.storage.failRemoveKeys.add("pm.lock.dek.biometric")

		await ctx.service.changeMode({ mode: "password", password: "new password" })

		expect(ctx.storage.values.has("pm.lock.dek.plain")).toBe(false)
	})

	it("a Keystore failure on start becomes init-failed, and a retry recovers", async () => {
		const ctx = setup()
		ctx.storage.failGets = true

		await ctx.service.initialize(UID)
		expect(ctx.service.getState().status).toBe("init-failed")

		ctx.storage.failGets = false
		await ctx.service.initialize(UID)
		expect(ctx.service.getState().status).toBe("setup-required")
	})

	it("initialize and wipe run in call order: a late wipe cannot erase a newer initialize", async () => {
		const ctx = await enrolledPassword()

		const wiping = ctx.service.wipe()
		const starting = ctx.service.initialize(UID)
		await Promise.all([wiping, starting])

		expect(ctx.service.getState().status).toBe("setup-required")
	})

	it("a repeated initialize while unlocked zeroes the key", async () => {
		const ctx = await enrolledPassword()
		const held = ctx.service.getDek()

		await ctx.service.initialize(UID)

		expect(held).toEqual(new Uint8Array(32))
		expect(ctx.service.getState().status).toBe("locked")
	})
})
