import { fromBase64, toBase64 } from "@/shared/lib/encoding"
import { AppError } from "@/shared/lib/errors"
import type { ICryptoService, IKdf, KdfParams } from "@/shared/services/crypto"
import type { IRandom } from "@/shared/services/random"
import type { ISecureStorage, SecureItemOptions } from "@/shared/services/secure-storage"

import { calibrateKdf } from "../lib/kdf-calibration"
import { type AttemptRecord, LockoutError, parseAttempts, remainingWait } from "../lib/lockout"
import { localPasswordAad } from "../lib/vault-keys"
import {
	DEFAULT_LOCK_TIMINGS,
	type EnrollOptions,
	type LockMode,
	MIN_PASSWORD_LENGTH,
	type ModeConfirmation,
	type VaultLockState,
	type VaultLockTimings,
} from "./vault-lock-types"

const KEYS = {
	uid: "pm.lock.uid",
	mode: "pm.lock.mode",
	wrapper: "pm.lock.wrapper",
	dekPlain: "pm.lock.dek.plain",
	dekBiometric: "pm.lock.dek.biometric",
	attempts: "pm.lock.attempts",
} as const

const BIOMETRIC: SecureItemOptions = {
	requireAuthentication: true,
	authenticationPrompt: "Разблокировка хранилища",
}
const SALT_LENGTH = 16
const KEY_LENGTH = 32

type LocalWrapper = {
	readonly v: 1
	readonly kdf: "scrypt"
	readonly N: number
	readonly r: number
	readonly p: number
	readonly salt: string
	readonly wrapped: string
}

const isMode = (value: string | null): value is LockMode =>
	value === "password" || value === "biometric" || value === "none"

const parseWrapper = (raw: string | null): LocalWrapper | null => {
	if (raw === null) return null
	try {
		const value: unknown = JSON.parse(raw)
		if (
			typeof value === "object" &&
			value !== null &&
			"v" in value &&
			value.v === 1 &&
			"kdf" in value &&
			value.kdf === "scrypt" &&
			"N" in value &&
			typeof value.N === "number" &&
			"r" in value &&
			typeof value.r === "number" &&
			"p" in value &&
			typeof value.p === "number" &&
			"salt" in value &&
			typeof value.salt === "string" &&
			"wrapped" in value &&
			typeof value.wrapped === "string"
		) {
			return {
				v: 1,
				kdf: "scrypt",
				N: value.N,
				r: value.r,
				p: value.p,
				salt: value.salt,
				wrapped: value.wrapped,
			}
		}
	} catch {
		// fall through
	}
	return null
}

/**
 * Local protection of the DEK (docs/CRYPTO.md §4): modes, password wrapper, attempt limit,
 * auto-lock. The DEK lives in memory only while unlocked and is zeroed on lock; it is never put
 * into Redux. Nothing here ever deletes the key after failed attempts, delays only.
 *
 * Biometrics are asked only when unlocking (and once when the mode is enabled).
 */
export class VaultLockService {
	private state: VaultLockState = {
		status: "uninitialized",
		mode: null,
		biometricInvalidated: false,
	}
	private uid: string | null = null
	private dek: Uint8Array | null = null
	private lastActivityAt = 0
	private backgroundedAt: number | null = null
	private readonly listeners = new Set<() => void>()
	/** Password checks run one at a time: concurrent calls must not share one attempt counter value. */
	private passwordQueue: Promise<unknown> = Promise.resolve()
	/** `initialize` and `wipe` run in call order, so a late `wipe` can never overwrite a newer `initialize`. */
	private lifecycleQueue: Promise<unknown> = Promise.resolve()
	/** Bumped by every lock, wipe and initialize: a long `enroll` that started before one must not finish. */
	private epoch = 0

	constructor(
		private readonly storage: ISecureStorage,
		private readonly crypto: ICryptoService,
		private readonly kdf: IKdf,
		private readonly random: IRandom,
		private readonly now: () => number,
		private readonly timings: VaultLockTimings = DEFAULT_LOCK_TIMINGS,
	) {}

	public readonly getState = (): VaultLockState => this.state

	public readonly subscribe = (listener: () => void): (() => void) => {
		this.listeners.add(listener)
		return () => {
			this.listeners.delete(listener)
		}
	}

	/** True when a Class 3 biometric is enrolled, so the biometric mode can be offered. */
	public readonly canUseBiometrics = (): boolean => this.storage.canUseBiometricAuthentication()

