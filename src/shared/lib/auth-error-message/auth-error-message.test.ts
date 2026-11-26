import { strings } from "@/shared/config"

import { authErrorMessage } from "./auth-error-message"

describe("authErrorMessage", () => {
	it("returns the Russian text for known auth codes", () => {
		expect(authErrorMessage("invalid-credentials")).toBe(strings.authErrors["invalid-credentials"])
		expect(authErrorMessage("network")).toBe(strings.authErrors.network)
		expect(authErrorMessage("reauth-required")).toBe(strings.authErrors["reauth-required"])
	})

	it.each([undefined, "unknown", "crypto", "fallback", "toString"])(
		"falls back to the generic text for %p",
		code => {
			expect(authErrorMessage(code)).toBe(strings.authErrors.fallback)
		},
	)
})
