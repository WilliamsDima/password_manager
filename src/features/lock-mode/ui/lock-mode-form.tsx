import { useTheme } from "@react-navigation/native"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { MIN_PASSWORD_LENGTH, type LockMode } from "@/entities/session"
import { strings } from "@/shared/config"
import { lockErrorMessage } from "@/shared/lib/lock-error-message"
import { ErrorText, FormInput, PrimaryButton } from "@/shared/ui"

export type LockModeSubmit = {
	readonly mode: LockMode
	readonly password?: string
	/** The current password, when the vault is currently protected by one. */
	readonly currentPassword?: string
}

/**
 * Chooses how the app is protected: password, fingerprint or no check (docs/CRYPTO.md §4).
 * Used on first setup and in settings; with `requireCurrentPassword` it also asks for the
 * current password, because the mode may only change after confirming the current way.
 */
export const LockModeForm = ({
	biometricAvailable,
	requireCurrentPassword,
	submitLabel,
	onSubmit,
}: {
	readonly biometricAvailable: boolean
	readonly requireCurrentPassword: boolean
	readonly submitLabel: string
	readonly onSubmit: (value: LockModeSubmit) => Promise<void>
}) => {
	const { colors } = useTheme()
	const [mode, setMode] = useState<LockMode>("password")
	const [current, setCurrent] = useState("")
	const [password, setPassword] = useState("")
	const [repeat, setRepeat] = useState("")
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const needsPassword = mode === "password"
	const mismatch = needsPassword && repeat.length > 0 && repeat !== password
	const valid =
		(!needsPassword || (password.length >= MIN_PASSWORD_LENGTH && password === repeat)) &&
		(!requireCurrentPassword || current.length > 0)

	const submit = async () => {
		setBusy(true)
		setError(null)
		try {
			await onSubmit({
				mode,
				...(needsPassword ? { password } : {}),
				...(requireCurrentPassword ? { currentPassword: current } : {}),
			})
		} catch (caught) {
			setError(lockErrorMessage(caught))
		} finally {
			setBusy(false)
		}
	}

	const options: readonly {
		readonly value: LockMode
		readonly title: string
		readonly hint?: string
	}[] = [
		{ value: "password", title: strings.setup.modePassword },
		...(biometricAvailable
			? [
					{
						value: "biometric" as const,
						title: strings.setup.modeBiometric,
						hint: strings.setup.modeBiometricHint,
					},
				]
			: []),
		{ value: "none", title: strings.setup.modeNone },
	]

	return (
		<View style={styles.form}>
			{options.map(option => (
				<Pressable
					key={option.value}
					onPress={() => {
						setMode(option.value)
						setError(null)
					}}
					accessibilityRole="radio"
					accessibilityState={{ selected: mode === option.value }}
					style={[
						styles.option,
						{ borderColor: mode === option.value ? colors.primary : colors.border },
					]}
				>
					<Text style={[styles.optionTitle, { color: colors.text }]}>{option.title}</Text>
					{option.hint === undefined ? null : (
						<Text style={[styles.hint, { color: colors.text }]}>{option.hint}</Text>
					)}
				</Pressable>
			))}
			{mode === "none" ? (
				<Text style={[styles.warning, { color: colors.notification }]}>
					{strings.setup.modeNoneWarning}
				</Text>
			) : null}
			{requireCurrentPassword ? (
				<FormInput
					placeholder={strings.setup.currentPassword}
					value={current}
					onChangeText={setCurrent}
					secureTextEntry
					editable={!busy}
				/>
			) : null}
			{needsPassword ? (
				<>
					<FormInput
						placeholder={strings.setup.newPassword}
						value={password}
						onChangeText={setPassword}
						secureTextEntry
						editable={!busy}
					/>
					<FormInput
						placeholder={strings.setup.repeatPassword}
						value={repeat}
						onChangeText={setRepeat}
						secureTextEntry
						editable={!busy}
					/>
				</>
			) : null}
			<ErrorText message={mismatch ? strings.setup.passwordsDiffer : error} />
			<PrimaryButton
				label={submitLabel}
				onPress={() => void submit()}
				disabled={!valid}
				loading={busy}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	form: { gap: 12 },
	option: { borderWidth: 2, borderRadius: 10, padding: 14, gap: 4 },
	optionTitle: { fontSize: 16, fontWeight: "600" },
	hint: { fontSize: 13, opacity: 0.7 },
	warning: { fontSize: 14 },
})
