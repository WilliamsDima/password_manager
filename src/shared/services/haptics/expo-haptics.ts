import {
	ImpactFeedbackStyle,
	impactAsync,
	NotificationFeedbackType,
	notificationAsync,
	selectionAsync,
} from "expo-haptics"

import type { HapticImpact, HapticNotification, IHaptics } from "./haptics"

const IMPACT: Record<HapticImpact, ImpactFeedbackStyle> = {
	light: ImpactFeedbackStyle.Light,
	medium: ImpactFeedbackStyle.Medium,
}

const NOTIFICATION: Record<HapticNotification, NotificationFeedbackType> = {
	success: NotificationFeedbackType.Success,
	warning: NotificationFeedbackType.Warning,
	error: NotificationFeedbackType.Error,
}

/** `IHaptics` on `expo-haptics`. Feedback is a nicety: a device without a vibrator fails silently. */
export class ExpoHaptics implements IHaptics {
	public readonly impact = (style: HapticImpact): void => {
		impactAsync(IMPACT[style]).catch(ignore)
	}

	public readonly notify = (type: HapticNotification): void => {
		notificationAsync(NOTIFICATION[type]).catch(ignore)
	}

	public readonly selection = (): void => {
		selectionAsync().catch(ignore)
	}
}

const ignore = (): void => undefined
