import { useCallback } from "react"
import { Pressable } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import { useHaptics } from "@/shared/services/haptics"

import { AppText } from "./app-text"

/** A round button floating over a screen's bottom-right corner, clear of the system bars. */
export const FloatingButton = ({
	label,
	glyph,
	onPress,
}: {
	/** What a screen reader says. */
	readonly label: string
	readonly glyph: string
	readonly onPress: () => void
}) => {
	const haptics = useHaptics()
	const handlePress = useCallback(() => {
		haptics.impact("light")
		onPress()
	}, [haptics, onPress])
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			onPress={handlePress}
			style={styles.button}
		>
			<AppText variant="title" tone="onPrimary" align="center">
				{glyph}
			</AppText>
		</Pressable>
	)
}

const SIZE = 60

const styles = StyleSheet.create((theme, rt) => ({
	button: {
		position: "absolute",
		// Far enough from the corner to reach with a thumb without stretching.
		right: rt.insets.right + theme.spacing.xl + theme.spacing.sm,
		bottom: rt.insets.bottom + theme.spacing.xxl + theme.spacing.md,
		width: SIZE,
		height: SIZE,
		borderRadius: SIZE / 2,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.primary,
		elevation: 6,
	},
}))
