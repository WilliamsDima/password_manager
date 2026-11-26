import type { EntryPayload } from "@/entities/entry"

/** Which secret the backup needs before it can be read. */
export type BackupKeySource =
	/** Same account and same keys as now: the unlocked vault key is enough. */
	| "current"
	/** Made with another recovery key (older, or another account): ask for it. */
	| "recovery-key"
	/** v1 file from the backup script: ask for the old v1 key. */
	| "legacy-key"

export type BackupInspection = {
	readonly keySource: BackupKeySource
	readonly exportedAt: string
	/** Entries in the file. */
	readonly fileCount: number
	/** Entries in the account now (they would be replaced). */
	readonly currentCount: number
}

export type BackupFileResult = {
	readonly fileName: string
	readonly json: string
	readonly count: number
}

/** A verified replacement prepared in memory; nothing is written until `commitImport`. */
export type ImportPlan = {
	readonly uid: string
	/** `crypto.rkVersion` the new entries are encrypted for. */
	readonly rkVersion: number
	readonly payloads: readonly EntryPayload[]
	readonly writes: readonly { readonly id: string; readonly ct: string }[]
	readonly current: readonly { readonly id: string; readonly expectedCt: string }[]
	readonly exportedAt: string
}
