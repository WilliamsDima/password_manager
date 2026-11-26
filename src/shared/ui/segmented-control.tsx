import { useCallback, useMemo } from "react"
import { Pressable, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import { useHaptics } from "@/shared/services/haptics"

import { AppText } from "./app-text"

export type SegmentOption<T extends string> = { readonly value: T; readonly label: string }

const SegmentItem = <T extends string>({
	option,
	value,
	onChange,
}: {
	readonly option: SegmentOption<T>
	readonly value: T
	readonly onChange: (value: T) => void
}) => {
	const selected = option.value === value
	styles.useVariants({ selected })
	const haptics = useHaptics()
	const onPress = useCallback(() => {
		if (!selected) haptics.selection()
		onChange(option.value)
	}, [haptics, onChange, option.value, selected])
	const view = useMemo(
		() => ({
			state: { checked: selected },
			tone: selected ? ("primary" as const) : ("muted" as const),
		}),
		[selected],
	)
	return (
		<Pressable
			accessibilityRole="radio"
			accessibilityState={view.state}
			onPress={onPress}
			style={styles.segment}
		>
			<AppText variant="label" tone={view.tone} align="center">
				{option.label}
			</AppText>
		</Pressable>
	)
}

/** Single choice from a few options (theme switcher). */
export const SegmentedControl = <T extends string>({
	options,
	value,
	onChange,
}: {
	readonly options: readonly SegmentOption<T>[]
	readonly value: T
	readonly onChange: (value: T) => void
}) => {
	const items = useMemo(
		() =>
			options.map(option => (
				<SegmentItem key={option.value} option={option} value={value} onChange={onChange} />
			)),
		[options, value, onChange],
	)
	return (
		<View accessibilityRole="radiogroup" style={styles.row}>
			{items}
		</View>
	)
}

/** From this font scale on the options are stacked: three labels no longer fit in one row. */
const STACK_FROM_FONT_SCALE = 1.25

const styles = StyleSheet.create((theme, rt) => ({
	row: {
		flexDirection: rt.fontScale >= STACK_FROM_FONT_SCALE ? "column" : "row",
		backgroundColor: theme.colors.surfaceMuted,
		borderRadius: theme.radius.md,
		padding: theme.spacing.xs,
	},
	segment: {
		// Equal widths whatever the label length; a long label wraps instead of touching the edge.
		flex: rt.fontScale >= STACK_FROM_FONT_SCALE ? undefined : 1,
		flexBasis: rt.fontScale >= STACK_FROM_FONT_SCALE ? undefined : 0,
		alignSelf: "stretch",
		alignItems: "center",
		justifyContent: "center",
		minHeight: 44,
		borderRadius: theme.radius.sm,
		borderWidth: 1,
		paddingVertical: theme.spacing.sm,
		paddingHorizontal: theme.spacing.sm,
		variants: {
			selected: {
				true: { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary },
				false: { backgroundColor: "transparent", borderColor: "transparent" },
			},
		},
	},
}))
