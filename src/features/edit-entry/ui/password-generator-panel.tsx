import { useCallback, useMemo, useState } from "react"
import { Pressable, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import { strings } from "@/shared/config"
import {
	DEFAULT_PASSWORD_OPTIONS,
	MAX_PASSWORD_LENGTH,
	MIN_PASSWORD_LENGTH,
	type PasswordOptions,
	usePasswordGenerator,
} from "@/shared/services/password-generator"
import { useHaptics } from "@/shared/services/haptics"
import { AppText, ChipToggle, SecondaryButton } from "@/shared/ui"

/** A round-edged 48 dp button for "−" / "+" of the length: big enough for a thumb. */
const StepButton = ({
	glyph,
	label,
	disabled,
	onPress,
}: {
	readonly glyph: string
	readonly label: string
	readonly disabled: boolean
	readonly onPress: () => void
}) => {
	const haptics = useHaptics()
	const handlePress = useCallback(() => {
		haptics.selection()
		onPress()
	}, [haptics, onPress])
	const state = useMemo(() => ({ disabled }), [disabled])
	styles.useVariants({ inactive: disabled })
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={state}
			disabled={disabled}
			onPress={handlePress}
			style={styles.step}
		>
			<AppText variant="heading" tone="primary" align="center">
				{glyph}
			</AppText>
		</Pressable>
	)
}

type ClassKey = "lower" | "upper" | "digits" | "symbols" | "avoidAmbiguous"

/**
 * Collapsible password generator for the entry form. `onGenerated` puts the new password into the
 * form (the form shows it, so the user sees what was made). At least one character class stays on.
 */
export const PasswordGeneratorPanel = ({
	open,
	onGenerated,
}: {
	/** Shown or collapsed: the form owns the toggle link next to "show password". */
	readonly open: boolean
	readonly onGenerated: (password: string) => void
}) => {
	const generator = usePasswordGenerator()
	const [options, setOptions] = useState<PasswordOptions>(DEFAULT_PASSWORD_OPTIONS)

	const toggle = useCallback((key: ClassKey, on: boolean) => {
		setOptions(current => {
			const next = { ...current, [key]: on }
			const anyClass = next.lower || next.upper || next.digits || next.symbols
			return anyClass ? next : current
		})
	}, [])
	const onLower = useCallback(
		(on: boolean) => {
			toggle("lower", on)
		},
		[toggle],
	)
	const onUpper = useCallback(
		(on: boolean) => {
			toggle("upper", on)
		},
		[toggle],
	)
	const onDigits = useCallback(
		(on: boolean) => {
			toggle("digits", on)
		},
		[toggle],
	)
	const onSymbols = useCallback(
		(on: boolean) => {
			toggle("symbols", on)
		},
		[toggle],
	)
	const onAmbiguous = useCallback(
		(on: boolean) => {
			toggle("avoidAmbiguous", on)
		},
		[toggle],
	)

	const onDecrease = useCallback(() => {
		setOptions(current => ({
			...current,
			length: Math.max(current.length - 1, MIN_PASSWORD_LENGTH),
		}))
	}, [])
	const onIncrease = useCallback(() => {
		setOptions(current => ({
			...current,
			length: Math.min(current.length + 1, MAX_PASSWORD_LENGTH),
		}))
	}, [])

	const onGenerate = useCallback(() => {
		onGenerated(generator.generate(options))
	}, [generator, options, onGenerated])

	const view = useMemo(
		() => ({
			lengthText: `${strings.generator.length}: ${String(options.length)}`,
			canDecrease: options.length > MIN_PASSWORD_LENGTH,
			canIncrease: options.length < MAX_PASSWORD_LENGTH,
		}),
		[options.length],
	)

	return (
		<>
			{open ? (
				<View style={styles.panel}>
					<View style={styles.lengthRow}>
						<StepButton
							glyph="−"
							label={strings.generator.decrease}
							disabled={!view.canDecrease}
							onPress={onDecrease}
						/>
						<AppText variant="label" accessibilityLiveRegion="polite">
							{view.lengthText}
						</AppText>
						<StepButton
							glyph="+"
							label={strings.generator.increase}
							disabled={!view.canIncrease}
							onPress={onIncrease}
						/>
					</View>
					<View style={styles.chips}>
						<ChipToggle
							label={strings.generator.lower}
							selected={options.lower}
							onToggle={onLower}
						/>
						<ChipToggle
							label={strings.generator.upper}
							selected={options.upper}
							onToggle={onUpper}
						/>
						<ChipToggle
							label={strings.generator.digits}
							selected={options.digits}
							onToggle={onDigits}
						/>
						<ChipToggle
							label={strings.generator.symbols}
							selected={options.symbols}
							onToggle={onSymbols}
						/>
						<ChipToggle
							label={strings.generator.avoidAmbiguous}
							selected={options.avoidAmbiguous}
							onToggle={onAmbiguous}
						/>
					</View>
					<SecondaryButton label={strings.generator.generate} onPress={onGenerate} />
				</View>
			) : (
				<></>
			)}
		</>
	)
}

const styles = StyleSheet.create(theme => ({
	panel: {
		gap: theme.spacing.md,
		padding: theme.spacing.md,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.surfaceMuted,
	},
	lengthRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
	step: {
		minWidth: 48,
		minHeight: 48,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: theme.radius.md,
		borderWidth: 1,
		borderColor: theme.colors.border,
		variants: { inactive: { true: { opacity: 0.4 }, false: {} } },
	},
	chips: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
}))
