import type { EntryPayload } from "@/entities/entry"
import type { EntryRewrite } from "@/shared/services/remote-store"

/** What the setup screen has to do for this account (decided from the profile on the server). */
export type AccountSetupKind =
	/** `crypto` exists: enter the recovery key. */
	| "has-keys"
	/** v1 data without `crypto`: migrate with the old key. */
	| "migrate"
	/** v1 profile with no entries yet: upgrade it without asking for the old key (nothing to decrypt). */
	| "migrate-empty"
	/** A profile without `crypto` and without a v1 `items` array: nothing the app can set up. */
	| "unsupported"
	/** No profile: create a v2 account. */
	| "new"
	/** `crypto` exists and this phone holds the saved pair of an unfinished migration: run the check. */
	| "resume-migrate"
	/** `crypto` exists and this phone holds the saved pair of an unfinished new-account setup. */
	| "resume-new"

/** A fresh account's keys between "generated" and "profile created" (docs/CRYPTO.md §5). */
export type NewAccountPlan = {
	readonly uid: string
	readonly recoveryKey: Uint8Array
	readonly dek: Uint8Array
	/** `write`: no profile yet. `verify`: an earlier run created it but did not finish the check. */
	readonly stage: "write" | "verify"
	/** `true` when no saved key pair existed: a recovery key shown before is void. */
	readonly keysCreated: boolean
}

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
