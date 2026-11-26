import { AppError } from "@/shared/lib/errors"

const SECOND = 1000
const MINUTE = 60 * SECOND

/**
 * Wait before the next password attempt, indexed by the number of attempts already made
 * (docs/CRYPTO.md §4): 0, 0, 0, 30 s, 1 min, 5 min, 15 min, then 1 h per attempt. The key is never wiped.
 */
const DELAYS_MS = [0, 0, 0, 30 * SECOND, MINUTE, 5 * MINUTE, 15 * MINUTE, 60 * MINUTE] as const

export type AttemptRecord = {
	readonly count: number
	/** ms since epoch of the latest attempt (recorded **before** the password is checked) */
	readonly lastAt: number
}

export const delayAfter = (count: number): number =>
	DELAYS_MS[Math.min(Math.max(count, 0), DELAYS_MS.length - 1)] ?? 0

/** Thrown while the delay after failed attempts has not elapsed. */
export class LockoutError extends AppError {
	constructor(public readonly retryAfterMs: number) {
		super("too-many-requests", "Too many attempts")
	}
}

/**
 * Remaining wait in ms (0 = allowed). If the clock went back before the last attempt, the record
 * is re-based on `now` so the delay counts again from now, never "until the original date".
 */
export const remainingWait = (record: AttemptRecord | null, now: number): number => {
	if (record === null) return 0
	const lastAt = Math.min(record.lastAt, now)
	return Math.max(0, lastAt + delayAfter(record.count) - now)
}

export const parseAttempts = (raw: string | null): AttemptRecord | null => {
	if (raw === null) return null
	try {
		const value: unknown = JSON.parse(raw)
		if (
			typeof value === "object" &&
			value !== null &&
			"count" in value &&
			typeof value.count === "number" &&
			Number.isInteger(value.count) &&
			value.count >= 0 &&
			"lastAt" in value &&
			typeof value.lastAt === "number"
		) {
			return { count: value.count, lastAt: value.lastAt }
		}
	} catch {
		// A damaged counter must not unlock anything: treat it as "many attempts" below.
	}
	return { count: DELAYS_MS.length, lastAt: Number.MAX_SAFE_INTEGER }
}
