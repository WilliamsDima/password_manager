import { strings } from "@/shared/config"
import { isAppError } from "@/shared/lib/errors"

import { lockErrorMessage } from "../lock-error-message"

type BackupErrorKey = Exclude<keyof typeof strings.backupErrors, "fallback">

const isKey = (code: string): code is BackupErrorKey =>
	code !== "fallback" && Object.hasOwn(strings.backupErrors, code)

/** Russian text for backup errors; key and recovery-key problems reuse the lock texts. */
export const backupErrorMessage = (error: unknown): string => {
	if (!isAppError(error)) return strings.backupErrors.fallback
	if (isKey(error.code)) return strings.backupErrors[error.code]
	if (
		error.code === "invalid-recovery-key" ||
		error.code === "invalid-credentials" ||
		error.code === "too-many-requests"
	) {
		return lockErrorMessage(error)
	}
	return strings.backupErrors.fallback
}
