import type { ColorScheme } from "./tokens"

/** What the user picked; `system` follows the phone setting. */
export type ThemeMode = "light" | "dark" | "system"

export const THEME_MODES: readonly ThemeMode[] = ["system", "light", "dark"]

/** Parses a stored value; anything unknown (or missing) means `system`. */
export const parseThemeMode = (value: string | null): ThemeMode =>
	value === "light" || value === "dark" || value === "system" ? value : "system"

/** `system` falls back to light when the phone reports no preference. */
export const resolveColorScheme = (
	mode: ThemeMode,
	system: ColorScheme | null | undefined,
): ColorScheme => (mode === "system" ? (system === "dark" ? "dark" : "light") : mode)
