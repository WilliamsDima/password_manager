import { useMemo } from "react"
import { StyleSheet, Text, type TextProps } from "react-native"

import { typography, useThemedStyles, type TextVariant, type Theme } from "@/shared/theme"

export type TextTone = "default" | "muted" | "primary" | "danger" | "success"

const variantStyles = StyleSheet.create({
	title: typography.title,
	heading: typography.heading,
	body: typography.body,
	label: typography.label,
	caption: typography.caption,
} satisfies Record<TextVariant, object>)

const createToneStyles = ({ colors }: Theme) =>
	({
		default: { color: colors.text },
		muted: { color: colors.textMuted },
		primary: { color: colors.primary },
		danger: { color: colors.danger },
		success: { color: colors.success },
	}) satisfies Record<TextTone, object>

export const AppText = ({
	variant = "body",
	tone = "default",
	style,
	...props
}: TextProps & { readonly variant?: TextVariant; readonly tone?: TextTone }) => {
	const tones = useThemedStyles(createToneStyles)
	const textStyle = useMemo(
		() => [variantStyles[variant], tones[tone], style],
		[variant, tones, tone, style],
	)
	return <Text {...props} style={textStyle} />
}
