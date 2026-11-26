/**
 * Typed application errors (docs/ARCHITECTURE.md §4). Adapters translate library errors into
 * `AppError` so that the rest of the code never inspects native error strings.
 *
 * Messages must never contain secrets: keys, passwords, decrypted data or stored values.
 */
export type AppErrorCode =
	/** The user dismissed the biometric prompt (retry or back out, not a data problem). */
	| "auth-canceled"
	/** Biometric authentication failed or is unavailable: lockout, no hardware, none enrolled. */
	| "auth-unavailable"
	/** SecureStore / Keystore could not read or write a value. */
	| "secure-storage"
	/** Decryption failed (wrong key, tampered or corrupted data) or the format is unknown. */
	| "crypto"
	/** Wrong email or password (also unknown account: the two are deliberately not told apart). */
	| "invalid-credentials"
	/** The recovery key text is malformed (wrong length, character or checksum). */
	| "invalid-recovery-key"
	| "invalid-email"
	| "email-in-use"
	| "weak-password"
	| "too-many-requests"
	| "user-disabled"
	/** Firebase wants a fresh sign-in before a sensitive operation (account deletion). */
	| "reauth-required"
	| "network"
	| "permission-denied"
	| "not-found"
	/** A transaction precondition failed: the data changed under us or was already migrated. */
	| "conflict"
	/** Migration rollback is no longer allowed by the rules (24 h after `migratedAt`). */
	| "rollback-expired"
	/** The change is larger than one transaction is trusted to carry. */
	| "limit-exceeded"
	| "unknown"

export class AppError extends Error {
	public override readonly name = "AppError"

	constructor(
		public readonly code: AppErrorCode,
		message: string,
		options?: { readonly cause?: unknown },
	) {
		super(message, options)
	}
}

export const isAppError = (error: unknown): error is AppError => error instanceof AppError

/** Wraps anything thrown into an `AppError`, keeping the original as `cause` (never as message). */
export const toAppError = (error: unknown): AppError =>
	isAppError(error) ? error : new AppError("unknown", "Unexpected error", { cause: error })

/** Plain, serializable form for Redux state (RTK Query `error`). */
export type SerializedAppError = {
	readonly code: AppErrorCode
	readonly message: string
}

export const serializeAppError = (error: unknown): SerializedAppError => {
	const appError = toAppError(error)
	return { code: appError.code, message: appError.message }
}
