import { useNavigation, useTheme } from "@react-navigation/native"
import { useSelector } from "react-redux"
import { StyleSheet, Text, View } from "react-native"

import {
	selectSessionUser,
	useSignOutMutation,
	useVaultLock,
	useVaultLockState,
} from "@/entities/session"
import { strings } from "@/shared/config"
import { authErrorMessage } from "@/shared/lib/auth-error-message"
import { ErrorText, LinkButton, PrimaryButton } from "@/shared/ui"

// Placeholder: the entry list arrives with the entry entity and the vault screen (6.2).
export const VaultPage = () => {
	const { colors } = useTheme()
	const navigation = useNavigation<{ navigate: (route: "Settings") => void }>()
	const user = useSelector(selectSessionUser)
	const lock = useVaultLock()
	const { mode } = useVaultLockState()
	const [signOut, { isLoading, error }] = useSignOutMutation()

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<Text style={[styles.text, { color: colors.text }]}>{user?.email}</Text>
			<Text style={[styles.text, { color: colors.text }]}>{strings.vault.placeholder}</Text>
			<ErrorText message={error ? authErrorMessage(error.code) : null} />
			{mode === "none" ? null : <PrimaryButton label={strings.vault.lockNow} onPress={lock.lock} />}
			<LinkButton
				label={strings.vault.settings}
				onPress={() => {
					navigation.navigate("Settings")
				}}
			/>
			<PrimaryButton
				label={strings.vault.signOut}
				onPress={() => void signOut()}
				loading={isLoading}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: { flex: 1, justifyContent: "center", padding: 24, gap: 16 },
	text: { fontSize: 16, textAlign: "center" },
})
