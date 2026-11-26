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

const styles = StyleSheet.create(theme => ({
	row: {
		flexDirection: "row",
		backgroundColor: theme.colors.surfaceMuted,
		borderRadius: theme.radius.md,
		padding: theme.spacing.xs,
	},
	segment: {
		flex: 1,
		alignItems: "center",
		borderRadius: theme.radius.sm,
		borderWidth: 1,
		paddingVertical: theme.spacing.sm + 2,
		variants: {
			selected: {
				true: { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary },
				false: { backgroundColor: "transparent", borderColor: "transparent" },
			},
		},
	},
}))
