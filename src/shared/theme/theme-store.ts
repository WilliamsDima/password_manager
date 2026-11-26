import type { ISecureStorage } from "@/shared/services/secure-storage"

import { parseThemeMode, type ThemeMode } from "./theme-mode"

const KEY = "pm.theme.mode"

export type IThemePreferenceStore = {
	readonly load: () => Promise<ThemeMode>
	readonly save: (mode: ThemeMode) => Promise<void>
}

/** Theme choice is not a secret: it is stored without biometric binding (no `requireAuthentication`). */
export class SecureStorageThemeStore implements IThemePreferenceStore {
	constructor(private readonly storage: ISecureStorage) {}

	public async load(): Promise<ThemeMode> {
		try {
			return parseThemeMode(await this.storage.get(KEY))
		} catch {
			return "system"
		}
	}

	public save(mode: ThemeMode): Promise<void> {
		return this.storage.set(KEY, mode)
	}
}
