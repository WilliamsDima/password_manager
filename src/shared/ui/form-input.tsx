import { useMemo } from "react"
import { TextInput, type TextInputProps } from "react-native"

import {
	typography,
	useAppTheme,
	useThemedStyles,
	type Theme,
	type ThemedStyleSet,
} from "@/shared/theme"

const createStyles = ({ colors, radius, spacing }: Theme) =>
	({
		input: {
			...typography.body,
			borderWidth: 1,
			minHeight: 48,
			paddingVertical: spacing.sm + spacing.xs / 2,
			paddingHorizontal: spacing.lg,
			color: colors.text,
			backgroundColor: colors.surface,
			borderColor: colors.inputBorder,
			borderRadius: radius.md,
		},
		disabled: { opacity: 0.6 },
	}) satisfies ThemedStyleSet

export const FormInput = (props: TextInputProps) => {
	const { colors } = useAppTheme()
	const styles = useThemedStyles(createStyles)
	const { editable, style } = props
	const inputStyle = useMemo(
		() => [styles.input, editable === false && styles.disabled, style],
		[styles, editable, style],
	)
	return (
		<TextInput
			placeholderTextColor={colors.textMuted}
			autoCapitalize="none"
			autoCorrect={false}
			selectionColor={colors.primary}
			{...props}
			style={inputStyle}
		/>
	)
}
