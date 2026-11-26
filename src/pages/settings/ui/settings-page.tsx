import { useTheme } from "@react-navigation/native"
import { useState } from "react"
import { StyleSheet, Text } from "react-native"

import { useVaultLock, useVaultLockState } from "@/entities/session"
import { LockModeForm } from "@/features/lock-mode"
import { strings } from "@/shared/config"
import { LinkButton, Screen } from "@/shared/ui"

/** Settings: how the app is protected. A change needs the current password (docs/CRYPTO.md §4). */
export const SettingsPage = () => {
	const { colors } = useTheme()
	const lock = useVaultLock()
	const { mode } = useVaultLockState()
	const [editing, setEditing] = useState(false)
	const [changed, setChanged] = useState(false)

	return (
		<Screen>
			<Text style={[styles.title, { color: colors.text }]}>{strings.settings.protection}</Text>
			<Text style={[styles.text, { color: colors.text }]}>
				{`${strings.settings.currentMode}: ${mode === null ? "" : strings.settings.modeNames[mode]}`}
			</Text>
			{changed ? (
				<Text style={[styles.text, { color: colors.primary }]}>{strings.settings.modeChanged}</Text>
			) : null}
			{editing ? (
				<LockModeForm
					biometricAvailable={lock.canUseBiometrics()}
					requireCurrentPassword={mode === "password"}
					submitLabel={strings.setup.save}
					onSubmit={async ({ mode: target, password, currentPassword }) => {
						await lock.changeMode(
							{ mode: target, ...(password === undefined ? {} : { password }) },
							currentPassword === undefined ? {} : { password: currentPassword },
						)
						setEditing(false)
						setChanged(true)
					}}
				/>
			) : (
				<LinkButton
					label={strings.settings.changeMode}
					onPress={() => {
						setChanged(false)
						setEditing(true)
					}}
				/>
			)}
		</Screen>
	)
}

const styles = StyleSheet.create({
	title: { fontSize: 22, fontWeight: "700" },
	text: { fontSize: 16 },
})
