import {
	collection,
	deleteDoc,
	deleteField,
	doc,
	getDoc,
	getDocFromServer,
	getDocs,
	getDocsFromServer,
	getFirestore,
	runTransaction,
	serverTimestamp,
	setDoc,
	updateDoc,
	waitForPendingWrites,
	writeBatch,
	type DocumentSnapshot,
	type Timestamp,
} from "@react-native-firebase/firestore"

import { AppError, type AppErrorCode } from "@/shared/lib/errors"

import {
	MAX_TRANSACTION_ENTRIES,
	type EntryRewrite,
	type EntryWrite,
	type IRemoteStore,
	type ReadSource,
	type RemoteCrypto,
	type RemoteCryptoInput,
	type RemoteEntry,
	type RemoteProfile,
	type WriteStatus,
} from "./remote-store"
import { settleWithin } from "./settle-write"

const BATCH_LIMIT = 400
const HOUR_MS = 3_600_000
/** Rules allow the rollback within 24 h of `migratedAt`; keep a margin for clock skew. */
const ROLLBACK_WINDOW_MS = 23 * HOUR_MS

const assertWithinLimit = (count: number): void => {
	if (count > MAX_TRANSACTION_ENTRIES) throw new AppError("limit-exceeded", "Too many entries")
}

const ERROR_CODES: Readonly<Record<string, AppErrorCode>> = {
	"firestore/permission-denied": "permission-denied",
	"firestore/unauthenticated": "permission-denied",
	"firestore/unavailable": "network",
	"firestore/deadline-exceeded": "network",
	"firestore/not-found": "not-found",
	"firestore/aborted": "conflict",
	"firestore/failed-precondition": "conflict",
}

const readCode = (error: unknown): string | null =>
	typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
		? error.code
		: null

/** Fixed message, the Firebase text stays in `cause` only. */
const run = async <T>(operation: () => Promise<T>): Promise<T> => {
	try {
		return await operation()
	} catch (error: unknown) {
		if (error instanceof AppError) throw error
		const code = readCode(error)
		throw new AppError(
			(code === null ? undefined : ERROR_CODES[code]) ?? "unknown",
			"Remote storage failed",
			{ cause: error },
		)
	}
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value)

const isTimestamp = (value: unknown): value is Timestamp =>
	isRecord(value) && typeof value.toMillis === "function"

const millisOf = (value: unknown): number | null => (isTimestamp(value) ? value.toMillis() : null)

const parseCrypto = (value: unknown): RemoteCrypto | null => {
	if (value === undefined || value === null) return null
	if (
		!isRecord(value) ||
		typeof value.wrappedDek !== "string" ||
		value.kdf !== "hkdf-sha256" ||
		typeof value.rkVersion !== "number" ||
		!Number.isInteger(value.rkVersion)
	) {
		throw new AppError("crypto", "Invalid crypto profile")
	}
	return {
		wrappedDek: value.wrappedDek,
		kdf: value.kdf,
		rkVersion: value.rkVersion,
		createdAt: millisOf(value.createdAt) ?? 0,
	}
}

const toProfile = (uid: string, data: Record<string, unknown>): RemoteProfile => {
	const schemaVersion = data.schemaVersion
	return {
		uid,
		schemaVersion: typeof schemaVersion === "number" ? schemaVersion : 1,
		email: typeof data.email === "string" ? data.email : null,
		displayName: typeof data.displayName === "string" ? data.displayName : null,
		crypto: parseCrypto(data.crypto),
		legacyItems: data.items,
		migratedAt: millisOf(data.migratedAt),
	}
}

const toEntry = (snapshot: DocumentSnapshot): RemoteEntry => {
	const data: unknown = snapshot.data()
	if (!isRecord(data) || typeof data.ct !== "string") {
		throw new AppError("crypto", "Invalid entry document")
	}
	return { id: snapshot.id, ct: data.ct, updatedAt: millisOf(data.updatedAt) }
}

const cryptoFields = (input: RemoteCryptoInput): Record<string, unknown> => ({
	wrappedDek: input.wrappedDek,
	kdf: input.kdf,
	rkVersion: input.rkVersion,
	createdAt: serverTimestamp(),
})

