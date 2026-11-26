import { AppError } from "@/shared/lib/errors"
import type {
	EntryRewrite,
	EntryWrite,
	IRemoteStore,
	RemoteCrypto,
	RemoteCryptoInput,
	RemoteEntry,
	RemoteProfile,
} from "@/shared/services/remote-store"

const ROLLBACK_WINDOW_MS = 23 * 3_600_000

type Failure = "before-commit" | "after-commit"

/**
 * In-memory `IRemoteStore` for tests with the same transactional semantics as the real one
 * (all-or-nothing writes, `conflict` on a failed precondition) and switchable network failures.
 */
export class FakeRemoteStore implements IRemoteStore {
	public profiles = new Map<string, RemoteProfile>()
	public entries = new Map<string, RemoteEntry>()
	/** Next `migrateToV2` / `rekey` fails: before nothing is written, after the write is kept. */
	public failNextTransaction: Failure | null = null
	public failNextListEntries = false
	public rollbackCalls = 0
	public flushCalls = 0
	/** Wall clock in ms: `migratedAt` is stamped with it and the rollback window is measured on it. */
	public nowMs = 1_700_000_000_000
	private clock = 1_000

	public readonly seedProfile = (profile: RemoteProfile): void => {
		this.profiles.set(profile.uid, profile)
	}

	public readonly getProfile = (uid: string): Promise<RemoteProfile | null> =>
		Promise.resolve(this.profiles.get(uid) ?? null)

	public readonly listEntries = (): Promise<readonly RemoteEntry[]> => {
		if (this.failNextListEntries) {
			this.failNextListEntries = false
			return Promise.reject(new AppError("network", "Remote storage failed"))
		}
		return Promise.resolve([...this.entries.values()])
	}

	public readonly setEntry = (_uid: string, entry: EntryWrite): Promise<void> => {
		this.entries.set(entry.id, { ...entry, updatedAt: this.tick() })
		return Promise.resolve()
	}

	public readonly deleteEntry = (_uid: string, entryId: string): Promise<void> => {
		this.entries.delete(entryId)
		return Promise.resolve()
	}

	public readonly migrateToV2 = (
		uid: string,
		input: { readonly entries: readonly EntryWrite[]; readonly crypto: RemoteCryptoInput },
	): Promise<void> =>
		this.transaction(() => {
			const profile = this.profiles.get(uid)
			if (!profile) throw new AppError("not-found", "No profile")
			if (profile.crypto !== null) throw new AppError("conflict", "Already migrated")
			return () => {
				input.entries.forEach(entry =>
					this.entries.set(entry.id, { ...entry, updatedAt: this.tick() }),
				)
				this.profiles.set(uid, {
					...profile,
					schemaVersion: 2,
					crypto: this.cryptoOf(input.crypto),
					migratedAt: this.nowMs,
				})
			}
		})

	public readonly flushPendingWrites = (): Promise<void> => {
		this.flushCalls += 1
		return Promise.resolve()
	}

	public readonly rollbackMigration = (uid: string): Promise<void> => {
		const profile = this.profiles.get(uid)
		if (profile?.crypto != null && profile.crypto.rkVersion !== 1) {
			return Promise.reject(new AppError("conflict", "Keys were changed after the migration"))
		}
		if (profile?.migratedAt != null && this.nowMs - profile.migratedAt >= ROLLBACK_WINDOW_MS) {
			return Promise.reject(new AppError("rollback-expired", "Rollback window has passed"))
		}
		this.rollbackCalls += 1
		this.entries.clear()
		if (profile) {
			this.profiles.set(uid, { ...profile, schemaVersion: 1, crypto: null, migratedAt: null })
		}
		return Promise.resolve()
	}

	public readonly replaceEntries = (
		uid: string,
		input: {
			readonly expectedRkVersion: number
			readonly current: readonly { readonly id: string; readonly expectedCt: string }[]
			readonly writes: readonly EntryWrite[]
		},
	): Promise<void> =>
		this.transaction(() => {
			if (input.current.length + input.writes.length > 400) {
				throw new AppError("limit-exceeded", "Too many entries")
			}
			if (this.profiles.get(uid)?.crypto?.rkVersion !== input.expectedRkVersion) {
				throw new AppError("conflict", "Key version changed")
			}
			input.current.forEach(entry => {
				if (this.entries.get(entry.id)?.ct !== entry.expectedCt) {
					throw new AppError("conflict", "Entry changed")
				}
			})
			return () => {
				input.current.forEach(entry => this.entries.delete(entry.id))
				input.writes.forEach(entry =>
					this.entries.set(entry.id, { ...entry, updatedAt: this.tick() }),
				)
			}
		})

	public readonly rekey = (
		uid: string,
		input: {
			readonly expectedRkVersion: number
			readonly entries: readonly EntryRewrite[]
			readonly crypto: RemoteCryptoInput
		},
	): Promise<void> =>
		this.transaction(() => {
			const profile = this.profiles.get(uid)
			if (profile?.crypto?.rkVersion !== input.expectedRkVersion) {
				throw new AppError("conflict", "Key version changed")
			}
			input.entries.forEach(entry => {
				if (this.entries.get(entry.id)?.ct !== entry.expectedCt) {
					throw new AppError("conflict", "Entry changed")
				}
			})
			return () => {
				input.entries.forEach(entry =>
					this.entries.set(entry.id, { id: entry.id, ct: entry.ct, updatedAt: this.tick() }),
				)
				this.profiles.set(uid, { ...profile, crypto: this.cryptoOf(input.crypto) })
			}
		})

	/** `prepare` checks preconditions and returns the writes; they are applied all together. */
	private readonly transaction = (prepare: () => () => void): Promise<void> => {
		const failure = this.failNextTransaction
		this.failNextTransaction = null
		try {
			const apply = prepare()
			if (failure === "before-commit") throw new AppError("network", "Remote storage failed")
			apply()
			if (failure === "after-commit") throw new AppError("network", "Remote storage failed")
			return Promise.resolve()
		} catch (error) {
			return Promise.reject(error instanceof Error ? error : new Error("unknown"))
		}
	}

	private readonly cryptoOf = (input: RemoteCryptoInput): RemoteCrypto => ({
		...input,
		createdAt: this.tick(),
	})

	private readonly tick = (): number => {
		this.clock += 1
		return this.clock
	}
}
