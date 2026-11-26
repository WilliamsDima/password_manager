import { useCallback, useMemo, useState } from "react"

import { useVaultLock, useVaultLockState } from "@/entities/session"
import { LockModeForm, type LockModeSubmit } from "@/features/lock-mode"
import { ThemeSwitcher } from "@/features/switch-theme"
import { BackupSection } from "@/features/vault-backup"
import { strings } from "@/shared/config"
import { AppText, Card, LinkButton, ScrollScreen } from "@/shared/ui"

/** Settings: how the app is protected. A change needs the current password (docs/CRYPTO.md §4). */
export const SettingsPage = () => {
	const lock = useVaultLock()
	const { mode } = useVaultLockState()
	const [editing, setEditing] = useState(false)
	const [changed, setChanged] = useState(false)

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

	const view = useMemo(
		() => ({
			currentMode: `${strings.settings.currentMode}: ${mode === null ? "" : strings.settings.modeNames[mode]}`,
			biometricAvailable: lock.canUseBiometrics(),
			requireCurrentPassword: mode === "password",
		}),
		[mode, lock],
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
		</ScrollScreen>
	)
}
