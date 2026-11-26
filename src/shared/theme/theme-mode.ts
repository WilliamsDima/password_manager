import { UnistylesRuntime } from "react-native-unistyles"

/** What the user picked; `system` follows the phone setting. */
export type ThemeMode = "light" | "dark" | "system"

export const THEME_MODES: readonly ThemeMode[] = ["system", "light", "dark"]

/** Parses a stored value; anything unknown (or missing) means `system`. */
export const parseThemeMode = (value: string | null): ThemeMode =>
	value === "light" || value === "dark" || value === "system" ? value : "system"

/** Switches Unistyles to the mode: `system` = adaptive themes, otherwise a fixed theme. */
export const applyThemeMode = (mode: ThemeMode): void => {
	if (mode === "system") {
		UnistylesRuntime.setAdaptiveThemes(true)
		return
	}
	UnistylesRuntime.setAdaptiveThemes(false)
	UnistylesRuntime.setTheme(mode)
}
