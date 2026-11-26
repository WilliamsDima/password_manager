import { useCallback, useMemo } from "react"
import { Pressable, View } from "react-native"

import { useThemedStyles, type Theme, type ThemedStyleSet } from "@/shared/theme"

import { AppText } from "./app-text"

export type SegmentOption<T extends string> = { readonly value: T; readonly label: string }

const createStyles = ({ colors, radius, spacing }: Theme) =>
	({
		row: {
			flexDirection: "row",
			backgroundColor: colors.surfaceMuted,
			borderRadius: radius.md,
			padding: spacing.xs,
		},
		segment: {
			flex: 1,
			alignItems: "center",
			borderRadius: radius.sm,
			borderWidth: 1,
			paddingVertical: spacing.sm + spacing.xs / 2,
		},
		segmentSelected: { backgroundColor: colors.surface, borderColor: colors.primary },
		segmentIdle: { backgroundColor: "transparent", borderColor: "transparent" },
	}) satisfies ThemedStyleSet

const SegmentItem = <T extends string>({
	option,
	value,
	onChange,
}: {
	readonly option: SegmentOption<T>
	readonly value: T
	readonly onChange: (value: T) => void
}) => {
	const styles = useThemedStyles(createStyles)
	const selected = option.value === value
	const onPress = useCallback(() => {
		onChange(option.value)
	}, [onChange, option.value])
	const view = useMemo(
		() => ({
			state: { checked: selected },
			style: [styles.segment, selected ? styles.segmentSelected : styles.segmentIdle],
			tone: selected ? ("primary" as const) : ("muted" as const),
		}),
		[selected, styles],
	)
	return (
		<Pressable
			accessibilityRole="radio"
			accessibilityState={view.state}
			onPress={onPress}
			style={view.style}
		>
			<AppText variant="label" tone={view.tone}>
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
	const styles = useThemedStyles(createStyles)
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
