import { AppError } from "@/shared/lib/errors"
import type { IRandom } from "@/shared/services/random"
import type { IRemoteStore, WriteStatus } from "@/shared/services/remote-store"

import type { EntryCodec } from "../lib/entry-codec"
import type { Entry, EntryPayload } from "../model/types"

/** What a form edits: everything except the timestamps, which the repository owns. */
export type EntryInput = Omit<EntryPayload, "createdAt" | "updatedAt">

export type EntryListResult = {
	readonly entries: readonly Entry[]
	/** IDs of documents that did not decrypt or validate (wrong key, corrupted data): shown as a warning. */
	readonly unreadable: readonly string[]
}

/** Where the repository gets the vault key: implemented by `VaultLockService`, throws while locked. */
export type IDekSource = {
	readonly getDek: () => Uint8Array
}

/**
 * Outcome of a write. `synced: false` means the write waits in the offline queue (D1,
 * docs/CRYPTO.md §5): it is saved on this phone and the UI shows "not synced yet". It is never
 * a reason to submit the form again: that would create a second document.
 */
export type EntrySaved = { readonly entry: Entry; readonly synced: boolean }
export type EntryRemoved = { readonly synced: boolean }

export type IEntryRepository = {
	readonly list: (uid: string) => Promise<EntryListResult>
	readonly create: (uid: string, input: EntryInput) => Promise<EntrySaved>
	/**
	 * Rewrites the entry with `entry`'s content and sets `updatedAt` now. `createdAt` is taken from
	 * `entry`, so pass the entry as it was read. Upsert: an entry deleted on another device is
	 * created again; with concurrent edits the last write wins (docs/CRYPTO.md §5).
	 */
	readonly update: (uid: string, entry: Entry) => Promise<EntrySaved>
	/**
	 * Flips `favorite` on the **current** version of the document: it is read fresh (server first,
	 * cache when offline), so a password changed on another device is not rolled back by a tap on
	 * the star. `updatedAt` stays as it was: a star is not an edit. Rejects with `not-found` if
	 * the entry no longer exists.
	 */
	readonly setFavorite: (uid: string, entryId: string, favorite: boolean) => Promise<EntrySaved>
	readonly remove: (uid: string, entryId: string) => Promise<EntryRemoved>
}

/**
 * Entries of the open vault (docs/CRYPTO.md §3, §5): every entry is one AES-GCM document bound
 * to `uid` and its ID. All crypto runs here, so screens and RTK Query only see plaintext entries
 * and never a key.
 */
export class EntryRepository implements IEntryRepository {
	constructor(
		private readonly remoteStore: IRemoteStore,
		private readonly codec: EntryCodec,
		private readonly keys: IDekSource,
		private readonly random: IRandom,
		private readonly now: () => number,
	) {}

	public readonly list = async (uid: string): Promise<EntryListResult> => {
		const remote = await this.remoteStore.listEntries(uid, "default")
		return this.withDek(dek => {
			const results = remote.map(item => {
				try {
					return { entry: { id: item.id, ...this.codec.decrypt(dek, uid, item.id, item.ct) } }
				} catch {
					return { failedId: item.id }
				}
			})
			return {
				entries: results.flatMap(result => ("entry" in result ? [result.entry] : [])),
				unreadable: results.flatMap(result => ("failedId" in result ? [result.failedId] : [])),
			}
		})
	}

	public readonly create = async (uid: string, input: EntryInput): Promise<EntrySaved> => {
		const now = this.now()
		return this.write(uid, { ...input, id: this.random.uuid(), createdAt: now, updatedAt: now })
	}

	public readonly update = (uid: string, entry: Entry): Promise<EntrySaved> =>
		this.write(uid, { ...entry, updatedAt: this.now() })

	public readonly setFavorite = async (
		uid: string,
		entryId: string,
		favorite: boolean,
	): Promise<EntrySaved> => {
		const remote = await this.readFresh(uid, entryId)
		if (remote === null) throw new AppError("not-found", "Entry no longer exists")
		const current = this.withDek(dek => this.codec.decrypt(dek, uid, entryId, remote.ct))
		return this.write(uid, { ...current, id: entryId, favorite })
	}

	public readonly remove = async (uid: string, entryId: string): Promise<EntryRemoved> => ({
		synced: (await this.remoteStore.deleteEntry(uid, entryId)) === "synced",
	})

	private readonly readFresh = async (uid: string, entryId: string) => {
		try {
			return await this.remoteStore.getEntry(uid, entryId, "server")
		} catch (error) {
			if (!(error instanceof AppError) || error.code !== "network") throw error
			return this.remoteStore.getEntry(uid, entryId, "default")
		}
	}

	private readonly write = async (uid: string, entry: Entry): Promise<EntrySaved> => {
		const { id, ...payload } = entry
		const ct = this.withDek(dek => this.codec.encrypt(dek, uid, id, payload))
		const status: WriteStatus = await this.remoteStore.setEntry(uid, { id, ct })
		return { entry, synced: status === "synced" }
	}

	/** Works on a copy: a lock zeroes the original in place, and must not corrupt a running operation. */
	private readonly withDek = <T>(operation: (dek: Uint8Array) => T): T => {
		const source = this.keys.getDek()
		if (source.length === 0) throw new AppError("secure-storage", "Vault is locked")
		const dek = Uint8Array.from(source)
		try {
			return operation(dek)
		} finally {
			dek.fill(0)
		}
	}
}
