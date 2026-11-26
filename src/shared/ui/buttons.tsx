import { useCallback, useMemo } from "react"
import { ActivityIndicator, Pressable, type PressableStateCallbackType } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import { useHaptics } from "@/shared/services/haptics"
import { useAppTheme } from "@/shared/theme"

import { AppText } from "./app-text"

type ButtonProps = {
	readonly label: string
	/** `danger` for destructive actions (delete). */
	readonly tone?: "primary" | "danger"
	readonly onPress: () => void
	readonly disabled?: boolean
	readonly loading?: boolean
}

/** Light tap feedback before the action, so every button feels the same. */
const useTapFeedback = (onPress: () => void) => {
	const haptics = useHaptics()
	return useCallback(() => {
		haptics.impact("light")
		onPress()
	}, [haptics, onPress])
}

export const PrimaryButton = ({
	label,
	onPress,
	disabled = false,
	loading = false,
}: ButtonProps) => {
	const { colors } = useAppTheme()
	const inactive = disabled || loading
	styles.useVariants({ inactive })
	// Read after `useVariants`: only this scope sees the style with the chosen variants.
	const baseStyle = styles.primary
	const pressableStyle = useCallback(
		({ pressed }: PressableStateCallbackType) => [baseStyle, pressed && styles.pressed],
		[baseStyle],
	)
	const handlePress = useTapFeedback(onPress)
	const state = useMemo(() => ({ disabled: inactive, busy: loading }), [inactive, loading])
	return (
		<Pressable
			style={pressableStyle}
			onPress={handlePress}
			disabled={inactive}
			accessibilityRole="button"
			accessibilityState={state}
			accessibilityLabel={label}
		>
			{loading ? (
				<ActivityIndicator color={colors.onPrimary} />
			) : (
				<AppText variant="label" tone="onPrimary" align="center">
					{label}
				</AppText>
			)}
		</Pressable>
	)
}

/** Outlined button for the second action on a screen. */
export const SecondaryButton = ({
	label,
	onPress,
	disabled = false,
	loading = false,
	tone = "primary",
}: ButtonProps) => {
	const { colors } = useAppTheme()
	const inactive = disabled || loading
	styles.useVariants({ inactive, danger: tone === "danger" })
	const spinnerColor = useMemo(
		() => (tone === "danger" ? colors.danger : colors.primary),
		[tone, colors.danger, colors.primary],
	)
	// Read after `useVariants`: only this scope sees the style with the chosen variants.
	const baseStyle = styles.secondary
	const pressableStyle = useCallback(
		({ pressed }: PressableStateCallbackType) => [baseStyle, pressed && styles.pressed],
		[baseStyle],
	)
	const handlePress = useTapFeedback(onPress)
	const state = useMemo(() => ({ disabled: inactive, busy: loading }), [inactive, loading])
	return (
		<Pressable
			style={pressableStyle}
			onPress={handlePress}
			disabled={inactive}
			accessibilityRole="button"
			accessibilityState={state}
			accessibilityLabel={label}
		>
			{loading ? (
				<ActivityIndicator color={spinnerColor} />
			) : (
				<AppText variant="label" tone={tone} align="center">
					{label}
				</AppText>
			)}
		</Pressable>
	)
}

export const LinkButton = ({ label, onPress, disabled = false }: Omit<ButtonProps, "loading">) => {
	const { spacing } = useAppTheme()
	styles.useVariants({ inactive: disabled })
	// Read after `useVariants`: only this scope sees the style with the chosen variants.
	const baseStyle = styles.link
	const pressableStyle = useCallback(
		({ pressed }: PressableStateCallbackType) => [baseStyle, pressed && styles.pressed],
		[baseStyle],
	)
	const handlePress = useTapFeedback(onPress)
	const state = useMemo(() => ({ disabled }), [disabled])
	return (
		<Pressable
			onPress={handlePress}
			disabled={disabled}
			accessibilityRole="button"
			accessibilityState={state}
			hitSlop={spacing.sm}
			style={pressableStyle}
		>
			<AppText tone="primary" align="center">
				{label}
			</AppText>
		</Pressable>
	)
}

const inactiveVariant = { true: { opacity: 0.5 }, false: {} }

const styles = StyleSheet.create(theme => ({
	primary: {
		alignItems: "center",
		justifyContent: "center",
		minHeight: 48,
		backgroundColor: theme.colors.primary,
		borderRadius: theme.radius.md,
		paddingVertical: theme.spacing.md,
		// A long label wraps inside the button instead of touching its edge.
		paddingHorizontal: theme.spacing.md,
		variants: { inactive: inactiveVariant },
	},
	secondary: {
		alignItems: "center",
		justifyContent: "center",
		minHeight: 48,
		borderColor: theme.colors.border,
		borderWidth: 1,
		backgroundColor: theme.colors.surface,
		borderRadius: theme.radius.md,
		paddingVertical: theme.spacing.md,
		paddingHorizontal: theme.spacing.md,
		variants: {
			inactive: inactiveVariant,
			danger: { true: { borderColor: theme.colors.danger }, false: {} },
		},
	},
	link: {
		paddingVertical: theme.spacing.sm,
		variants: { inactive: inactiveVariant },
	},
	pressed: { opacity: 0.8 },
}))
