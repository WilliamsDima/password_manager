import { sessionSlice } from "./model/session-slice"

export { useSignInMutation, useSignOutMutation, useSignUpMutation } from "./api/session-api"
export type { Credentials, SessionApiDependencies } from "./api/session-api"
export { authStateChanged, sessionSlice } from "./model/session-slice"
export type { SessionRootState, SessionState, SessionStatus } from "./model/session-slice"

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
