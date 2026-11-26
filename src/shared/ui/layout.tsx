import { ScrollView, type ViewProps } from "react-native"
import Animated from "react-native-reanimated"
import { StyleSheet } from "react-native-unistyles"

import { AppText } from "./app-text"
import { CARD_LAYOUT, SCREEN_ENTERING } from "./motion"

/** Full-screen background with the standard padding and gap; content is centered vertically. */
export const Screen = ({ children }: { readonly children: React.ReactNode }) => (
	<Animated.View style={styles.screen} entering={SCREEN_ENTERING}>
		{children}
	</Animated.View>
)

/** Top-aligned screen for a list: background, side padding and a gap, no vertical centering. */
export const Page = ({ children }: { readonly children: React.ReactNode }) => (
	<Animated.View style={styles.page} entering={SCREEN_ENTERING}>
		{children}
	</Animated.View>
)

/** Scrolling screen for long content (settings). */
export const ScrollScreen = ({ children }: { readonly children: React.ReactNode }) => (
	<ScrollView
		style={styles.scroll}
		contentContainerStyle={styles.scrollContent}
		keyboardShouldPersistTaps="handled"
	>
		{children}
	</ScrollView>
)

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

const styles = StyleSheet.create(theme => ({
	screen: {
		flex: 1,
		justifyContent: "center",
		backgroundColor: theme.colors.background,
		padding: theme.spacing.xl,
		gap: theme.spacing.lg,
	},
	page: {
		flex: 1,
		backgroundColor: theme.colors.background,
		paddingHorizontal: theme.spacing.lg,
		paddingTop: theme.spacing.md,
		gap: theme.spacing.md,
	},
	scroll: { backgroundColor: theme.colors.background },
	scrollContent: { padding: theme.spacing.xl, gap: theme.spacing.lg },
	card: {
		backgroundColor: theme.colors.surface,
		borderColor: theme.colors.border,
		borderWidth: 1,
		borderRadius: theme.radius.lg,
		padding: theme.spacing.lg,
		gap: theme.spacing.md,
	},
}))
