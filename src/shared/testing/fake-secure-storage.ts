import { AppError } from "@/shared/lib/errors"
import type { ISecureStorage, SecureItemOptions } from "@/shared/services/secure-storage"

/**
 * In-memory `ISecureStorage` for tests. Values written with `requireAuthentication` behave like
 * the real adapter: every `get`/`set` is a biometric prompt (counted in `prompts`), and
 * `invalidateBiometricValues()` simulates a new fingerprint (the value silently reads as `null`).
 */
export class FakeSecureStorage implements ISecureStorage {
	public readonly values = new Map<string, string>()
	public readonly biometricKeys = new Set<string>()
	public biometricAvailable = false
	public prompts = 0
	/** The next biometric prompt is canceled by the user. */
	public cancelNextPrompt = false
	/** Keys whose `remove` fails, and a switch that makes every `get` fail (a Keystore error). */
	public readonly failRemoveKeys = new Set<string>()
	public failGets = false
	/** Runs before each `set`: lets a test inject a `lock()` / `wipe()` in the middle of an operation. */
	public onBeforeSet: (() => Promise<void>) | null = null

	public get(key: string, options?: SecureItemOptions): Promise<string | null> {
		if (this.failGets) return Promise.reject(new AppError("secure-storage", "Keystore failed"))
		if (options?.requireAuthentication === true) this.prompt()
		return Promise.resolve(this.values.get(key) ?? null)
	}

	public async set(key: string, value: string, options?: SecureItemOptions): Promise<void> {
		if (this.onBeforeSet !== null) await this.onBeforeSet()
		if (options?.requireAuthentication === true) {
			this.prompt()
			this.biometricKeys.add(key)
		}
		this.values.set(key, value)
	}

	public remove(key: string): Promise<void> {
		if (this.failRemoveKeys.has(key))
			return Promise.reject(new AppError("secure-storage", "remove failed"))
		this.values.delete(key)
		this.biometricKeys.delete(key)
		return Promise.resolve()
	}

	public canUseBiometricAuthentication(): boolean {
		return this.biometricAvailable
	}

	public readonly invalidateBiometricValues = (): void => {
		this.biometricKeys.forEach(key => this.values.delete(key))
		this.biometricKeys.clear()
	}

	private prompt(): void {
		this.prompts += 1
		if (this.cancelNextPrompt) {
			this.cancelNextPrompt = false
			throw new AppError("auth-canceled", "Authentication canceled")
		}
	}
}
