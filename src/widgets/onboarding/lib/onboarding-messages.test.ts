import { LegacyDataError } from "@/entities/entry"
import { formatRecoveryKey } from "@/entities/session"
import { strings } from "@/shared/config"
import { AppError } from "@/shared/lib/errors"

import { confirmationProblem, onboardingErrorMessage } from "./onboarding-messages"

const KEY = Uint8Array.from({ length: 32 }, (_, index) => (index * 7 + 3) & 0xff)

describe("onboardingErrorMessage", () => {
	it("tells how many records did not decrypt, without ids", () => {
		const message = onboardingErrorMessage(new LegacyDataError(["1600000000000", "x"]))
		expect(message).toContain("2")
		expect(message).not.toContain("1600000000000")
	})

	it("explains a conflict and falls back to the lock messages for the rest", () => {
		expect(onboardingErrorMessage(new AppError("conflict", "x"))).toBe(strings.onboarding.conflict)
		expect(onboardingErrorMessage(new AppError("setup-pending", "x"))).toBe(
			strings.onboarding.otherAccountPending,
		)
		expect(onboardingErrorMessage(new AppError("network", "x"))).toBe(strings.lockErrors.network)
		expect(onboardingErrorMessage(new Error("boom"))).toBe(strings.lockErrors.fallback)
	})
})

describe("confirmationProblem", () => {
	it("accepts the same key in any format the parser takes", () => {
		const text = formatRecoveryKey(KEY)
		expect(confirmationProblem(text, KEY)).toBeNull()
		expect(confirmationProblem(`  ${text.toLowerCase().replaceAll("-", " ")} `, KEY)).toBeNull()
	})

	it("rejects a well-formed key that is not the shown one", () => {
		const other = Uint8Array.from(KEY, byte => byte ^ 0xff)
		expect(confirmationProblem(formatRecoveryKey(other), KEY)).toBe(
			strings.onboarding.confirm.mismatch,
		)
	})

	it("explains a malformed key", () => {
		expect(confirmationProblem("ABCD", KEY)).toBe(strings.lockErrors["recovery-length"])
		const bad = formatRecoveryKey(KEY).slice(0, -1) + "U"
		expect(confirmationProblem(bad, KEY)).toBe(strings.lockErrors["recovery-character"])
	})
})