const chunk = <T>(items: readonly T[], size: number): readonly (readonly T[])[] =>
	Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
		items.slice(i * size, (i + 1) * size),
	)

/** `IRemoteStore` on `@react-native-firebase/firestore` (modular API). */
export class FirestoreSdkStore implements IRemoteStore {
	public readonly getProfile = (uid: string, source: ReadSource): Promise<RemoteProfile | null> =>
		run(async () => {
			const ref = doc(getFirestore(), "users", uid)
			const snapshot = await (source === "server" ? getDocFromServer(ref) : getDoc(ref))
			const data: unknown = snapshot.data()
			return snapshot.exists() && isRecord(data) ? toProfile(uid, data) : null
		})

	public readonly listEntries = (
		uid: string,
		source: ReadSource,
	): Promise<readonly RemoteEntry[]> =>
		run(async () => {
			const ref = collection(getFirestore(), "users", uid, "entries")
			const snapshot = await (source === "server" ? getDocsFromServer(ref) : getDocs(ref))
			return snapshot.docs.map(toEntry)
		})

	public readonly getEntry = (
		uid: string,
		entryId: string,
		source: ReadSource,
	): Promise<RemoteEntry | null> =>
		run(async () => {
			const ref = doc(getFirestore(), "users", uid, "entries", entryId)
			const snapshot = await (source === "server" ? getDocFromServer(ref) : getDoc(ref))
			return snapshot.exists() ? toEntry(snapshot) : null
		})

	public readonly setEntry = (uid: string, entry: EntryWrite): Promise<WriteStatus> =>
		run(() =>
			settleWithin(
				setDoc(doc(getFirestore(), "users", uid, "entries", entry.id), {
					ct: entry.ct,
					updatedAt: serverTimestamp(),
				}),
			),
		)

	public readonly deleteEntry = (uid: string, entryId: string): Promise<WriteStatus> =>
		run(() => settleWithin(deleteDoc(doc(getFirestore(), "users", uid, "entries", entryId))))

	public readonly migrateToV2 = (
		uid: string,
		input: { readonly entries: readonly EntryWrite[]; readonly crypto: RemoteCryptoInput },
	): Promise<void> =>
		run(() => {
			assertWithinLimit(input.entries.length)
			const db = getFirestore()
			const profileRef = doc(db, "users", uid)
			return runTransaction(db, async transaction => {
				const profile = await transaction.get(profileRef)
				const data: unknown = profile.data()
				if (!profile.exists() || !isRecord(data)) throw new AppError("not-found", "No profile")
				if (data.crypto !== undefined) throw new AppError("conflict", "Already migrated")
				input.entries.forEach(entry => {
					transaction.set(doc(db, "users", uid, "entries", entry.id), {
						ct: entry.ct,
						updatedAt: serverTimestamp(),
					})
				})
				transaction.update(profileRef, {
					crypto: cryptoFields(input.crypto),
					schemaVersion: 2,
					migratedAt: serverTimestamp(),
				})
			})
		})

	public readonly createV2Profile = (
		uid: string,
		input: {
			readonly email: string | null
			readonly displayName: string | null
			readonly crypto: RemoteCryptoInput
		},
	): Promise<void> =>
		run(() => {
			const db = getFirestore()
			const profileRef = doc(db, "users", uid)
			return runTransaction(db, async transaction => {
				if ((await transaction.get(profileRef)).exists()) {
					throw new AppError("conflict", "Profile already exists")
				}
				transaction.set(profileRef, {
					schemaVersion: 2,
					...(input.email === null ? {} : { email: input.email }),
					...(input.displayName === null ? {} : { displayName: input.displayName }),
					createdAt: serverTimestamp(),
					crypto: cryptoFields(input.crypto),
				})
			})
		})

	public readonly flushPendingWrites = (): Promise<void> =>
		run(() => waitForPendingWrites(getFirestore()))

