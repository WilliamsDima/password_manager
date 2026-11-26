import type { ISecureStorage } from "@/shared/services/secure-storage"

/** In-memory `ISecureStorage` for tests. */
export class FakeSecureStorage implements ISecureStorage {
	public readonly values = new Map<string, string>()

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
