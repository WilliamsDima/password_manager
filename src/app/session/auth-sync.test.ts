import { authStateChanged } from "@/entities/session"
import { baseApi } from "@/shared/api"
import { FakeAuthService } from "@/shared/testing"

import { startAuthSync } from "./auth-sync"

const anna = { uid: "u1", email: "a@b.c", displayName: null }
const boris = { uid: "u2", email: "b@b.c", displayName: null }
const reset = baseApi.util.resetApiState()

const setup = () => {
	const authService = new FakeAuthService()
	const dispatch = jest.fn()
	const stop = startAuthSync(authService, dispatch)
	return { authService, dispatch, stop }
}

describe("startAuthSync", () => {
	it("reports the current user (or none) right after subscribing", () => {
		const { dispatch } = setup()

		expect(dispatch.mock.calls).toEqual([[authStateChanged(null)]])
	})

	it("reports a restored session after clearing the cache of the previous (empty) session", () => {
		const authService = new FakeAuthService()
		authService.emit(anna)
		const dispatch = jest.fn()

		startAuthSync(authService, dispatch)

		// The first user always counts as a change from "nobody": the reset is harmless on cold start.
		expect(dispatch.mock.calls).toEqual([[reset], [authStateChanged(anna)]])
	})

	it("drops the RTK Query cache before reporting a sign-in and a sign-out", () => {
		const { authService, dispatch } = setup()
		dispatch.mockClear()

		authService.emit(anna)
		authService.emit(null)

		expect(dispatch.mock.calls).toEqual([
			[reset],
			[authStateChanged(anna)],
			[reset],
			[authStateChanged(null)],
		])
	})

	it("keeps the cache when the SDK re-reports the same user (token refresh)", () => {
		const { authService, dispatch } = setup()
		authService.emit(anna)
		dispatch.mockClear()

		authService.emit({ ...anna, displayName: "Anna" })

		expect(dispatch.mock.calls).toEqual([[authStateChanged({ ...anna, displayName: "Anna" })]])
	})

	it("drops the cache when one account is replaced by another without a sign-out", () => {
		const { authService, dispatch } = setup()
		authService.emit(anna)
		dispatch.mockClear()

		authService.emit(boris)

		expect(dispatch.mock.calls).toEqual([[reset], [authStateChanged(boris)]])
	})

	it("stops listening when unsubscribed", () => {
		const { authService, dispatch, stop } = setup()
		dispatch.mockClear()

		stop()
		authService.emit(anna)

		expect(authService.listenerCount).toBe(0)
		expect(dispatch).not.toHaveBeenCalled()
	})
})
