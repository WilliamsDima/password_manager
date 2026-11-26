import { sessionSlice } from "./model/session-slice"

export { useSignInMutation, useSignOutMutation, useSignUpMutation } from "./api/session-api"
export type { Credentials, SessionApiDependencies } from "./api/session-api"
export { authStateChanged, sessionSlice } from "./model/session-slice"
export type { SessionRootState, SessionState, SessionStatus } from "./model/session-slice"

export { LockoutError } from "./lib/lockout"
export { VaultLockService } from "./model/vault-lock-service"
export {
	DEFAULT_LOCK_TIMINGS,
	MIN_PASSWORD_LENGTH,
	type EnrollOptions,
	type LockMode,
	type ModeConfirmation,
	type VaultLockState,
	type VaultLockStatus,
} from "./model/vault-lock-types"
export { VaultRecoveryService } from "./model/vault-recovery-service"
export {
	SessionServicesProvider,
	useVaultLock,
	useVaultLockState,
	useVaultRecovery,
} from "./ui/session-services"
export {
	formatRecoveryKey,
	formatRecoveryKeyQr,
	localPasswordAad,
	parseRecoveryKey,
	VaultKeyService,
} from "./lib/vault-keys"
export type {
	IVaultKeyService,
	RecoveryKeyParseFailure,
	RecoveryKeyParseResult,
} from "./lib/vault-keys"

export const { selectSessionStatus, selectSessionUser } = sessionSlice.selectors