	/** The key for entries. Throws while the vault is locked. */
	public readonly getDek = (): Uint8Array => {
		if (this.dek === null) throw new AppError("secure-storage", "Vault is locked")
		return this.dek
	}

	/**
	 * Reads the saved mode for `uid`. Data of another account is wiped. `none` unlocks at once;
	 * `password` / `biometric` start locked; no mode means the recovery key is needed first.
	 */
	public readonly initialize = (uid: string): Promise<void> =>
		this.enqueueLifecycle(async () => {
			this.epoch += 1
			this.dek?.fill(0)
			this.dek = null
			this.uid = uid
			try {
				await this.loadSavedMode(uid)
			} catch {
				// A Keystore failure must not leave a spinner forever: show a retry screen instead.
				this.setState({ status: "init-failed", mode: null, biometricInvalidated: false })
			}
		})

	private readonly loadSavedMode = async (uid: string): Promise<void> => {
		const [savedUid, savedMode] = await Promise.all([
			this.storage.get(KEYS.uid),
			this.storage.get(KEYS.mode),
		])
		if (savedUid !== null && savedUid !== uid) await this.wipeStorage()
		const mode = savedUid === uid && isMode(savedMode) ? savedMode : null
		if (mode === null) {
			this.setState({ status: "setup-required", mode: null, biometricInvalidated: false })
			return
		}
		// A half-finished mode switch can leave the old mode's key behind: drop it now.
		await this.removeOtherModes(mode).catch(() => undefined)
		if (mode === "none") {
			const raw = await this.storage.get(KEYS.dekPlain)
			if (raw === null) {
				this.setState({ status: "setup-required", mode: null, biometricInvalidated: false })
				return
			}
			this.unlockWith(fromBase64(raw), "none")
			return
		}
		this.setState({ status: "locked", mode, biometricInvalidated: false })
	}

	/**
	 * Saves `dek` for the chosen mode (replacing any earlier mode) and unlocks. Used after the
	 * recovery key was entered, and to recover after a reset or an invalidated biometric key.
	 * The new data is written first and the mode marker last, so a failure keeps the old setup.
	 */
	public readonly enroll = (options: EnrollOptions): Promise<void> =>
		this.enrollAt(this.epoch, options)

	/** `epoch` is the generation the caller started in: a lock or sign-out since then aborts the write. */
	private readonly enrollAt = async (
		epoch: number,
		{ dek, mode, password }: EnrollOptions,
	): Promise<void> => {
		const uid = this.requireUid()
		this.assertCurrent(epoch)
		if (dek.length !== KEY_LENGTH) throw new AppError("crypto", "Invalid key length")
		const own = Uint8Array.from(dek)
		try {
			if (mode === "password") {
				if (password === undefined || password.length < MIN_PASSWORD_LENGTH) {
					throw new AppError("weak-password", "Password too short")
				}
				const wrapper = await this.wrapForPassword(uid, own, password)
				this.assertCurrent(epoch)
				await this.storage.set(KEYS.wrapper, wrapper)
			} else if (mode === "biometric") {
				if (!this.storage.canUseBiometricAuthentication()) {
					throw new AppError("auth-unavailable", "Biometrics unavailable")
				}
				await this.storage.set(KEYS.dekBiometric, toBase64(own), BIOMETRIC)
			} else {
				await this.storage.set(KEYS.dekPlain, toBase64(own))
			}
			// The lock or a sign-out may have happened while we were awaiting: write nothing more.
			this.assertCurrent(epoch)
			await this.storage.set(KEYS.uid, uid)
			await this.storage.set(KEYS.mode, mode)
			const leftover = await this.removeOtherModes(mode)
			await this.storage.remove(KEYS.attempts)
			this.assertCurrent(epoch)
			this.unlockWith(Uint8Array.from(own), mode)
			// The marker is switched and the vault works, but an old key survived: say so.
			if (leftover) throw new AppError("secure-storage", "Old key not removed")
		} finally {
			own.fill(0)
		}
	}

	public readonly unlockWithPassword = async (password: string): Promise<void> => {
		const { mode } = this.state
		if (mode !== "password") throw new AppError("unknown", "Password mode is not active")
		const dek = await this.checkPassword(password)
		this.unlockWith(dek, "password")
	}

