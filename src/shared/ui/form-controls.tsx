import { useTheme } from "@react-navigation/native"
import {
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	type TextInputProps,
	View,
} from "react-native"

/** Temporary building blocks until the design system (6.1): colors come from the navigation theme. */
export const FormInput = (props: TextInputProps) => {
	const { colors } = useTheme()
	return (
		<TextInput
			placeholderTextColor={colors.border}
			autoCapitalize="none"
			autoCorrect={false}
			{...props}
			style={[styles.input, { color: colors.text, borderColor: colors.border }, props.style]}
		/>
	)
}

export const PrimaryButton = ({
	label,
	onPress,
	disabled = false,
	loading = false,
}: {
	readonly label: string
	readonly onPress: () => void
	readonly disabled?: boolean
	readonly loading?: boolean
}) => {
	const { colors } = useTheme()
	return (
		<Pressable
			style={[
				styles.button,
				{ backgroundColor: colors.primary },
				(disabled || loading) && styles.disabled,
			]}
			onPress={onPress}
			disabled={disabled || loading}
			accessibilityRole="button"
		>
			{loading ? (
				<ActivityIndicator color={colors.card} />
			) : (
				<Text style={[styles.buttonText, { color: colors.card }]}>{label}</Text>
			)}
		</Pressable>
	)
}

export const LinkButton = ({
	label,
	onPress,
	disabled = false,
}: {
	readonly label: string
	readonly onPress: () => void
	readonly disabled?: boolean
}) => {
	const { colors } = useTheme()
	return (
		<Pressable onPress={onPress} disabled={disabled} accessibilityRole="button">
			<Text style={[styles.link, { color: colors.primary }]}>{label}</Text>
		</Pressable>
	)
}

export const ErrorText = ({ message }: { readonly message: string | null }) => {
	const { colors } = useTheme()
	return message === null ? null : (
		<Text style={[styles.error, { color: colors.notification }]} accessibilityRole="alert">
			{message}
		</Text>
	)
}

export const Screen = ({ children }: { readonly children: React.ReactNode }) => {
	const { colors } = useTheme()
	return <View style={[styles.screen, { backgroundColor: colors.background }]}>{children}</View>
}

const styles = StyleSheet.create({
	screen: { flex: 1, justifyContent: "center", padding: 24, gap: 14 },
	input: {
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 14,
		paddingVertical: 12,
		fontSize: 16,
	},
	button: { borderRadius: 8, paddingVertical: 14, alignItems: "center" },
	buttonText: { fontSize: 16, fontWeight: "600" },
	disabled: { opacity: 0.5 },
	link: { fontSize: 15, textAlign: "center" },
	error: { fontSize: 14 },
})
