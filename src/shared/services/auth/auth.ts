/**
 * Account authentication. Implementation: `FirebaseAuthService` on `@react-native-firebase/auth`.
 * Only the profile fields the app needs leave the adapter; the Firebase `User` object with its
 * tokens never reaches the store (SECURITY_AUDIT L4). Failures throw `AppError` with an auth code
 * (`invalid-credentials`, `email-in-use`, `network`, ...); messages never contain credentials.
 */
export type AuthUser = {
	readonly uid: string
	readonly email: string | null
	readonly displayName: string | null
}

export type IAuthService = {
	readonly getCurrentUser: () => AuthUser | null
	/** Calls `listener` with the current user and on every change; returns an unsubscribe function. */
	readonly onAuthStateChanged: (listener: (user: AuthUser | null) => void) => () => void
	readonly signIn: (email: string, password: string) => Promise<AuthUser>
	readonly signUp: (email: string, password: string) => Promise<AuthUser>
	readonly signOut: () => Promise<void>
	/** Required before sensitive operations such as account deletion (CRYPTO.md §5, D4). */
	readonly reauthenticate: (password: string) => Promise<void>
	readonly deleteCurrentUser: () => Promise<void>
}
