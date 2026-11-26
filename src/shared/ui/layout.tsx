import { useMemo } from "react"
import { ScrollView, type ViewProps } from "react-native"
import Animated from "react-native-reanimated"

import { useThemedStyles, type Theme, type ThemedStyleSet } from "@/shared/theme"

import { AppText } from "./app-text"
import { CARD_LAYOUT, SCREEN_ENTERING } from "./motion"

const createStyles = ({ colors, radius, spacing }: Theme) =>
	({
		screen: {
			flex: 1,
			justifyContent: "center",
			backgroundColor: colors.background,
			padding: spacing.xl,
			gap: spacing.lg,
		},
		scroll: { backgroundColor: colors.background },
		scrollContent: { padding: spacing.xl, gap: spacing.lg },
		card: {
			backgroundColor: colors.surface,
			borderColor: colors.border,
			borderWidth: 1,
			borderRadius: radius.lg,
			padding: spacing.lg,
			gap: spacing.md,
		},
	}) satisfies ThemedStyleSet

/** Full-screen background with the standard padding and gap; content is centered vertically. */
export const Screen = ({ children }: { readonly children: React.ReactNode }) => {
	const styles = useThemedStyles(createStyles)
	return (
		<Animated.View style={styles.screen} entering={SCREEN_ENTERING}>
			{children}
		</Animated.View>
	)
}

/** Scrolling screen for long content (settings). */
export const ScrollScreen = ({ children }: { readonly children: React.ReactNode }) => {
	const styles = useThemedStyles(createStyles)
	return (
		<ScrollView
			style={styles.scroll}
			contentContainerStyle={styles.scrollContent}
			keyboardShouldPersistTaps="handled"
		>
			{children}
		</ScrollView>
	)
}

export const Card = ({ style, ...props }: ViewProps) => {
	const styles = useThemedStyles(createStyles)
	const cardStyle = useMemo(() => [styles.card, style], [styles, style])
	return <Animated.View {...props} style={cardStyle} layout={CARD_LAYOUT} />
}

export const ErrorText = ({ message }: { readonly message: string | null }) =>
	message === null ? (
		<></>
	) : (
		<AppText tone="danger" variant="caption" accessibilityRole="alert">
			{message}
		</AppText>
	)
