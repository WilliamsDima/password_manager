import { sessionSlice } from "./model/session-slice"

export { useSignInMutation, useSignOutMutation, useSignUpMutation } from "./api/session-api"
export type { Credentials, SessionApiDependencies } from "./api/session-api"
export { authStateChanged, sessionSlice } from "./model/session-slice"
export type { SessionRootState, SessionState, SessionStatus } from "./model/session-slice"

export const { selectSessionStatus, selectSessionUser } = sessionSlice.selectors
