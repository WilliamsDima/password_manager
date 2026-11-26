import * as expoHaptics from "expo-haptics"

import { ExpoHaptics } from "./expo-haptics"

jest.mock("expo-haptics", () => ({
	ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
	NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
	impactAsync: jest.fn(() => Promise.resolve()),
	notificationAsync: jest.fn(() => Promise.resolve()),
	selectionAsync: jest.fn(() => Promise.resolve()),
}))

describe("ExpoHaptics", () => {
	it("maps the interface calls to expo-haptics", () => {
		const haptics = new ExpoHaptics()
		haptics.impact("medium")
		haptics.notify("error")
		haptics.selection()
		expect(expoHaptics.impactAsync).toHaveBeenCalledWith("medium")
		expect(expoHaptics.notificationAsync).toHaveBeenCalledWith("error")
		expect(expoHaptics.selectionAsync).toHaveBeenCalledTimes(1)
	})

	it("swallows a failing vibrator", async () => {
		jest.mocked(expoHaptics.selectionAsync).mockRejectedValueOnce(new Error("no vibrator"))
		expect(() => {
			new ExpoHaptics().selection()
		}).not.toThrow()
		await Promise.resolve()
	})
})