	/** One biometric prompt. `null` from the store means the key was invalidated (new fingerprint). */
	public readonly unlockWithBiometrics = async (): Promise<void> => {
		if (this.state.mode !== "biometric")
			throw new AppError("unknown", "Biometric mode is not active")
		const raw = await this.storage.get(KEYS.dekBiometric, BIOMETRIC)
		if (raw === null) {
			this.setState({ ...this.state, biometricInvalidated: true })
			throw new AppError("auth-unavailable", "Biometric key invalidated")
		}
		this.unlockWith(fromBase64(raw), "biometric")
	}

	/** Zeroes the DEK and shows the lock screen (not for `none`, which has no lock). */
	public readonly lock = (): void => {
		if (this.state.mode === null || this.state.mode === "none") return
		this.epoch += 1
		this.dek?.fill(0)
		this.dek = null
		this.setState({ status: "locked", mode: this.state.mode, biometricInvalidated: false })
	}

	/** Sign-out or account deletion: forgets every local key. */
	public readonly wipe = (): Promise<void> =>
		this.enqueueLifecycle(async () => {
			this.epoch += 1
			this.dek?.fill(0)
			this.dek = null
			this.uid = null
			await this.wipeStorage()
			this.setState({ status: "uninitialized", mode: null, biometricInvalidated: false })
		})

	/**
	 * Switches the mode. Allowed only while unlocked and after confirming the current way:
	 * password (counted like an unlock attempt), biometrics (a fresh prompt), nothing for `none`.
	 */
	public readonly changeMode = async (
		target: { readonly mode: LockMode; readonly password?: string },
		confirmation: ModeConfirmation = {},
	): Promise<void> => {
		if (this.state.status !== "unlocked" || this.dek === null) {
			throw new AppError("secure-storage", "Vault is locked")
		}
		const dek = Uint8Array.from(this.dek)
		// Taken before the confirmation: a lock while the password is checked must abort the switch.
		const epoch = this.epoch
		try {
			await this.confirmCurrent(confirmation)
			await this.enrollAt(epoch, {
				dek,
				mode: target.mode,
				...(target.password === undefined ? {} : { password: target.password }),
			})
		} finally {
			dek.fill(0)
		}
	}

	public readonly noteActivity = (): void => {
		this.lastActivityAt = this.now()
	}

	public readonly noteBackgrounded = (): void => {
		this.backgroundedAt = this.now()
	}

	/** Back in the foreground: locks if the app stayed away longer than the grace period. */
	public readonly noteForegrounded = (): void => {
		this.checkAutoLock()
		this.backgroundedAt = null
		this.lastActivityAt = this.now()
	}

	/** Called on a timer by the UI. Locks after the grace period in the background or after idling. */
	public readonly checkAutoLock = (): void => {
		if (this.state.status !== "unlocked" || this.state.mode === "none") return
		const now = this.now()
		const awayTooLong =
			this.backgroundedAt !== null && now - this.backgroundedAt >= this.timings.backgroundGraceMs
		const idleTooLong = now - this.lastActivityAt >= this.timings.idleTimeoutMs
		if (awayTooLong || idleTooLong) this.lock()
	}

	/** Seconds the user still has to wait, for the lock screen (0 = can try now). */
	public readonly getRetryAfterMs = async (): Promise<number> =>
		remainingWait(await this.readAttempts(), this.now())

	private readonly unlockWith = (dek: Uint8Array, mode: LockMode): void => {
		this.dek?.fill(0)
		this.dek = dek
		this.lastActivityAt = this.now()
		this.backgroundedAt = null
		this.setState({ status: "unlocked", mode, biometricInvalidated: false })
	}

	private readonly confirmCurrent = async (confirmation: ModeConfirmation): Promise<void> => {
		const { mode } = this.state
		if (mode === "password") {
			if (confirmation.password === undefined)
				throw new AppError("invalid-credentials", "Password required")
			;(await this.checkPassword(confirmation.password)).fill(0)
		} else if (mode === "biometric") {
			const raw = await this.storage.get(KEYS.dekBiometric, BIOMETRIC)
			if (raw === null) throw new AppError("auth-unavailable", "Biometric key invalidated")
		}
	}

	/** Records the attempt BEFORE deriving the key, so killing the app mid-KDF still counts. */
	private readonly checkPassword = (password: string): Promise<Uint8Array> => {
		const run = this.passwordQueue.then(() => this.checkPasswordNow(password))
		this.passwordQueue = run.catch(() => undefined)
		return run
	}

