import { useTheme } from "@react-navigation/native"
import { useSelector } from "react-redux"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { selectSessionUser, useSignOutMutation } from "@/entities/session"
import { strings } from "@/shared/config"
import { authErrorMessage } from "@/shared/lib/auth-error-message"

// Placeholder: the entry list arrives with the entry entity and the vault screen (6.2).
export const VaultPage = () => {
	const { colors } = useTheme()
	const user = useSelector(selectSessionUser)
	const [signOut, { isLoading, error }] = useSignOutMutation()

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<Text style={[styles.text, { color: colors.text }]}>{user?.email}</Text>
			<Text style={[styles.text, { color: colors.text }]}>{strings.vault.placeholder}</Text>
			{error ? (
				<Text style={[styles.text, { color: colors.notification }]}>
					{authErrorMessage(error.code)}
				</Text>
			) : null}
			<Pressable
				style={[styles.button, { backgroundColor: colors.primary }, isLoading && styles.disabled]}
				onPress={() => void signOut()}
				disabled={isLoading}
				accessibilityRole="button"
			>
				<Text style={[styles.buttonText, { color: colors.card }]}>{strings.vault.signOut}</Text>
			</Pressable>
		</View>
	)
}

const styles = StyleSheet.create({
	container: { flex: 1, justifyContent: "center", padding: 24, gap: 16 },
	text: { fontSize: 16, textAlign: "center" },
	button: { borderRadius: 8, paddingVertical: 12, alignItems: "center" },
	buttonText: { fontSize: 16, fontWeight: "600" },
	disabled: { opacity: 0.5 },
})
