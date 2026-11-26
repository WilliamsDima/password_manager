import { useTheme } from "@react-navigation/native"
import { useEffect, useRef, useState } from "react"
import { StyleSheet, Text } from "react-native"
import { useSelector } from "react-redux"

import { LockModeForm } from "@/features/lock-mode"
import {
	selectSessionUser,
	useSignOutMutation,
	useVaultLock,
	useVaultRecovery,
} from "@/entities/session"
import { strings } from "@/shared/config"
import { lockErrorMessage } from "@/shared/lib/lock-error-message"
import { ErrorText, FormInput, LinkButton, PrimaryButton, Screen } from "@/shared/ui"

/**
 * First start on this phone: the recovery key opens the account's DEK (checked against the
 * server), then the user picks how the app is protected. The DEK is held only in this component's
 * closure until `enroll` stores it, and is zeroed afterwards.
 */
export const VaultSetupPage = () => {
	const { colors } = useTheme()
	const user = useSelector(selectSessionUser)
	const lock = useVaultLock()
	const recovery = useVaultRecovery()
	const [signOut] = useSignOutMutation()
	const [keyText, setKeyText] = useState("")
	const [dek, setDek] = useState<Uint8Array | null>(null)
	const dekRef = useRef<Uint8Array | null>(null)

	// The key must not outlive the page if the user leaves before choosing a mode.
	useEffect(
		() => () => {
			dekRef.current?.fill(0)
		},
		[],
	)
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const checkKey = async () => {
		if (user === null) return
		setBusy(true)
		setError(null)
		try {
			const recovered = await recovery.recover(user.uid, keyText)
			dekRef.current = recovered
			setDek(recovered)
			setKeyText("")
		} catch (caught) {
			setError(lockErrorMessage(caught))
		} finally {
			setBusy(false)
		}
	}

	if (dek === null) {
		return (
			<Screen>
				<Text style={[styles.title, { color: colors.text }]}>{strings.setup.title}</Text>
				<Text style={[styles.text, { color: colors.text }]}>{strings.setup.recoveryHint}</Text>
				<FormInput
					placeholder={strings.setup.recoveryPlaceholder}
					value={keyText}
					onChangeText={setKeyText}
					autoCapitalize="characters"
					multiline
					editable={!busy}
				/>
				<ErrorText message={error} />
				<PrimaryButton
					label={strings.setup.recoveryNext}
					onPress={() => void checkKey()}
					disabled={keyText.trim().length === 0}
					loading={busy}
				/>
				<LinkButton label={strings.lock.signOut} onPress={() => void signOut()} />
			</Screen>
		)
	}

	return (
		<Screen>
			<Text style={[styles.title, { color: colors.text }]}>{strings.setup.modeTitle}</Text>
			<LockModeForm
				biometricAvailable={lock.canUseBiometrics()}
				requireCurrentPassword={false}
				submitLabel={strings.setup.save}
				onSubmit={async ({ mode, password }) => {
					await lock.enroll({ dek, mode, ...(password === undefined ? {} : { password }) })
					dek.fill(0)
					setDek(null)
				}}
			/>
		</Screen>
	)
}

const styles = StyleSheet.create({
	title: { fontSize: 24, fontWeight: "700" },
	text: { fontSize: 15 },
})
