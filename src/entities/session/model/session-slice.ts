import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import type { AuthUser } from "@/shared/services/auth"

/** `initializing` until the auth SDK reports the persisted session for the first time. */
export type SessionStatus = "initializing" | "signed-in" | "signed-out"

/** Only the profile fields the app needs: never the Firebase `User` with its tokens (L4). */
export type SessionState = {
	readonly status: SessionStatus
	readonly user: AuthUser | null
}

/** Shape of the root state as far as this slice is concerned. */
export type SessionRootState = { readonly session: SessionState }

const initialState: SessionState = { status: "initializing", user: null }

/**
 * Pure state: reducers have no side effects. The auth listener (app layer) dispatches
 * `authStateChanged`; signing in or out only goes through RTK Query mutations.
 */
export const sessionSlice = createSlice({
	name: "session",
	initialState,
	reducers: {
		// Copies the profile fields explicitly: extra properties on the payload (a Firebase `User`
		// has tokens) must never reach the store, even if an adapter passes one by mistake (L4).
		authStateChanged: (_state, action: PayloadAction<AuthUser | null>): SessionState => {
			const user = action.payload
			return user
				? {
						status: "signed-in",
						user: { uid: user.uid, email: user.email, displayName: user.displayName },
					}
				: { status: "signed-out", user: null }
		},
	},
	selectors: {
		selectSessionStatus: state => state.status,
		selectSessionUser: state => state.user,
	},
})

export const { authStateChanged } = sessionSlice.actions
