/** How the vault is protected on this device (docs/CRYPTO.md §4). */
export type LockMode = "password" | "biometric" | "none"

export type VaultLockStatus =
	/** `initialize` has not finished yet. */
	| "uninitialized"
	/** Reading the saved mode failed (Keystore error): show a retry screen instead of a spinner. */
	| "init-failed"
	/** No local key for this account: the recovery key must be entered, then a mode chosen. */
	| "setup-required"
	| "locked"
	| "unlocked"

export type VaultLockState = {
	readonly status: VaultLockStatus
	readonly mode: LockMode | null
	/** Biometric mode, but Android dropped the key (new fingerprint): enter the recovery key (the only fallback of this mode). */
	readonly biometricInvalidated: boolean
}

/** What proves the current owner before the mode is changed (§4: only after confirming the current way). */
export type ModeConfirmation = { readonly password?: string }

export type EnrollOptions = {
	readonly dek: Uint8Array
	readonly mode: LockMode
	/** Required for `"password"`. */
	readonly password?: string
}

export type VaultLockTimings = {
	/** Background time after which the vault locks (ms). */
	readonly backgroundGraceMs: number
	/** Idle time in the foreground after which the vault locks (ms). */
	readonly idleTimeoutMs: number
}

export const DEFAULT_LOCK_TIMINGS: VaultLockTimings = {
	backgroundGraceMs: 30_000,
	idleTimeoutMs: 5 * 60_000,
}

export const MIN_PASSWORD_LENGTH = 6
