import { useTheme } from "@react-navigation/native"
import { useState } from "react"
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native"

import { useSignInMutation, useSignUpMutation } from "@/entities/session"
import { strings } from "@/shared/config"
import { authErrorMessage } from "@/shared/lib/auth-error-message"

type Mode = "sign-in" | "sign-up"

// Temporary screen: colors come from the navigation theme until the design system (6.1).
export const SignInPage = () => {
	const { colors } = useTheme()
	const [mode, setMode] = useState<Mode>("sign-in")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [signIn, signInState] = useSignInMutation()
	const [signUp, signUpState] = useSignUpMutation()

	const isRegister = mode === "sign-up"
	const { isLoading, error } = isRegister ? signUpState : signInState
	const canSubmit = !isLoading && email.trim().length > 0 && password.length > 0

	const submit = () => {
		const credentials = { email: email.trim(), password }
		void (isRegister ? signUp(credentials) : signIn(credentials))
	}

	const switchMode = () => {
		signInState.reset()
		signUpState.reset()
		setMode(isRegister ? "sign-in" : "sign-up")
	}

	const inputStyle = [styles.input, { color: colors.text, borderColor: colors.border }]

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<Text style={[styles.title, { color: colors.text }]}>
				{isRegister ? strings.signIn.registerTitle : strings.signIn.title}
			</Text>
			<TextInput
				style={inputStyle}
				placeholder={strings.signIn.email}
				placeholderTextColor={colors.border}
				value={email}
				onChangeText={setEmail}
				keyboardType="email-address"
				autoCapitalize="none"
				autoCorrect={false}
				autoComplete="email"
				editable={!isLoading}
			/>
			<TextInput
				style={inputStyle}
				placeholder={strings.signIn.password}
				placeholderTextColor={colors.border}
				value={password}
				onChangeText={setPassword}
				secureTextEntry
				autoCapitalize="none"
				autoCorrect={false}
				autoComplete={isRegister ? "new-password" : "current-password"}
				editable={!isLoading}
				onSubmitEditing={canSubmit ? submit : undefined}
			/>
			{error ? (
				<Text style={[styles.error, { color: colors.notification }]}>
					{authErrorMessage(error.code)}
				</Text>
			) : null}
			<Pressable
				style={[styles.button, { backgroundColor: colors.primary }, !canSubmit && styles.disabled]}
				onPress={submit}
				disabled={!canSubmit}
				accessibilityRole="button"
			>
				{isLoading ? (
					<ActivityIndicator color={colors.card} />
				) : (
					<Text style={[styles.buttonText, { color: colors.card }]}>
						{isRegister ? strings.signIn.registerSubmit : strings.signIn.submit}
					</Text>
				)}
			</Pressable>
			<Pressable onPress={switchMode} disabled={isLoading} accessibilityRole="button">
				<Text style={[styles.link, { color: colors.primary }]}>
					{isRegister ? strings.signIn.switchToSignIn : strings.signIn.switchToRegister}
				</Text>
			</Pressable>
		</View>
	)
}

const styles = StyleSheet.create({
	container: { flex: 1, justifyContent: "center", padding: 24, gap: 16 },
	title: { fontSize: 28, fontWeight: "600", marginBottom: 8 },
	input: {
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 16,
	},
	error: { fontSize: 14 },
	button: { borderRadius: 8, paddingVertical: 12, alignItems: "center" },
	buttonText: { fontSize: 16, fontWeight: "600" },
	disabled: { opacity: 0.5 },
	link: { textAlign: "center", fontSize: 14 },
})
