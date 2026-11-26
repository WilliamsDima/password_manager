import { authStateChanged } from "@/entities/session"
import { baseApi } from "@/shared/api"
import type { IAuthService } from "@/shared/services/auth"

import type { AppDispatch } from "../store/store"

/**
 * Subscribes the store to the auth SDK: the SDK is the single source of truth for the session
 * (restored on cold start, expired, signed out elsewhere). This is the side effect that does
 * not belong in a reducer. When the user changes, the RTK Query cache is dropped so that one
 * account's data is never shown to the next. Returns the unsubscribe function.
 */
export const startAuthSync = (authService: IAuthService, dispatch: AppDispatch): (() => void) => {
	// A mutable holder instead of `let`: the subscription callback outlives this call.
	const last = { uid: null as string | null }

	return authService.onAuthStateChanged(user => {
		const uid = user?.uid ?? null
		if (uid !== last.uid) {
			dispatch(baseApi.util.resetApiState())
			last.uid = uid
		}
		dispatch(authStateChanged(user))
	})
}
