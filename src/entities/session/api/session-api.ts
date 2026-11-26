import { baseApi, toQueryResult } from "@/shared/api"
import type { AuthUser, IAuthService } from "@/shared/services/auth"

/** What the session endpoints take from the DI container (`api.extra`). */
export type SessionApiDependencies = {
	readonly authService: IAuthService
}

export type Credentials = {
	readonly email: string
	readonly password: string
}

/**
 * Sign-in, sign-up and sign-out. The result of a mutation is not stored as the session: the
 * auth listener is the single source of truth and updates the slice (also on token expiry).
 */
export const sessionApi = baseApi.injectEndpoints({
	endpoints: build => ({
		signIn: build.mutation<AuthUser, Credentials>({
			queryFn: ({ email, password }, { extra }) => {
				const { authService } = extra as SessionApiDependencies
				return toQueryResult(() => authService.signIn(email, password))
			},
		}),
		signUp: build.mutation<AuthUser, Credentials>({
			queryFn: ({ email, password }, { extra }) => {
				const { authService } = extra as SessionApiDependencies
				return toQueryResult(() => authService.signUp(email, password))
			},
		}),
		// `void` is the RTK idiom for an argument-less trigger: `signOut()`.
		// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
		signOut: build.mutation<undefined, void>({
			queryFn: async (_arg, { extra }) => {
				const { authService } = extra as SessionApiDependencies
				const result = await toQueryResult(() => authService.signOut())
				return "error" in result ? result : { data: undefined }
			},
		}),
	}),
})

export const { useSignInMutation, useSignUpMutation, useSignOutMutation } = sessionApi
