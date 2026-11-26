import { useCallback, useMemo, useState } from "react"

import { AppText, ErrorText, FormInput, LinkButton, PrimaryButton, ScrollScreen } from "@/shared/ui"

/**
 * One screen that asks for a key as text: the old v1 key, the recovery key to enter, or the
 * recovery key typed back to confirm it was saved. The text never leaves this component except
 * through `onSubmit`, and is cleared right after.
 */
export const KeyInputStep = ({
	title,
	hint,
	notice,
	placeholder,
	submitLabel,
	secure,
	busy,
	error,
	secondaryLabel,
	onSubmit,
	onSecondary,
}: {
	readonly title: string
	readonly hint: string
	readonly notice?: string | null
	readonly placeholder: string
	readonly submitLabel: string
	/** Hide the typed text (the old v1 key is a short secret phrase). */
	readonly secure: boolean
	readonly busy: boolean
	readonly error: string | null
	readonly secondaryLabel: string
	readonly onSubmit: (text: string) => void
	readonly onSecondary: () => void
}) => {
	const [text, setText] = useState("")
	const view = useMemo(
		() => ({
			canSubmit: text.trim().length > 0,
			multiline: !secure,
			autoCapitalize: secure ? ("none" as const) : ("characters" as const),
		}),
		[text, secure],
	)

	const onPress = useCallback(() => {
		onSubmit(text)
		setText("")
	}, [onSubmit, text])

	return (
		<ScrollScreen>
			<AppText variant="title">{title}</AppText>
			{notice === undefined || notice === null ? <></> : <AppText tone="danger">{notice}</AppText>}
			<AppText>{hint}</AppText>
			<FormInput
				placeholder={placeholder}
				value={text}
				onChangeText={setText}
				secureTextEntry={secure}
				multiline={view.multiline}
				autoCapitalize={view.autoCapitalize}
				editable={!busy}
			/>
			<ErrorText message={error} />
			<PrimaryButton
				label={submitLabel}
				onPress={onPress}
				disabled={!view.canSubmit}
				loading={busy}
			/>
			<LinkButton label={secondaryLabel} onPress={onSecondary} disabled={busy} />
		</ScrollScreen>
	)
}
