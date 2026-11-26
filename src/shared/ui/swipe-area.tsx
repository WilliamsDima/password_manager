import { useMemo } from "react"
import { PanResponder, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

/** A swipe counts when it is at least this long (dp) and clearly more horizontal than vertical. */
const MIN_SWIPE_DISTANCE = 64
const HORIZONTAL_DOMINANCE = 1.8

/**
 * Wraps a screen so that a horizontal swipe can navigate. `onSwipeRight` fires when the finger
 * moves to the right, `onSwipeLeft` when it moves to the left. Mostly vertical moves are left
 * alone, so lists keep scrolling. Buttons stay the main way to navigate: a swipe is a shortcut.
 */
export const SwipeArea = ({
	onSwipeLeft,
	onSwipeRight,
	children,
}: {
	readonly onSwipeLeft?: () => void
	readonly onSwipeRight?: () => void
	readonly children: React.ReactNode
}) => {
	const responder = useMemo(
		() =>
			PanResponder.create({
				onMoveShouldSetPanResponder: (_event, gesture) =>
					Math.abs(gesture.dx) > 16 &&
					Math.abs(gesture.dx) > HORIZONTAL_DOMINANCE * Math.abs(gesture.dy),
				onPanResponderRelease: (_event, gesture) => {
					const distance = Math.abs(gesture.dx)
					if (distance < MIN_SWIPE_DISTANCE) return
					if (distance < HORIZONTAL_DOMINANCE * Math.abs(gesture.dy)) return
					if (gesture.dx > 0) onSwipeRight?.()
					else onSwipeLeft?.()
				},
			}),
		[onSwipeLeft, onSwipeRight],
	)

	return (
		<View style={styles.fill} {...responder.panHandlers}>
			{children}
		</View>
	)
}

const styles = StyleSheet.create({ fill: { flex: 1 } })
