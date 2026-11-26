/**
 * Device secret storage (docs/CRYPTO.md §4): DEK, local password wrapper, attempt counter.
 *
 * Contract (verified against expo-secure-store 58.0.3, task 4.1a):
 * - `get` resolves `null` both when the key is missing **and** when a biometric-bound value was
 *   invalidated by Android (new fingerprint enrolled) or can no longer be decrypted (the native
 *   side deletes it). Callers that must tell these apart keep their own non-secret marker
 *   (e.g. the current lock mode) in unauthenticated storage.
 * - With `requireAuthentication`, Android asks for biometrics on every `get` and `set` of that
 *   value (per-use key, BiometricPrompt + CryptoObject, Class 3 / STRONG only). So the vault
 *   reads the biometric-bound DEK **once per unlock** and keeps it in memory until auto-lock;
 *   entries never touch SecureStore. There is no fallback to the device PIN: the fallback is
 *   the app password or the recovery key.
 * - After a biometric-bound key is invalidated, the next `set` of that value regenerates it.
 *   The adapter keeps every authenticated value under its own Keystore key, so this never
 *   erases other values.
 * - A canceled, system-closed or duplicate prompt rejects with `AppError("auth-canceled")`; lockout, missing hardware or
 *   no enrolled biometrics reject with `AppError("auth-unavailable")`; any other native failure
 *   rejects with `AppError("secure-storage")`.
 */
export type SecureItemOptions = {
	/** Bind the value to biometric authentication. Must match between `set`, `get` and `remove`. */
	readonly requireAuthentication?: boolean
	/** Title of the biometric prompt. */
	readonly authenticationPrompt?: string
}

export type ISecureStorage = {
	readonly get: (key: string, options?: SecureItemOptions) => Promise<string | null>
	readonly set: (key: string, value: string, options?: SecureItemOptions) => Promise<void>
	readonly remove: (key: string, options?: SecureItemOptions) => Promise<void>
	/** True when a Class 3 biometric is enrolled and can protect values. */
	readonly canUseBiometricAuthentication: () => boolean
}
