import { strings } from "@/shared/config"

type AuthErrorCode = Exclude<keyof typeof strings.authErrors, "fallback">

const isAuthErrorCode = (code: string): code is AuthErrorCode =>
	code !== "fallback" && Object.hasOwn(strings.authErrors, code)

/** Russian message for an auth error code; anything unknown gets the generic text. */
export const authErrorMessage = (code: string | undefined): string =>
	code !== undefined && isAuthErrorCode(code)
		? strings.authErrors[code]
		: strings.authErrors.fallback
