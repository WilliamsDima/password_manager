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
	| "network"
	| "permission-denied"
	| "not-found"
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
