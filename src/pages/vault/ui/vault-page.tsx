import { useNavigation } from "@react-navigation/native"
import { useCallback, useMemo } from "react"
import { StyleSheet } from "react-native"
import { useSelector } from "react-redux"

import {
	selectSessionUser,
	useSignOutMutation,
	useVaultLock,
	useVaultLockState,
} from "@/entities/session"
import { strings } from "@/shared/config"
import { authErrorMessage } from "@/shared/lib/auth-error-message"
import { AppText, ErrorText, LinkButton, PrimaryButton, Screen, SecondaryButton } from "@/shared/ui"

// Placeholder: the entry list arrives with the entry entity and the vault screen (6.2).
export const VaultPage = () => {
	const navigation = useNavigation<{ navigate: (route: "Settings") => void }>()
	const user = useSelector(selectSessionUser)
	const lock = useVaultLock()
	const { mode } = useVaultLockState()
	const [signOut, { isLoading, error }] = useSignOutMutation()

	const onOpenSettings = useCallback(() => {
		navigation.navigate("Settings")
	}, [navigation])

	const onSignOut = useCallback(() => {
		void signOut()
	}, [signOut])

	const errorMessage = useMemo(() => (error ? authErrorMessage(error.code) : null), [error])

	return (
		<Screen>
			<AppText tone="muted" style={styles.centered}>
				{user?.email}
			</AppText>
			<AppText style={styles.centered}>{strings.vault.placeholder}</AppText>
			<ErrorText message={errorMessage} />
			{mode === "none" ? (
				<></>
			) : (
				<PrimaryButton label={strings.vault.lockNow} onPress={lock.lock} />
			)}
			<LinkButton label={strings.vault.settings} onPress={onOpenSettings} />
			<SecondaryButton label={strings.vault.signOut} onPress={onSignOut} loading={isLoading} />
		</Screen>
	)
}

const styles = StyleSheet.create({ centered: { textAlign: "center" } })
