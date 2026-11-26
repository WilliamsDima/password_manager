import { useCallback, useMemo, useState } from "react"

import { useSignInMutation, useSignUpMutation } from "@/entities/session"
import { strings } from "@/shared/config"
import { authErrorMessage } from "@/shared/lib/auth-error-message"
import { AppText, ErrorText, FormInput, LinkButton, PrimaryButton, Screen } from "@/shared/ui"

type Mode = "sign-in" | "sign-up"

export const SignInPage = () => {
	const [mode, setMode] = useState<Mode>("sign-in")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [signIn, signInState] = useSignInMutation()
	const [signUp, signUpState] = useSignUpMutation()

	const isRegister = mode === "sign-up"
	const { isLoading, error } = isRegister ? signUpState : signInState
	const canSubmit = !isLoading && email.trim().length > 0 && password.length > 0

	const submit = useCallback(() => {
		const credentials = { email: email.trim(), password }
		void (isRegister ? signUp(credentials) : signIn(credentials))
	}, [email, password, isRegister, signUp, signIn])

	const switchMode = useCallback(() => {
		signInState.reset()
		signUpState.reset()
		setMode(isRegister ? "sign-in" : "sign-up")
	}, [signInState, signUpState, isRegister])

	const view = useMemo(
		() => ({
			title: isRegister ? strings.signIn.registerTitle : strings.signIn.title,
			submitLabel: isRegister ? strings.signIn.registerSubmit : strings.signIn.submit,
			switchLabel: isRegister ? strings.signIn.switchToSignIn : strings.signIn.switchToRegister,
			passwordAutoComplete: isRegister ? ("new-password" as const) : ("current-password" as const),
			onSubmitEditing: canSubmit ? submit : undefined,
			errorMessage: error ? authErrorMessage(error.code) : null,
		}),
		[isRegister, canSubmit, submit, error],
	)

	return (
		<Screen>
			<AppText variant="title">{view.title}</AppText>
			<FormInput
				placeholder={strings.signIn.email}
				value={email}
				onChangeText={setEmail}
				keyboardType="email-address"
				autoComplete="email"
				editable={!isLoading}
			/>
			<FormInput
				placeholder={strings.signIn.password}
				value={password}
				onChangeText={setPassword}
				secureTextEntry
				autoComplete={view.passwordAutoComplete}
				editable={!isLoading}
				onSubmitEditing={view.onSubmitEditing}
			/>
			<ErrorText message={view.errorMessage} />
			<PrimaryButton
				label={view.submitLabel}
				onPress={submit}
				disabled={!canSubmit}
				loading={isLoading}
			/>
			<LinkButton label={view.switchLabel} onPress={switchMode} disabled={isLoading} />
		</Screen>
	)
}
