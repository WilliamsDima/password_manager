// Firestore rules v2 (docs/CRYPTO.md §5). Run: `npm run test:rules` (starts the emulator).
import {
	assertFails,
	assertSucceeds,
	initializeTestEnvironment,
} from "@firebase/rules-unit-testing"
import {
	Timestamp,
	deleteDoc,
	doc,
	getDoc,
	serverTimestamp,
	setDoc,
	updateDoc,
} from "firebase/firestore"
import fs from "node:fs"
import { after, afterEach, before, describe, it } from "node:test"

const UID = "owner"
const WRAPPED = "v2.AAAAAAAAAAAAAAAA.AAAA"
const cryptoV = rkVersion => ({
	wrappedDek: WRAPPED,
	kdf: "hkdf-sha256",
	rkVersion,
	createdAt: Timestamp.now(),
})
const v1Profile = { id: UID, email: "a@b.c", items: [{ id: 1, title: "t", message: "m" }] }

let env
before(async () => {
	env = await initializeTestEnvironment({
		projectId: "demo-pm-rules",
		firestore: { rules: fs.readFileSync("firestore.rules", "utf8") },
	})
})
after(() => env.cleanup())
afterEach(() => env.clearFirestore())

const seed = data =>
	env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(), "users", UID), data))
const as = uid =>
	(uid === null ? env.unauthenticatedContext() : env.authenticatedContext(uid)).firestore()
const profile = db => doc(db, "users", UID)

describe("access", () => {
	it("denies anonymous and other users, allows the owner", async () => {
		await seed(v1Profile)
		await assertFails(getDoc(profile(as(null))))
		await assertFails(getDoc(profile(as("intruder"))))
		await assertSucceeds(getDoc(profile(as(UID))))
		await assertFails(setDoc(doc(as("intruder"), "users", UID, "entries", "e1"), { ct: "v2.a.b" }))
		await assertFails(getDoc(doc(as(null), "users", UID, "entries", "e1")))
	})
	it("owner reads and writes entries", async () => {
		const entry = doc(as(UID), "users", UID, "entries", "e1")
		await assertSucceeds(setDoc(entry, { ct: "v2.a.b", updatedAt: serverTimestamp() }))
		await assertSucceeds(getDoc(entry))
		await assertSucceeds(deleteDoc(entry))
	})
	it("denies everything outside users/", async () => {
		await assertFails(setDoc(doc(as(UID), "other", "x"), { a: 1 }))
	})
})

describe("v1 profile (before migration)", () => {
	it("keeps working as in v1: create, update items, delete", async () => {
		await assertSucceeds(setDoc(profile(as(UID)), v1Profile))
		await assertSucceeds(updateDoc(profile(as(UID)), { items: [] }))
		await assertSucceeds(deleteDoc(profile(as(UID))))
	})
	it("allows the migration write: crypto + schemaVersion 2 + migratedAt", async () => {
		await seed(v1Profile)
		await assertSucceeds(
			updateDoc(profile(as(UID)), {
				crypto: cryptoV(1),
				schemaVersion: 2,
				migratedAt: Timestamp.now(),
			}),
		)
	})
})