	public readonly rollbackMigration = (uid: string): Promise<void> =>
		run(async () => {
			const db = getFirestore()
			// The rules reject the final write after 24 h: check before deleting anything.
			const profile = await getDocFromServer(doc(db, "users", uid))
			const profileData: unknown = profile.data()
			const migratedAt = isRecord(profileData) ? millisOf(profileData.migratedAt) : null
			if (migratedAt !== null && Date.now() - migratedAt >= ROLLBACK_WINDOW_MS) {
				throw new AppError("rollback-expired", "Rollback window has passed")
			}
			// After a DEK change the entries are newer than the v1 data: never delete them.
			const current = isRecord(profileData) ? parseCrypto(profileData.crypto) : null
			if (current !== null && current.rkVersion !== 1) {
				throw new AppError("conflict", "Keys were changed after the migration")
			}
			// Entries first, profile last: a failure in between leaves a profile that still says
			// "migrated", so the rollback is simply repeated. The other order would leave orphan
			// entries behind a profile without `crypto`, which a later migration would trip over.
			const entries = await getDocsFromServer(collection(db, "users", uid, "entries"))
			await chunk(entries.docs, BATCH_LIMIT).reduce(async (previous, docs) => {
				await previous
				const batch = writeBatch(db)
				docs.forEach(snapshot => batch.delete(snapshot.ref))
				await batch.commit()
			}, Promise.resolve())
			await updateDoc(doc(db, "users", uid), {
				crypto: deleteField(),
				schemaVersion: deleteField(),
				migratedAt: deleteField(),
			})
		})

	public readonly replaceEntries = (
		uid: string,
		input: {
			readonly expectedRkVersion: number
			readonly current: readonly { readonly id: string; readonly expectedCt: string }[]
			readonly writes: readonly EntryWrite[]
		},
	): Promise<void> =>
		run(() => {
			assertWithinLimit(input.current.length + input.writes.length)
			const db = getFirestore()
			return runTransaction(db, async transaction => {
				// The entries must belong to the key generation the plan was built for: a DEK change on
				// another device in between would leave the new entries unreadable.
				const profile = await transaction.get(doc(db, "users", uid))
				const profileData: unknown = profile.data()
				const keys = isRecord(profileData) ? parseCrypto(profileData.crypto) : null
				if (keys?.rkVersion !== input.expectedRkVersion) {
					throw new AppError("conflict", "Key version changed")
				}
				const refs = input.current.map(entry => doc(db, "users", uid, "entries", entry.id))
				const snapshots = await Promise.all(refs.map(ref => transaction.get(ref)))
				snapshots.forEach((snapshot, index) => {
					const data: unknown = snapshot.data()
					if (!isRecord(data) || data.ct !== input.current[index]?.expectedCt) {
						throw new AppError("conflict", "Entry changed")
					}
				})
				refs.forEach(ref => {
					transaction.delete(ref)
				})
				input.writes.forEach(entry => {
					transaction.set(doc(db, "users", uid, "entries", entry.id), {
						ct: entry.ct,
						updatedAt: serverTimestamp(),
					})
				})
			})
		})

	public readonly rekey = (
		uid: string,
		input: {
			readonly expectedRkVersion: number
			readonly entries: readonly EntryRewrite[]
			readonly crypto: RemoteCryptoInput
		},
	): Promise<void> =>
		run(() => {
			assertWithinLimit(input.entries.length)
			const db = getFirestore()
			const profileRef = doc(db, "users", uid)
			return runTransaction(db, async transaction => {
				const profile = await transaction.get(profileRef)
				const profileData: unknown = profile.data()
				const current = isRecord(profileData) ? parseCrypto(profileData.crypto) : null
				if (current?.rkVersion !== input.expectedRkVersion) {
					throw new AppError("conflict", "Key version changed")
				}
				const refs = input.entries.map(entry => doc(db, "users", uid, "entries", entry.id))
				const snapshots = await Promise.all(refs.map(ref => transaction.get(ref)))
				snapshots.forEach((snapshot, index) => {
					const data: unknown = snapshot.data()
					if (!isRecord(data) || data.ct !== input.entries[index]?.expectedCt) {
						throw new AppError("conflict", "Entry changed")
					}
				})
				refs.forEach((ref, index) => {
					transaction.set(ref, { ct: input.entries[index]?.ct, updatedAt: serverTimestamp() })
				})
				transaction.update(profileRef, { crypto: cryptoFields(input.crypto) })
			})
		})
}
