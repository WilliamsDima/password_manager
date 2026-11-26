import { useCallback, useMemo, useState } from "react"
import { type LayoutChangeEvent, PixelRatio, Pressable, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import { useHaptics } from "@/shared/services/haptics"

import { AppText } from "./app-text"

export type SegmentOption<T extends string> = { readonly value: T; readonly label: string }

const SegmentItem = <T extends string>({
	option,
	value,
	stacked,
	onChange,
}: {
	readonly option: SegmentOption<T>
	readonly value: T
	readonly stacked: boolean
	readonly onChange: (value: T) => void
}) => {
	const selected = option.value === value
	styles.useVariants({ selected, stacked })
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
	const [width, setWidth] = useState(0)
	const onLayout = useCallback((event: LayoutChangeEvent) => {
		setWidth(event.nativeEvent.layout.width)
	}, [])

	// Decided from the real width and font size: when the longest label does not fit one segment,
	// the options are stacked, so a word is never broken (phones differ in width and font scale).
	const stacked = useMemo(() => {
		if (width === 0) return false
		const longest = Math.max(...options.map(option => Array.from(option.label).length))
		const needed =
			longest * LABEL_FONT_SIZE * CHAR_WIDTH_EM * PixelRatio.getFontScale() + SEGMENT_PADDING
		return (width - ROW_PADDING) / options.length < needed
	}, [width, options])

	styles.useVariants({ stacked })
	const items = useMemo(
		() =>
			options.map(option => (
				<SegmentItem
					key={option.value}
					option={option}
					value={value}
					stacked={stacked}
					onChange={onChange}
				/>
			)),
		[options, value, stacked, onChange],
	)
	return (
		<View accessibilityRole="radiogroup" style={styles.row} onLayout={onLayout}>
			{items}
		</View>
	)
}

/** Average width of a semibold Cyrillic letter in em, label size, and the paddings it needs. */
const CHAR_WIDTH_EM = 0.62
const LABEL_FONT_SIZE = 16
const SEGMENT_PADDING = 16
const ROW_PADDING = 8

const styles = StyleSheet.create(theme => ({
	row: {
		backgroundColor: theme.colors.surfaceMuted,
		borderRadius: theme.radius.md,
		padding: theme.spacing.xs,
		variants: {
			stacked: { true: { flexDirection: "column" }, false: { flexDirection: "row" } },
		},
	},
	segment: {
		// Equal widths whatever the label length; a long label wraps instead of touching the edge.
		alignSelf: "stretch",
		alignItems: "center",
		justifyContent: "center",
		minHeight: 44,
		borderRadius: theme.radius.sm,
		borderWidth: 1,
		paddingVertical: theme.spacing.sm,
		paddingHorizontal: theme.spacing.sm,
		variants: {
			stacked: { true: {}, false: { flex: 1, flexBasis: 0 } },
			selected: {
				true: { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary },
				false: { backgroundColor: "transparent", borderColor: "transparent" },
			},
		},
	},
}))
