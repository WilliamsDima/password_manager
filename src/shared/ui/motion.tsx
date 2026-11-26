import { useCallback, useMemo } from "react"
import Animated, {
	FadeIn,
	FadeInDown,
	FadeOut,
	LinearTransition,
	type AnimatedStyle,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated"
import type { ViewProps, ViewStyle } from "react-native"
import { StyleSheet } from "react-native-unistyles"

/** Shared timings: every screen and list animates the same way. */
export const SCREEN_ENTERING = FadeIn.duration(180)
export const CARD_LAYOUT = LinearTransition.duration(180)
const ITEM_ENTERING = FadeInDown.duration(200)
const ITEM_EXITING = FadeOut.duration(150)

const SHAKE_DISTANCE = 10
const SHAKE_STEP_MS = 60

/** Horizontal shake for a wrong password / key: call `shake()`, put `style` on a `ShakeView`. */
export const useShake = (): {
	readonly style: AnimatedStyle<ViewStyle>
	readonly shake: () => void
} => {
	const offset = useSharedValue(0)
	const style = useAnimatedStyle(() => ({ transform: [{ translateX: offset.get() }] }))
	const shake = useCallback(() => {
		offset.set(
			withSequence(
				withTiming(-SHAKE_DISTANCE, { duration: SHAKE_STEP_MS / 2 }),
				withRepeat(withTiming(SHAKE_DISTANCE, { duration: SHAKE_STEP_MS }), 5, true),
				withTiming(0, { duration: SHAKE_STEP_MS / 2 }),
			),
		)
	}, [offset])
	// One stable object, so callers can list it in hook dependencies.
	return useMemo(() => ({ style, shake }), [style, shake])
}

/** Wraps a group of fields (spaced like a screen) so they can shake together. */
export const ShakeView = ({
	style,
	children,
}: {
	readonly style: AnimatedStyle<ViewStyle>
	readonly children: React.ReactNode
}) => {
	const groupStyle = useMemo(() => [styles.group, style], [style])
	return <Animated.View style={groupStyle}>{children}</Animated.View>
}

/**
 * A row of a list: fades in from below, fades out on removal and slides when neighbors change
 * (used by the entry list in 6.2).
 */
export const AnimatedListItem = (props: ViewProps) => (
	<Animated.View {...props} entering={ITEM_ENTERING} exiting={ITEM_EXITING} layout={CARD_LAYOUT} />
)

const styles = StyleSheet.create(theme => ({ group: { gap: theme.spacing.lg } }))
