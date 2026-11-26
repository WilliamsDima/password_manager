import { Text, type TextProps } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import { typography, type TextVariant } from "@/shared/theme"

export type TextTone = "text" | "muted" | "primary" | "danger" | "success" | "onPrimary"
export type TextAlign = "start" | "center"

export const AppText = ({
	variant = "body",
	tone = "text",
	align = "start",
	...props
}: Omit<TextProps, "style"> & {
	readonly variant?: TextVariant
	readonly tone?: TextTone
	readonly align?: TextAlign
}) => {
	styles.useVariants({ variant, tone, align })
	return <Text {...props} style={styles.text} />
}

const styles = StyleSheet.create(theme => ({
	text: {
		variants: {
			variant: {
				title: typography.title,
				heading: typography.heading,
				body: typography.body,
				label: typography.label,
				caption: typography.caption,
			},
			tone: {
				text: { color: theme.colors.text },
				muted: { color: theme.colors.textMuted },
				primary: { color: theme.colors.primary },
				danger: { color: theme.colors.danger },
				success: { color: theme.colors.success },
				onPrimary: { color: theme.colors.onPrimary },
			},
			align: {
				start: {},
				center: { textAlign: "center" },
			},
		},
	},
}))
