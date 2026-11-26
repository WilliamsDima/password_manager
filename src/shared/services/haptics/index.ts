/** Haptic feedback (docs/ARCHITECTURE.md §5, task 6.1a). Failures are ignored by the implementation. */
export type HapticImpact = "light" | "medium"
export type HapticNotification = "success" | "warning" | "error"

export type IHaptics = {
	readonly impact: (style: HapticImpact) => void
	readonly notify: (type: HapticNotification) => void
	readonly selection: () => void
}
