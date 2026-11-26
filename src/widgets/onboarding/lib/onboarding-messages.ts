import { LegacyDataError } from "@/entities/entry"
import { parseRecoveryKey } from "@/entities/session"
import { strings } from "@/shared/config"
import { bytesEqual } from "@/shared/lib/encoding"
import { isAppError } from "@/shared/lib/errors"
import { lockErrorMessage } from "@/shared/lib/lock-error-message"

/** Russian text for an error of the onboarding flow. Never shows keys or data. */
export const onboardingErrorMessage = (error: unknown): string => {
	if (error instanceof LegacyDataError) {
		return strings.onboarding.legacy.wrongKey.replace("{count}", String(error.failedIds.length))
	}
	if (isAppError(error) && error.code === "conflict") return strings.onboarding.conflict
	if (isAppError(error) && error.code === "setup-pending")
		return strings.onboarding.otherAccountPending
	return lockErrorMessage(error)
}

/**
 * Compares what the user typed with the key that was shown. `null` = the same key; otherwise
 * the text to show. The typed key is zeroed here.
 */
export const confirmationProblem = (typed: string, shown: Uint8Array): string | null => {
	const parsed = parseRecoveryKey(typed)
	if (!parsed.ok) {
		return strings.lockErrors[
			parsed.reason === "length"
				? "recovery-length"
				: parsed.reason === "character"
					? "recovery-character"
					: "recovery-checksum"
		]
	}
	const same = bytesEqual(parsed.key, shown)
	parsed.key.fill(0)
	return same ? null : strings.onboarding.confirm.mismatch
}
