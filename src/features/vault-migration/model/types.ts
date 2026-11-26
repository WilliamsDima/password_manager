import type { EntryPayload } from "@/entities/entry"
import type { EntryRewrite } from "@/shared/services/remote-store"

/** Everything the UI needs between "keys generated" and "migration committed". */
export type MigrationPlan = {
	readonly uid: string
	/** Decrypted and validated v1 data, kept in memory only. */
	readonly payloads: readonly EntryPayload[]
	/** 32 bytes; the UI shows it via `formatRecoveryKey` and asks for it back (6.4). */
	readonly recoveryKey: Uint8Array
	readonly dek: Uint8Array
	/**
	 * `write`: nothing on the server yet. `verify`: a previous run committed but did not get to
	 * check the result (connection lost); the same keys are reused and only the check is repeated.
	 */
	readonly stage: "write" | "verify"
	/**
	 * `true` when no saved key pair existed and a new one was generated. After an earlier attempt
	 * this means a recovery key shown before is void: the UI must say so (CRYPTO.md §6.3).
	 */
	readonly keysCreated: boolean
}

export type MigrationOutcome =
	| { readonly status: "verified"; readonly dek: Uint8Array }
	/** The server data did not match the v1 data; everything was rolled back, `items` are intact. */
	| { readonly status: "rolled-back" }

/** A DEK change prepared in memory; nothing is written until `commitDekChange`. */
export type DekChangePlan = {
	readonly uid: string
	readonly expectedRkVersion: number
	readonly newRecoveryKey: Uint8Array
	readonly newDek: Uint8Array
	readonly entries: readonly EntryRewrite[]
	readonly wrappedDek: string
}
