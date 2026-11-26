import { useCallback, useMemo, useState } from "react"
import { Alert, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import type { Entry, EntryInput } from "@/entities/entry"
import { useVaultLock } from "@/entities/session"
import { strings } from "@/shared/config"
import { AppText, ErrorText, FormInput, LinkButton, PrimaryButton } from "@/shared/ui"

import { PasswordGeneratorPanel } from "./password-generator-panel"
import { StrengthMeter } from "./strength-meter"

/**
 * The entry form for creating and editing. It only collects text: saving belongs to the page.
 * Typing counts as activity for the auto-lock, otherwise a long form with no touches would lock
 * the vault in the middle of the input.
 */
export const EntryForm = ({
	initial,
	busy,
	error,
	onSubmit,
}: {
	readonly initial: Entry | null
	readonly busy: boolean
	readonly error: string | null
	readonly onSubmit: (input: EntryInput) => void
}) => {
	const lock = useVaultLock()
	const [title, setTitle] = useState(initial?.title ?? "")
	const [login, setLogin] = useState(initial?.login ?? "")
	const [password, setPassword] = useState(initial?.password ?? "")
	const [url, setUrl] = useState(initial?.url ?? "")
	const [notes, setNotes] = useState(initial?.notes ?? "")
	const [showPassword, setShowPassword] = useState(false)
	const [generatorOpen, setGeneratorOpen] = useState(false)

	const typed = useCallback(
		(set: (text: string) => void) => (text: string) => {
			lock.noteActivity()
			set(text)
		},
		[lock],
	)
	const onChangeTitle = useMemo(() => typed(setTitle), [typed])
	const onChangeLogin = useMemo(() => typed(setLogin), [typed])
	const onChangePassword = useMemo(() => typed(setPassword), [typed])
	const onChangeUrl = useMemo(() => typed(setUrl), [typed])
	const onChangeNotes = useMemo(() => typed(setNotes), [typed])

	// A generated password goes into the field and is shown, so the user can see what was made.
	const onGenerated = useCallback(
		(generated: string) => {
			lock.noteActivity()
			const use = () => {
				setPassword(generated)
				setShowPassword(true)
			}
			// Replacing a password that is already typed (or saved) must be a conscious choice.
			if (password === "") {
				use()
				return
			}
			Alert.alert(strings.generator.replaceTitle, strings.generator.replaceBody, [
				{ text: strings.entry.cancel, style: "cancel" },
				{ text: strings.generator.replace, style: "destructive", onPress: use },
			])
		},
		[lock, password],
	)

	const onToggleGenerator = useCallback(() => {
		setGeneratorOpen(current => !current)
	}, [])

	const onToggleShow = useCallback(() => {
		setShowPassword(current => !current)
	}, [])

	const view = useMemo(
		() => ({
			canSave: title.trim().length > 0 && !busy,
			toggleLabel: showPassword ? strings.entry.hide : strings.entry.show,
			generatorLabel: generatorOpen ? strings.generator.close : strings.generator.open,
			hidePassword: !showPassword,
			// A shown password is plain text: this keyboard type stops the keyboard learning it.
			passwordKeyboard: showPassword ? ("visible-password" as const) : ("default" as const),
		}),
		[title, busy, showPassword, generatorOpen],
	)

	const onSave = useCallback(() => {
		const cleanUrl = url.trim()
		onSubmit({
			title: title.trim(),
			login: login.trim(),
			password,
			...(cleanUrl === "" ? {} : { url: cleanUrl }),
			// Notes keep their line breaks and indents; only empty notes are dropped.
			...(notes.trim() === "" ? {} : { notes }),
		})
	}, [onSubmit, title, login, password, url, notes])

	return (
		<>
			<View style={styles.field}>
				<AppText variant="caption" tone="muted">
					{strings.entry.fields.title}
				</AppText>
				<FormInput value={title} onChangeText={onChangeTitle} editable={!busy} />
			</View>
			<View style={styles.field}>
				<AppText variant="caption" tone="muted">
					{strings.entry.fields.login}
				</AppText>
				<FormInput value={login} onChangeText={onChangeLogin} editable={!busy} />
			</View>
			<View style={styles.field}>
				<AppText variant="caption" tone="muted">
					{strings.entry.fields.password}
				</AppText>
				<FormInput
					value={password}
					onChangeText={onChangePassword}
					secureTextEntry={view.hidePassword}
					keyboardType={view.passwordKeyboard}
					editable={!busy}
				/>
				<StrengthMeter password={password} />
				<View style={styles.passwordActions}>
					<LinkButton label={view.toggleLabel} onPress={onToggleShow} />
					<LinkButton label={view.generatorLabel} onPress={onToggleGenerator} />
				</View>
				<PasswordGeneratorPanel open={generatorOpen} onGenerated={onGenerated} />
			</View>
			<View style={styles.field}>
				<AppText variant="caption" tone="muted">
					{strings.entry.fields.url}
				</AppText>
				<FormInput value={url} onChangeText={onChangeUrl} keyboardType="url" editable={!busy} />
			</View>
			<View style={styles.field}>
				<AppText variant="caption" tone="muted">
					{strings.entry.fields.notes}
				</AppText>
				<FormInput value={notes} onChangeText={onChangeNotes} multiline editable={!busy} />
			</View>
			<ErrorText message={error} />
			<PrimaryButton
				label={strings.entry.save}
				onPress={onSave}
				disabled={!view.canSave}
				loading={busy}
			/>
		</>
	)
}

const styles = StyleSheet.create(theme => ({
	field: { gap: theme.spacing.xs },
	passwordActions: { flexDirection: "row", justifyContent: "space-between" },
}))
