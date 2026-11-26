import { authStateChanged, sessionSlice } from "./session-slice"

const { reducer } = sessionSlice
const user = { uid: "u1", email: "a@b.c", displayName: null }

describe("sessionSlice", () => {
	it("starts as initializing without a user", () => {
		expect(reducer(undefined, { type: "@@INIT" })).toEqual({ status: "initializing", user: null })
	})

	it("becomes signed-in and drops any extra payload fields such as tokens", () => {
		const withTokens = { ...user, refreshToken: "secret" }

		const state = reducer(undefined, authStateChanged(withTokens))

		expect(state.status).toBe("signed-in")
		expect(state.user).toEqual(user)
		expect(JSON.stringify(state)).not.toContain("secret")
	})

	it("becomes signed-out when the SDK reports no user", () => {
		const signedIn = reducer(undefined, authStateChanged(user))

		expect(reducer(signedIn, authStateChanged(null))).toEqual({ status: "signed-out", user: null })
	})

	it("leaves the previous state object untouched", () => {
		const before = reducer(undefined, authStateChanged(user))
		const snapshot = structuredClone(before)

		reducer(before, authStateChanged(null))

		expect(before).toEqual(snapshot)
	})

	it("selects status and user from the root state", () => {
		const root = { session: reducer(undefined, authStateChanged(user)) }

		expect(sessionSlice.selectors.selectSessionStatus(root)).toBe("signed-in")
		expect(sessionSlice.selectors.selectSessionUser(root)).toEqual(user)
	})
})
