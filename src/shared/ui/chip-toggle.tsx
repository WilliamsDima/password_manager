import { useCallback, useMemo } from "react"
import { Pressable } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import { useHaptics } from "@/shared/services/haptics"

import { AppText } from "./app-text"

/** A small on/off button for a filter ("only favorites"). */
export const ChipToggle = ({
	label,
	selected,
	onToggle,
}: {
	readonly label: string
	readonly selected: boolean
	readonly onToggle: (selected: boolean) => void
}) => {
	styles.useVariants({ selected })
	const haptics = useHaptics()
	const onPress = useCallback(() => {
		haptics.selection()
		onToggle(!selected)
	}, [haptics, onToggle, selected])
	const state = useMemo(() => ({ checked: selected }), [selected])
	const tone = selected ? "primary" : "muted"
	return (
		<Pressable
			accessibilityRole="switch"
			accessibilityState={state}
			onPress={onPress}
			style={styles.chip}
		>
			<AppText variant="caption" tone={tone}>
				{label}
			</AppText>
		</Pressable>
	)
}

const styles = StyleSheet.create(theme => ({
	chip: {
		alignSelf: "flex-start",
		borderWidth: 1,
		borderRadius: theme.radius.lg,
		paddingVertical: theme.spacing.xs + 2,
		paddingHorizontal: theme.spacing.md,
		variants: {
			selected: {
				true: { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary },
				false: { backgroundColor: "transparent", borderColor: theme.colors.border },
			},
		},
	},
}))