describe("v2 profile (after migration)", () => {
	const migrated = () => ({
		...v1Profile,
		schemaVersion: 2,
		crypto: cryptoV(1),
		migratedAt: Timestamp.now(),
	})

	it("rejects v1 rewriting items and deleting the profile", async () => {
		await seed(migrated())
		await assertFails(updateDoc(profile(as(UID)), { items: [] }))
		await assertFails(updateDoc(profile(as(UID)), { items: [{ id: 2, title: "x", message: "y" }] }))
		await assertFails(deleteDoc(profile(as(UID))))
	})
	it("allows harmless v1 updates (displayName)", async () => {
		await seed(migrated())
		await assertSucceeds(updateDoc(profile(as(UID)), { displayName: "Me" }))
	})
	it("allows removing items as a whole (explicit cleanup)", async () => {
		const { items: _items, ...rest } = migrated()
		await seed(migrated())
		await assertSucceeds(setDoc(profile(as(UID)), rest))
	})
	it("rejects replacing crypto with the same rkVersion or a jump", async () => {
		await seed(migrated())
		await assertFails(
			updateDoc(profile(as(UID)), { crypto: cryptoV(1), "crypto.wrappedDek": "v2.B.B" }),
		)
		await assertFails(
			updateDoc(profile(as(UID)), { crypto: { ...cryptoV(1), wrappedDek: "v2.B.B" } }),
		)
		await assertFails(updateDoc(profile(as(UID)), { crypto: cryptoV(3) }))
	})
	it("allows crypto with rkVersion + 1 (RK reissue)", async () => {
		await seed(migrated())
		await assertSucceeds(updateDoc(profile(as(UID)), { crypto: cryptoV(2) }))
	})
	it("rejects invalid crypto: no wrappedDek, wrong format, wrong kdf", async () => {
		await seed(migrated())
		const { wrappedDek: _w, ...noWrapped } = cryptoV(2)
		await assertFails(updateDoc(profile(as(UID)), { crypto: noWrapped }))
		await assertFails(
			updateDoc(profile(as(UID)), { crypto: { ...cryptoV(2), wrappedDek: "plain" } }),
		)
		await assertFails(updateDoc(profile(as(UID)), { crypto: { ...cryptoV(2), kdf: "md5" } }))
	})
	it("rejects removing crypto or downgrading schemaVersion outside the rollback window", async () => {
		await seed({ ...migrated(), migratedAt: Timestamp.fromMillis(Date.now() - 48 * 3600 * 1000) })
		await assertFails(setDoc(profile(as(UID)), v1Profile))
		await assertFails(updateDoc(profile(as(UID)), { schemaVersion: 1 }))
	})
	it("allows rollback within 24 h: items intact, crypto/schemaVersion/migratedAt removed", async () => {
		await seed(migrated())
		await assertSucceeds(setDoc(profile(as(UID)), v1Profile))
	})
	it("rejects rollback that changes items", async () => {
		await seed(migrated())
		await assertFails(setDoc(profile(as(UID)), { ...v1Profile, items: [] }))
	})
	it("allows deleting the profile only after deleteRequested", async () => {
		await seed(migrated())
		await assertFails(deleteDoc(profile(as(UID))))
		await assertSucceeds(updateDoc(profile(as(UID)), { deleteRequested: true }))
		await assertSucceeds(deleteDoc(profile(as(UID))))
	})
})

describe("profile shape (an account can never get stuck without crypto)", () => {
	it("rejects v1 → v2 without crypto, with invalid crypto, a wrong rkVersion or without migratedAt", async () => {
		await seed(v1Profile)
		const db = as(UID)
		await assertFails(updateDoc(profile(db), { schemaVersion: 2, migratedAt: Timestamp.now() }))
		await assertFails(
			updateDoc(profile(db), {
				schemaVersion: 2,
				migratedAt: Timestamp.now(),
				crypto: { ...cryptoV(1), wrappedDek: "plain" },
			}),
		)
		await assertFails(
			updateDoc(profile(db), { schemaVersion: 2, migratedAt: Timestamp.now(), crypto: cryptoV(5) }),
		)
		await assertFails(updateDoc(profile(db), { schemaVersion: 2, crypto: cryptoV(1) }))
	})
	it("rejects crypto without schemaVersion 2 on a v1 profile", async () => {
		await seed(v1Profile)
		await assertFails(updateDoc(profile(as(UID)), { crypto: cryptoV(1) }))
	})
	it("rejects creating a v2 profile without or with a wrong crypto, or a half-v2 one", async () => {
		const db = as(UID)
		await assertFails(setDoc(profile(db), { schemaVersion: 2, email: "a@b.c" }))
		await assertFails(setDoc(profile(db), { schemaVersion: 2, crypto: cryptoV(2) }))
		await assertFails(setDoc(profile(db), { email: "a@b.c", crypto: cryptoV(1) }))
	})
})

describe("new v2 account", () => {
	it("creates the profile the way the app does: server timestamps, no email", async () => {
		await assertSucceeds(
			setDoc(profile(as(UID)), {
				schemaVersion: 2,
				createdAt: serverTimestamp(),
				crypto: { ...cryptoV(1), createdAt: serverTimestamp() },
			}),
		)
	})
	it("creates the profile with crypto in one write", async () => {
		await assertSucceeds(
			setDoc(profile(as(UID)), {
				schemaVersion: 2,
				email: "a@b.c",
				crypto: cryptoV(1),
				createdAt: Timestamp.now(),
			}),
		)
	})
})
