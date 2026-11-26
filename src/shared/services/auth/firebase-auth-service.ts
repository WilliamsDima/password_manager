import {
	createUserWithEmailAndPassword,
	deleteUser,
	EmailAuthProvider,
	getAuth,
	onAuthStateChanged,
	reauthenticateWithCredential,
	signInWithEmailAndPassword,
	signOut,
	type User,
} from "@react-native-firebase/auth"

import { AppError, type AppErrorCode } from "@/shared/lib/errors"

import type { AuthUser, IAuthService } from "./auth"

/** Only these fields leave the adapter; the `User` object with its tokens stays inside (L4). */
const toAuthUser = ({ uid, email, displayName }: User): AuthUser => ({ uid, email, displayName })

// Firebase sets `code` as a plain string property in JS, so it survives R8 renaming of classes.
const ERROR_CODES: Readonly<Record<string, AppErrorCode>> = {
	"auth/invalid-credential": "invalid-credentials",
	"auth/wrong-password": "invalid-credentials",
	"auth/user-not-found": "invalid-credentials",
	"auth/invalid-email": "invalid-email",
	"auth/email-already-in-use": "email-in-use",
	"auth/weak-password": "weak-password",
	"auth/too-many-requests": "too-many-requests",
	"auth/user-disabled": "user-disabled",
	"auth/network-request-failed": "network",
	"auth/requires-recent-login": "reauth-required",
}

const readCode = (error: unknown): string | null =>
	typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
		? error.code
		: null

/** Messages are fixed strings: they never contain the email, the password or Firebase's text. */
const toAuthError = (error: unknown): AppError => {
	const code = readCode(error)
	return new AppError(
		(code === null ? undefined : ERROR_CODES[code]) ?? "unknown",
		"Authentication failed",
		{
			cause: error,
		},
	)
}

const run = async <T>(operation: () => Promise<T>): Promise<T> => {
	try {
		return await operation()
	} catch (error: unknown) {
		throw toAuthError(error)
	}
}

/** `IAuthService` on `@react-native-firebase/auth` (modular API). */
export class FirebaseAuthService implements IAuthService {
	public getCurrentUser(): AuthUser | null {
		const user = getAuth().currentUser
		return user ? toAuthUser(user) : null
	}

	public onAuthStateChanged(listener: (user: AuthUser | null) => void): () => void {
		return onAuthStateChanged(getAuth(), user => {
			listener(user ? toAuthUser(user) : null)
		})
	}

	public signIn(email: string, password: string): Promise<AuthUser> {
		return run(async () =>
			toAuthUser((await signInWithEmailAndPassword(getAuth(), email, password)).user),
		)
	}

	public signUp(email: string, password: string): Promise<AuthUser> {
		return run(async () =>
			toAuthUser((await createUserWithEmailAndPassword(getAuth(), email, password)).user),
		)
	}

	public signOut(): Promise<void> {
		return run(() => signOut(getAuth()))
	}

	public async reauthenticate(password: string): Promise<void> {
		const user = this.requireUser()
		const email = user.email
		if (!email) {
			throw new AppError("not-found", "Signed-in user has no email")
		}
		await run(() =>
			reauthenticateWithCredential(user, EmailAuthProvider.credential(email, password)),
		)
	}

	public async deleteCurrentUser(): Promise<void> {
		const user = this.requireUser()
		await run(() => deleteUser(user))
	}

	private requireUser(): User {
		const user = getAuth().currentUser
		if (!user) {
			throw new AppError("not-found", "No signed-in user")
		}
		return user
	}
}
