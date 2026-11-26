// Expo config plugin: FLAG_SECURE from the first frame in release builds (SECURITY_AUDIT L1).
// The JS side (`preventScreenCaptureAsync` in App.tsx) sets the same flag, but only after the
// first render, and an activity that is recreated (font size, language, display size) is
// unprotected until it runs again. Setting the flag in `MainActivity.onCreate` closes that gap.
// Debug builds are left alone: layouts are checked from screenshots there (CLAUDE.md, Layout rule).
const { withMainActivity } = require("expo/config-plugins")

const MARKER = "// pm-secure-window"

const SNIPPET = `    ${MARKER}
    if (!BuildConfig.DEBUG) {
      window.addFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE)
    }
`

const withSecureWindow = config =>
	withMainActivity(config, mod => {
		const { contents } = mod.modResults
		if (contents.includes(MARKER)) return mod
		const patched = contents.replace(/(super\.onCreate\([^)]*\)\n)/, `$1${SNIPPET}`)
		if (patched === contents) {
			throw new Error("with-secure-window: super.onCreate(...) not found in MainActivity")
		}
		mod.modResults.contents = patched
		return mod
	})

module.exports = withSecureWindow
