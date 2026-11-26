import { useMemo } from "react"
import { View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import { strings } from "@/shared/config"
import { estimatePasswordStrength } from "@/shared/services/password-generator"
import { useAppTheme } from "@/shared/theme"
import { AppText } from "@/shared/ui"

const BARS = [1, 2, 3, 4] as const

/** Four bars and a word for how strong the password in the form is; nothing is stored or sent. */
export const StrengthMeter = ({ password }: { readonly password: string }) => {
	const { colors } = useAppTheme()
	const view = useMemo(() => {
		const { level } = estimatePasswordStrength(password)
		const color = level <= 1 ? colors.danger : level === 2 ? colors.warning : colors.success
		const filled = password === "" ? 0 : Math.max(level, 1)
		return {
			text: `${strings.generator.strength}: ${strings.generator.levels[level]}`,
			bars: BARS.map(bar => ({
				key: bar,
				style: [styles.bar, { backgroundColor: bar <= filled ? color : colors.surfaceMuted }],
			})),
			show: password !== "",
		}
	}, [password, colors])

	const bars = useMemo(
		() => view.bars.map(bar => <View key={bar.key} style={bar.style} />),
		[view.bars],
	)

	if (!view.show) return <></>

	return (
		<View style={styles.wrap} accessible accessibilityLabel={view.text}>
			<View style={styles.row}>{bars}</View>
			<AppText variant="caption" tone="muted">
				{view.text}
			</AppText>
		</View>
	)
}

const styles = StyleSheet.create(theme => ({
	wrap: { gap: theme.spacing.xs },
	row: { flexDirection: "row", gap: theme.spacing.xs },
	bar: { flex: 1, height: 6, borderRadius: 3 },
}))
