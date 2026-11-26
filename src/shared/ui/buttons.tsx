import { useCallback } from "react"
import { ActivityIndicator, Pressable, type PressableStateCallbackType } from "react-native"

import { useAppTheme, useThemedStyles, type Theme, type ThemedStyleSet } from "@/shared/theme"

import { AppText } from "./app-text"

type ButtonProps = {
	readonly label: string
	readonly onPress: () => void
	readonly disabled?: boolean
	readonly loading?: boolean
}

const createStyles = ({ colors, radius, spacing }: Theme) =>
	({
		primary: {
			alignItems: "center",
			justifyContent: "center",
			minHeight: 48,
			backgroundColor: colors.primary,
			borderRadius: radius.md,
			paddingVertical: spacing.md,
		},
		primaryLabel: { color: colors.onPrimary },
		secondary: {
			alignItems: "center",
			justifyContent: "center",
			minHeight: 48,
			borderColor: colors.border,
			borderWidth: 1,
			backgroundColor: colors.surface,
			borderRadius: radius.md,
			paddingVertical: spacing.md,
		},
		link: { paddingVertical: spacing.sm },
		linkLabel: { textAlign: "center" },
		disabled: { opacity: 0.5 },
		pressed: { opacity: 0.8 },
	}) satisfies ThemedStyleSet

/** Pressed / disabled variants of one base style, as a stable callback for `Pressable.style`. */
const usePressableStyle = (base: "primary" | "secondary" | "link", inactive: boolean) => {
	const styles = useThemedStyles(createStyles)
	return useCallback(
		({ pressed }: PressableStateCallbackType) => [
			styles[base],
			inactive && styles.disabled,
			pressed && styles.pressed,
		],
		[styles, base, inactive],
	)
}

export const PrimaryButton = ({
	label,
	onPress,
	disabled = false,
	loading = false,
}: ButtonProps) => {
	const { colors } = useAppTheme()
	const styles = useThemedStyles(createStyles)
	const inactive = disabled || loading
	const pressableStyle = usePressableStyle("primary", inactive)
	return (
		<Pressable
			style={pressableStyle}
			onPress={onPress}
			disabled={inactive}
			accessibilityRole="button"
			accessibilityState={{ disabled: inactive, busy: loading }}
			accessibilityLabel={label}
		>
			{loading ? (
				<ActivityIndicator color={colors.onPrimary} />
			) : (
				<AppText variant="label" style={styles.primaryLabel}>
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
}: ButtonProps) => {
	const { colors } = useAppTheme()
	const inactive = disabled || loading
	const pressableStyle = usePressableStyle("secondary", inactive)
	return (
		<Pressable
			style={pressableStyle}
			onPress={onPress}
			disabled={inactive}
			accessibilityRole="button"
			accessibilityState={{ disabled: inactive, busy: loading }}
			accessibilityLabel={label}
		>
			{loading ? (
				<ActivityIndicator color={colors.primary} />
			) : (
				<AppText variant="label" tone="primary">
					{label}
				</AppText>
			)}
		</Pressable>
	)
}

export const LinkButton = ({ label, onPress, disabled = false }: Omit<ButtonProps, "loading">) => {
	const { spacing } = useAppTheme()
	const styles = useThemedStyles(createStyles)
	const pressableStyle = usePressableStyle("link", disabled)
	return (
		<Pressable
			onPress={onPress}
			disabled={disabled}
			accessibilityRole="button"
			accessibilityState={{ disabled }}
			hitSlop={spacing.sm}
			style={pressableStyle}
		>
			<AppText tone="primary" style={styles.linkLabel}>
				{label}
			</AppText>
		</Pressable>
	)
}
