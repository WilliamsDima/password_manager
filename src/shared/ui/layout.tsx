import { ScrollView, View, type ViewProps } from "react-native"
import Animated from "react-native-reanimated"
import { StyleSheet } from "react-native-unistyles"

import { AppText } from "./app-text"
import { CARD_LAYOUT, SCREEN_ENTERING } from "./motion"

/**
 * Layout rules for every screen (the app draws edge to edge): content stays out of the status bar,
 * the cut-out, the navigation bar and the keyboard (system insets), and on wide screens it is a
 * centered column of at most `MAX_CONTENT_WIDTH`, so the app looks the same on every device.
 * Screens under a navigation header (`Page`, `ScrollScreen underHeader`) skip the top inset: the
 * header already sits below the status bar.
 */

/** Full-screen background with the standard padding and gap; content is centered vertically. */
export const Screen = ({ children }: { readonly children: React.ReactNode }) => (
	<Animated.View style={styles.screen} entering={SCREEN_ENTERING}>
		<View style={styles.centered}>{children}</View>
	</Animated.View>
)

/** Top-aligned screen for a list under a navigation header. */
export const Page = ({ children }: { readonly children: React.ReactNode }) => (
	<Animated.View style={styles.page} entering={SCREEN_ENTERING}>
		<View style={styles.column}>{children}</View>
	</Animated.View>
)

/** Scrolling screen for long content. `underHeader` when a navigation header is above it. */
export const ScrollScreen = ({
	children,
	underHeader = false,
}: {
	readonly children: React.ReactNode
	readonly underHeader?: boolean
}) => {
	styles.useVariants({ underHeader })
	return (
		<ScrollView
			style={styles.scroll}
			contentContainerStyle={styles.scrollContent}
			keyboardShouldPersistTaps="handled"
		>
			<View style={styles.column}>{children}</View>
		</ScrollView>
	)
}

export const Card = (props: Omit<ViewProps, "style">) => (
	<Animated.View {...props} style={styles.card} layout={CARD_LAYOUT} />
)

export const ErrorText = ({ message }: { readonly message: string | null }) =>
	message === null ? (
		<></>
	) : (
		<AppText tone="danger" variant="caption" accessibilityRole="alert">
			{message}
		</AppText>
	)

/** Widest content column: phones fill the width, tablets and the emulator window get a column. */
const MAX_CONTENT_WIDTH = 560

const styles = StyleSheet.create((theme, rt) => {
	const left = rt.insets.left + theme.spacing.xl
	const right = rt.insets.right + theme.spacing.xl
	// The keyboard covers the navigation bar: take the larger of the two, not their sum.
	const bottom = Math.max(rt.insets.bottom, rt.insets.ime)
	return {
		screen: {
			flex: 1,
			alignItems: "center",
			backgroundColor: theme.colors.background,
			paddingTop: rt.insets.top + theme.spacing.xl,
			paddingBottom: bottom + theme.spacing.xl,
			paddingLeft: left,
			paddingRight: right,
		},
		centered: {
			flex: 1,
			width: "100%",
			maxWidth: MAX_CONTENT_WIDTH,
			justifyContent: "center",
			gap: theme.spacing.lg,
		},
		page: {
			flex: 1,
			alignItems: "center",
			backgroundColor: theme.colors.background,
			paddingTop: theme.spacing.md,
			paddingBottom: bottom,
			paddingLeft: rt.insets.left + theme.spacing.lg,
			paddingRight: rt.insets.right + theme.spacing.lg,
		},
		column: {
			flex: 1,
			width: "100%",
			maxWidth: MAX_CONTENT_WIDTH,
			gap: theme.spacing.md,
		},
		scroll: { backgroundColor: theme.colors.background },
		scrollContent: {
			flexGrow: 1,
			alignItems: "center",
			paddingBottom: bottom + theme.spacing.xl,
			paddingLeft: left,
			paddingRight: right,
			variants: {
				underHeader: {
					true: { paddingTop: theme.spacing.xl },
					false: { paddingTop: rt.insets.top + theme.spacing.xl },
				},
			},
		},
		card: {
			backgroundColor: theme.colors.surface,
			borderColor: theme.colors.border,
			borderWidth: 1,
			borderRadius: theme.radius.lg,
			padding: theme.spacing.lg,
			gap: theme.spacing.md,
		},
	}
})
