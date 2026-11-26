import * as firebaseAuth from "@react-native-firebase/auth"

import { AppError } from "@/shared/lib/errors"

import { FirebaseAuthService } from "./firebase-auth-service"

jest.mock("@react-native-firebase/auth", () => ({
	getAuth: jest.fn(),
	onAuthStateChanged: jest.fn(),
	signInWithEmailAndPassword: jest.fn(),
	createUserWithEmailAndPassword: jest.fn(),
	signOut: jest.fn(),
	reauthenticateWithCredential: jest.fn(),
	deleteUser: jest.fn(),
	EmailAuthProvider: { credential: jest.fn() },
}))

const native = jest.mocked(firebaseAuth)

// The real `User` carries tokens and many more fields; the adapter must drop them.
const firebaseUser = {
	uid: "u1",
	email: "a@b.c",
	displayName: "Anna",
	refreshToken: "refresh-secret",
	stsTokenManager: { accessToken: "access-secret" },
}

const authWith = (currentUser: unknown) => ({ currentUser }) as unknown as firebaseAuth.Auth

const nativeError = (code: string): Error => Object.assign(new Error("native text"), { code })

describe("FirebaseAuthService", () => {
	const service = new FirebaseAuthService()

	beforeEach(() => {
		jest.resetAllMocks()
		native.getAuth.mockReturnValue(authWith(firebaseUser))
	})

	it("returns only the profile fields from sign-in", async () => {
		native.signInWithEmailAndPassword.mockResolvedValue({
			user: firebaseUser,
		} as unknown as firebaseAuth.UserCredential)

		const user = await service.signIn("a@b.c", "pw")

		expect(user).toEqual({ uid: "u1", email: "a@b.c", displayName: "Anna" })
		expect(native.signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), "a@b.c", "pw")
	})

	it("returns only the profile fields from sign-up", async () => {
		native.createUserWithEmailAndPassword.mockResolvedValue({
			user: firebaseUser,
		} as unknown as firebaseAuth.UserCredential)

		expect(await service.signUp("a@b.c", "pw")).toEqual({
			uid: "u1",
			email: "a@b.c",
			displayName: "Anna",
		})
	})

	it("maps the current user without tokens, or null when signed out", () => {
		expect(service.getCurrentUser()).toEqual({ uid: "u1", email: "a@b.c", displayName: "Anna" })

		native.getAuth.mockReturnValue(authWith(null))

		expect(service.getCurrentUser()).toBeNull()
	})

	it("passes mapped users to the auth state listener and returns the unsubscribe function", () => {
		const unsubscribe = jest.fn()
		native.onAuthStateChanged.mockImplementation((_auth, observer) => {
			if (typeof observer === "function") {
				observer(firebaseUser as unknown as firebaseAuth.User)
				observer(null)
			}
			return unsubscribe
		})
		const listener = jest.fn()

		const result = service.onAuthStateChanged(listener)

		expect(listener.mock.calls).toEqual([
			[{ uid: "u1", email: "a@b.c", displayName: "Anna" }],
			[null],
		])
		expect(result).toBe(unsubscribe)
	})

	it.each([
		["auth/invalid-credential", "invalid-credentials"],
		["auth/wrong-password", "invalid-credentials"],
		["auth/user-not-found", "invalid-credentials"],
		["auth/invalid-email", "invalid-email"],
		["auth/email-already-in-use", "email-in-use"],
		["auth/weak-password", "weak-password"],
		["auth/too-many-requests", "too-many-requests"],
		["auth/user-disabled", "user-disabled"],
		["auth/network-request-failed", "network"],
		["auth/requires-recent-login", "reauth-required"],
		["auth/something-new", "unknown"],
	])("maps %s to the %s error code without leaking native text", async (nativeCode, code) => {
		native.signInWithEmailAndPassword.mockRejectedValue(nativeError(nativeCode))

		const error = await service.signIn("a@b.c", "pw").catch((e: unknown) => e)

		expect(error).toBeInstanceOf(AppError)
		expect(error).toMatchObject({ code, message: "Authentication failed" })
	})

	it("wraps errors without a code as unknown", async () => {
		native.signOut.mockRejectedValue(new Error("boom"))

		await expect(service.signOut()).rejects.toMatchObject({ code: "unknown" })
	})

	it("reauthenticates with the email credential of the current user", async () => {
		const credential = { providerId: "password" }
		const credentialSpy = jest
			.spyOn(native.EmailAuthProvider, "credential")
			.mockReturnValue(credential)
		native.reauthenticateWithCredential.mockResolvedValue(
			{} as unknown as firebaseAuth.UserCredential,
		)

		await service.reauthenticate("pw")

		expect(credentialSpy).toHaveBeenCalledWith("a@b.c", "pw")
		expect(native.reauthenticateWithCredential).toHaveBeenCalledWith(firebaseUser, credential)
	})

	it("refuses account operations when nobody is signed in", async () => {
		native.getAuth.mockReturnValue(authWith(null))

		await expect(service.reauthenticate("pw")).rejects.toMatchObject({ code: "not-found" })
		await expect(service.deleteCurrentUser()).rejects.toMatchObject({ code: "not-found" })
		expect(native.deleteUser).not.toHaveBeenCalled()
	})

	it("deletes the current user", async () => {
		native.deleteUser.mockResolvedValue(undefined)

		await service.deleteCurrentUser()

		expect(native.deleteUser).toHaveBeenCalledWith(firebaseUser)
	})
})
