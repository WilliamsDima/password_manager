import { useCallback, useMemo, useState } from "react"
import { Alert } from "react-native"

import { useSignOutMutation, useVaultLock, useVaultLockState } from "@/entities/session"
import { LockModeForm, type LockModeSubmit } from "@/features/lock-mode"
import { ThemeSwitcher } from "@/features/switch-theme"
import { BackupSection } from "@/features/vault-backup"
import { strings } from "@/shared/config"
import { authErrorMessage } from "@/shared/lib/auth-error-message"
import { AppText, Card, ErrorText, LinkButton, ScrollScreen, SecondaryButton } from "@/shared/ui"

/** Settings: how the app is protected. A change needs the current password (docs/CRYPTO.md §4). */
export const SettingsPage = () => {
	const lock = useVaultLock()
	const { mode } = useVaultLockState()
	const [editing, setEditing] = useState(false)
	const [changed, setChanged] = useState(false)
	const [signOut, { isLoading: signingOut, error: signOutError }] = useSignOutMutation()

	const onSubmitMode = useCallback(
		async ({ mode: target, password, currentPassword }: LockModeSubmit) => {
			await lock.changeMode(
				{ mode: target, ...(password === undefined ? {} : { password }) },
				currentPassword === undefined ? {} : { password: currentPassword },
			)
			setEditing(false)
			setChanged(true)
		},
		[lock],
	)

	const onStartEdit = useCallback(() => {
		setChanged(false)
		setEditing(true)
	}, [])

	const onSignOut = useCallback(() => {
		Alert.alert(strings.settings.signOutTitle, strings.settings.signOutBody, [
			{ text: strings.settings.signOutCancel, style: "cancel" },
			{
				text: strings.settings.signOut,
				style: "destructive",
				onPress: () => void signOut(),
			},
		])
	}, [signOut])

	const view = useMemo(
		() => ({
			currentMode: `${strings.settings.currentMode}: ${mode === null ? "" : strings.settings.modeNames[mode]}`,
			biometricAvailable: lock.canUseBiometrics(),
			requireCurrentPassword: mode === "password",
			signOutError: signOutError ? authErrorMessage(signOutError.code) : null,
		}),
		[mode, lock, signOutError],
	)

	return (
		<ScrollScreen>
			<Card>
				<AppText variant="heading">{strings.settings.appearance}</AppText>
				<ThemeSwitcher />
			</Card>
			<Card>
				<AppText variant="heading">{strings.settings.protection}</AppText>
				<AppText>{view.currentMode}</AppText>
				{changed ? <AppText tone="success">{strings.settings.modeChanged}</AppText> : <></>}
				{editing ? (
					<LockModeForm
						biometricAvailable={view.biometricAvailable}
						requireCurrentPassword={view.requireCurrentPassword}
						submitLabel={strings.setup.save}
						onSubmit={onSubmitMode}
					/>
				) : (
					<LinkButton label={strings.settings.changeMode} onPress={onStartEdit} />
				)}
			</Card>
			<BackupSection />
			<Card>
				<SecondaryButton
					label={strings.settings.signOut}
					onPress={onSignOut}
					loading={signingOut}
				/>
				<ErrorText message={view.signOutError} />
			</Card>
		</ScrollScreen>
	)
}
