import * as SecureStore from "expo-secure-store"

import { AppError } from "@/shared/lib/errors"

import type { ISecureStorage, SecureItemOptions } from "./secure-storage"

/**
 * Plain values share one keychain service. Each authenticated value gets its **own** service:
 * after a biometric key is invalidated, expo-secure-store's next `set` deletes every
 * authenticated value under the same service, so a shared service would silently erase the others.
 */
const PLAIN_SERVICE = "pm.plain"
const authServiceFor = (key: string): string => `pm.auth.${key}`

// Native messages are string literals in expo-secure-store and survive R8. Error `code`s are not
// used: they are derived from Kotlin class names at runtime, and R8 renames those classes.
const AUTH_FAILURE_MARKER = "Could not authenticate the user"

/**
 * Outcomes to retry quietly instead of treating biometrics as unavailable: the user canceled,
 * the system closed the prompt (BiometricPrompt.ERROR_CANCELED = 5, e.g. the app went to the
 * background), or a prompt is already showing.
 */
const AUTH_CANCELED_MARKERS = [
	"User canceled the authentication",
	"Unknown error (code: 5)",
	"Authentication is already in progress",
] as const

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : "")

/** Maps a native failure to `AppError` without copying the native text into the message. */
const toStorageError = (operation: string, error: unknown): AppError => {
	const message = messageOf(error)
	if (AUTH_CANCELED_MARKERS.some(marker => message.includes(marker))) {
		return new AppError("auth-canceled", "Biometric prompt was canceled", { cause: error })
	}
	if (message.includes(AUTH_FAILURE_MARKER)) {
		return new AppError("auth-unavailable", "Biometric authentication failed", { cause: error })
	}
	return new AppError("secure-storage", `Secure storage ${operation} failed`, { cause: error })
}

const toNativeOptions = (
	key: string,
	options: SecureItemOptions | undefined,
): SecureStore.SecureStoreOptions =>
	options?.requireAuthentication === true
		? {
				keychainService: authServiceFor(key),
				requireAuthentication: true,
				...(options.authenticationPrompt === undefined
					? {}
					: { authenticationPrompt: options.authenticationPrompt }),
			}
		: { keychainService: PLAIN_SERVICE }

export class ExpoSecureStorage implements ISecureStorage {
	public async get(key: string, options?: SecureItemOptions): Promise<string | null> {
		try {
			return await SecureStore.getItemAsync(key, toNativeOptions(key, options))
		} catch (error: unknown) {
			throw toStorageError("read", error)
		}
	}

	public async set(key: string, value: string, options?: SecureItemOptions): Promise<void> {
		try {
			await SecureStore.setItemAsync(key, value, toNativeOptions(key, options))
		} catch (error: unknown) {
			throw toStorageError("write", error)
		}
	}

	public async remove(key: string, options?: SecureItemOptions): Promise<void> {
		try {
			await SecureStore.deleteItemAsync(key, toNativeOptions(key, options))
		} catch (error: unknown) {
			throw toStorageError("delete", error)
		}
	}

	public canUseBiometricAuthentication(): boolean {
		return SecureStore.canUseBiometricAuthentication()
	}
}
