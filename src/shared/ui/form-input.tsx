import { TextInput, type TextInputProps } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import { typography, useAppTheme } from "@/shared/theme"

export const FormInput = (props: Omit<TextInputProps, "style">) => {
	const { colors } = useAppTheme()
	styles.useVariants({ disabled: props.editable === false })
	return (
		<TextInput
			placeholderTextColor={colors.textMuted}
			autoCapitalize="none"
			autoCorrect={false}
			// Keys and passwords of the vault must never reach the Google/OEM autofill service (it
			// offers to save them to the Google account). Only the account login opts in explicitly.
			autoComplete="off"
			importantForAutofill="no"
			selectionColor={colors.primary}
			{...props}
			style={styles.input}
		/>
	)
}

const styles = StyleSheet.create(theme => ({
	input: {
		...typography.body,
		borderWidth: 1,
		minHeight: 48,
		paddingVertical: theme.spacing.sm + 2,
		paddingHorizontal: theme.spacing.lg,
		color: theme.colors.text,
		backgroundColor: theme.colors.surface,
		borderColor: theme.colors.inputBorder,
		borderRadius: theme.radius.md,
		variants: { disabled: { true: { opacity: 0.6 }, false: {} } },
	},
}))
