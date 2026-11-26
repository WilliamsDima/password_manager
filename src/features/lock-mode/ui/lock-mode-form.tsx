import { useCallback, useMemo, useState } from "react"
import { Pressable, View } from "react-native"

import { MIN_PASSWORD_LENGTH, type LockMode } from "@/entities/session"
import { strings } from "@/shared/config"
import { lockErrorMessage } from "@/shared/lib/lock-error-message"
import { useThemedStyles, type Theme, type ThemedStyleSet } from "@/shared/theme"
import { AppText, ErrorText, FormInput, PrimaryButton } from "@/shared/ui"

const createStyles = ({ colors, radius, spacing }: Theme) =>
	({
		form: { gap: spacing.md },
		option: {
			borderWidth: 2,
			gap: spacing.xs,
			backgroundColor: colors.surface,
			borderRadius: radius.md,
			padding: spacing.lg,
		},
		optionSelected: { borderColor: colors.primary },
		optionIdle: { borderColor: colors.inputBorder },
	}) satisfies ThemedStyleSet

type ModeOptionProps = {
	readonly value: LockMode
	readonly title: string
	readonly hint: string | undefined
	/** The mode currently chosen in the form. */
	readonly current: LockMode
	readonly onSelect: (value: LockMode) => void
}

const ModeOption = ({ value, title, hint, current, onSelect }: ModeOptionProps) => {
	const styles = useThemedStyles(createStyles)
	const selected = current === value
	const onPress = useCallback(() => {
		onSelect(value)
	}, [onSelect, value])
	const view = useMemo(
		() => ({
			state: { checked: selected },
			style: [styles.option, selected ? styles.optionSelected : styles.optionIdle],
		}),
		[selected, styles],
	)
	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="radio"
			accessibilityState={view.state}
			style={view.style}
		>
			<AppText variant="label">{title}</AppText>
			{hint === undefined ? (
				<></>
			) : (
				<AppText variant="caption" tone="muted">
					{hint}
				</AppText>
			)}
		</Pressable>
	)
}

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
	const styles = useThemedStyles(createStyles)
	const [mode, setMode] = useState<LockMode>("password")
	const [current, setCurrent] = useState("")
	const [password, setPassword] = useState("")
	const [repeat, setRepeat] = useState("")
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const needsPassword = mode === "password"
	const view = useMemo(() => {
		const mismatch = needsPassword && repeat.length > 0 && repeat !== password
		return {
			valid:
				(!needsPassword || (password.length >= MIN_PASSWORD_LENGTH && password === repeat)) &&
				(!requireCurrentPassword || current.length > 0),
			errorMessage: mismatch ? strings.setup.passwordsDiffer : error,
			showNoneWarning: mode === "none",
		}
	}, [needsPassword, mode, password, repeat, current, requireCurrentPassword, error])

	const submit = useCallback(async () => {
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
	}, [onSubmit, mode, needsPassword, password, requireCurrentPassword, current])

	const onSubmitPress = useCallback(() => {
		void submit()
	}, [submit])

	const selectMode = useCallback((value: LockMode) => {
		setMode(value)
		setError(null)
	}, [])

	const items = useMemo(() => {
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
		return options.map(option => (
			<ModeOption
				key={option.value}
				value={option.value}
				title={option.title}
				hint={option.hint}
				current={mode}
				onSelect={selectMode}
			/>
		))
	}, [biometricAvailable, mode, selectMode])

	return (
		<View style={styles.form}>
			{items}
			{view.showNoneWarning ? (
				<AppText tone="danger">{strings.setup.modeNoneWarning}</AppText>
			) : (
				<></>
			)}
			{requireCurrentPassword ? (
				<FormInput
					placeholder={strings.setup.currentPassword}
					value={current}
					onChangeText={setCurrent}
					secureTextEntry
					editable={!busy}
				/>
			) : (
				<></>
			)}
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
			) : (
				<></>
			)}
			<ErrorText message={view.errorMessage} />
			<PrimaryButton
				label={submitLabel}
				onPress={onSubmitPress}
				disabled={!view.valid}
				loading={busy}
			/>
		</View>
	)
}
