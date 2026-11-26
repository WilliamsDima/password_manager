import type { AuthUser, IAuthService } from "@/shared/services/auth"

/** In-memory `IAuthService` for tests. Not imported by app code. */
export class FakeAuthService implements IAuthService {
	public readonly signInCalls: { readonly email: string; readonly password: string }[] = []
	public failWith: Error | null = null
	private user: AuthUser | null = null
	private readonly listeners = new Set<(user: AuthUser | null) => void>()

	public getCurrentUser(): AuthUser | null {
		return this.user
	}

	public onAuthStateChanged(listener: (user: AuthUser | null) => void): () => void {
		this.listeners.add(listener)
		listener(this.user)
		return () => {
			this.listeners.delete(listener)
		}
	}

	public signIn(email: string, password: string): Promise<AuthUser> {
		this.signInCalls.push({ email, password })
		return this.authenticate(email)
	}

	public signUp(email: string, _password: string): Promise<AuthUser> {
		return this.authenticate(email)
	}

	public signOut(): Promise<void> {
		return this.failWith ? Promise.reject(this.failWith) : (this.emit(null), Promise.resolve())
	}

	public reauthenticate(_password: string): Promise<void> {
		return Promise.resolve()
	}

	public deleteCurrentUser(): Promise<void> {
		this.emit(null)
		return Promise.resolve()
	}

	public get listenerCount(): number {
		return this.listeners.size
	}

	/** Simulates the SDK reporting a user (restored session, token refresh, sign-out elsewhere). */
	public emit(user: AuthUser | null): void {
		this.user = user
		this.listeners.forEach(listener => {
			listener(user)
		})
	}

	private authenticate(email: string): Promise<AuthUser> {
		if (this.failWith) {
			return Promise.reject(this.failWith)
		}
		const user: AuthUser = { uid: "uid-1", email, displayName: null }
		this.emit(user)
		return Promise.resolve(user)
	}
}
