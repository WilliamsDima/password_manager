import { strings } from "@/shared/config"
import { isAppError } from "@/shared/lib/errors"

type LockErrorKey = Exclude<keyof typeof strings.lockErrors, "fallback">

const isKey = (code: string): code is LockErrorKey =>
	code !== "fallback" && Object.hasOwn(strings.lockErrors, code)

const recoveryKeyReason = (message: string): LockErrorKey => {
	if (message.includes("length")) return "recovery-length"
	if (message.includes("character")) return "recovery-character"
	if (message.includes("checksum") || message.includes("padding")) return "recovery-checksum"
	if (message.includes("mismatch")) return "recovery-mismatch"
	return "invalid-recovery-key"
}

/** Russian text for errors of the lock and recovery flows. Never shows technical details. */
export const lockErrorMessage = (error: unknown): string => {
	if (!isAppError(error)) return strings.lockErrors.fallback
	if (error.code === "too-many-requests") {
		const wait = "retryAfterMs" in error ? error.retryAfterMs : null
		return typeof wait === "number" && wait > 0
			? `${strings.lock.retryIn} ${formatWait(wait)}`
			: strings.lockErrors["too-many-requests"]
	}
	if (error.code === "invalid-recovery-key") {
		return strings.lockErrors[recoveryKeyReason(error.message)]
	}
	return isKey(error.code) ? strings.lockErrors[error.code] : strings.lockErrors.fallback
}

/** `65_000` → `1 мин 5 с` for the lockout countdown. */
export const formatWait = (ms: number): string => {
	const total = Math.ceil(ms / 1000)
	const hours = Math.floor(total / 3600)
	const minutes = Math.floor((total % 3600) / 60)
	const seconds = total % 60
	return [
		hours > 0 ? `${String(hours)} ч` : "",
		minutes > 0 ? `${String(minutes)} мин` : "",
		seconds > 0 && hours === 0 ? `${String(seconds)} с` : "",
	]
		.filter(part => part !== "")
		.join(" ")
}
