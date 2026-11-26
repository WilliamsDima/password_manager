import app from "../../app.json"

const blocked: readonly string[] = app.expo.android.blockedPermissions

describe("blocked Android permissions", () => {
	it("keeps DETECT_SCREEN_CAPTURE: expo-screen-capture needs it on Android 14+ at startup", () => {
		// Without it the app crashes on launch ("Permission Denial: registerScreenCaptureObserver
		// requires android.permission.DETECT_SCREEN_CAPTURE"). Found on a phone after build 12.
		expect(blocked).not.toContain("android.permission.DETECT_SCREEN_CAPTURE")
	})

	it("still blocks the permissions the app does not use", () => {
		for (const permission of [
			"android.permission.CAMERA",
			"android.permission.RECORD_AUDIO",
			"android.permission.READ_EXTERNAL_STORAGE",
			"android.permission.WRITE_EXTERNAL_STORAGE",
			"android.permission.READ_MEDIA_IMAGES",
			"android.permission.SYSTEM_ALERT_WINDOW",
		]) {
			expect(blocked).toContain(permission)
		}
	})
})
