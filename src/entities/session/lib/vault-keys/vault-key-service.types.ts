import type { Envelope } from "@/shared/services/crypto"

export type IVaultKeyService = {
	/** 256-bit Recovery Key from the CSPRNG. Never sent to the server. */
	readonly generateRecoveryKey: () => Uint8Array
	/** 256-bit data encryption key from the CSPRNG. */
	readonly generateDek: () => Uint8Array
	/** `wrappedDek` for `users/{uid}.crypto`; bound to `uid` and `rkVersion`. */
	readonly wrapDek: (
		recoveryKey: Uint8Array,
		dek: Uint8Array,
		uid: string,
		rkVersion: number,
	) => Envelope
	/** Throws `AppError("crypto")` if the recovery key, `uid` or `rkVersion` do not match. */
	readonly unwrapDek: (
		recoveryKey: Uint8Array,
		wrappedDek: Envelope,
		uid: string,
		rkVersion: number,
	) => Uint8Array
}