	private readonly checkPasswordNow = async (password: string): Promise<Uint8Array> => {
		const uid = this.requireUid()
		const now = this.now()
		const record = await this.readAttempts()
		const wait = remainingWait(record, now)
		if (wait > 0) throw new LockoutError(wait)
		const next: AttemptRecord = { count: (record?.count ?? 0) + 1, lastAt: now }
		await this.storage.set(KEYS.attempts, JSON.stringify(next))

		const wrapper = parseWrapper(await this.storage.get(KEYS.wrapper))
		if (wrapper === null) throw new AppError("secure-storage", "Password wrapper missing")
		const params: KdfParams = { algorithm: "scrypt", N: wrapper.N, r: wrapper.r, p: wrapper.p }
		const kek = await this.kdf.derive(password, fromBase64(wrapper.salt), params, KEY_LENGTH)
		try {
			const dek = this.crypto.decrypt(kek, wrapper.wrapped, localPasswordAad(uid))
			try {
				await this.storage.remove(KEYS.attempts)
			} catch (error) {
				dek.fill(0)
				throw error
			}
			return dek
		} catch (error) {
			if (error instanceof AppError && error.code === "crypto") {
				throw new AppError("invalid-credentials", "Wrong password", { cause: error })
			}
			throw error
		} finally {
			kek.fill(0)
		}
	}

	private readonly wrapForPassword = async (
		uid: string,
		dek: Uint8Array,
		password: string,
	): Promise<string> => {
		const params = await calibrateKdf(this.kdf, this.now)
		const salt = this.random.bytes(SALT_LENGTH)
		const kek = await this.kdf.derive(password, salt, params, KEY_LENGTH)
		try {
			const wrapper: LocalWrapper = {
				v: 1,
				kdf: "scrypt",
				N: params.N,
				r: params.r,
				p: params.p,
				salt: toBase64(salt),
				wrapped: this.crypto.encrypt(kek, dek, localPasswordAad(uid)),
			}
			return JSON.stringify(wrapper)
		} finally {
			kek.fill(0)
		}
	}

	/**
	 * Removes the keys of the other modes, the unprotected one first. Each removal is attempted on
	 * its own. Returns `true` if the plaintext DEK may still be stored.
	 */
	private readonly removeOtherModes = async (keep: LockMode): Promise<boolean> => {
		const plainLeft = keep !== "none" ? await this.tryRemove(KEYS.dekPlain) : false
		if (keep !== "password") await this.tryRemove(KEYS.wrapper)
		if (keep !== "biometric") await this.tryRemove(KEYS.dekBiometric, BIOMETRIC)
		return plainLeft
	}

	/** `true` when the removal failed. */
	private readonly tryRemove = async (
		key: string,
		options?: SecureItemOptions,
	): Promise<boolean> => {
		try {
			await this.storage.remove(key, options)
			return false
		} catch {
			return true
		}
	}

	/** Clock set back: re-base the stored attempt on `now`, so the wait counts again from now (§4). */
	private readonly readAttempts = async (): Promise<AttemptRecord | null> => {
		const now = this.now()
		const record = parseAttempts(await this.storage.get(KEYS.attempts))
		if (record === null || record.lastAt <= now) return record
		const rebased: AttemptRecord = { count: record.count, lastAt: now }
		await this.storage.set(KEYS.attempts, JSON.stringify(rebased))
		return rebased
	}

	private readonly assertCurrent = (epoch: number): void => {
		if (epoch !== this.epoch) throw new AppError("secure-storage", "Vault state changed")
	}

	private readonly enqueueLifecycle = (task: () => Promise<void>): Promise<void> => {
		const run = this.lifecycleQueue.then(task)
		this.lifecycleQueue = run.catch(() => undefined)
		return run
	}

	private readonly wipeStorage = async (): Promise<void> => {
		await Promise.all([
			this.storage.remove(KEYS.uid),
			this.storage.remove(KEYS.mode),
			this.storage.remove(KEYS.wrapper),
			this.storage.remove(KEYS.dekPlain),
			this.storage.remove(KEYS.attempts),
		])
		// The biometric value is removed separately: it may need the same options and can fail alone.
		await this.storage.remove(KEYS.dekBiometric, BIOMETRIC)
	}

	private readonly requireUid = (): string => {
		if (this.uid === null) throw new AppError("secure-storage", "Vault is not initialized")
		return this.uid
	}

	private readonly setState = (state: VaultLockState): void => {
		this.state = state
		this.listeners.forEach(listener => {
			listener()
		})
	}
}
