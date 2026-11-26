import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import {
	type ImageStyle,
	StyleSheet,
	type TextStyle,
	useColorScheme,
	type ViewStyle,
} from "react-native"

import { resolveColorScheme, type ThemeMode } from "./theme-mode"
import type { IThemePreferenceStore } from "./theme-store"
import { createTheme, type Theme } from "./tokens"

type ThemeContextValue = {
	readonly theme: Theme
	readonly mode: ThemeMode
	readonly setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/** Loads the saved mode once, follows the system scheme in `system` mode, saves every change. */
export const AppThemeProvider = ({
	store,
	children,
}: {
	readonly store: IThemePreferenceStore
	readonly children: React.ReactNode
}) => {
	const system = useColorScheme()
	const [mode, setModeState] = useState<ThemeMode>("system")
	const touched = useRef(false)

	useEffect(() => {
		const token = { cancelled: false }
		void store.load().then(saved => {
			// A choice made before the load finished wins over the stored one.
			if (!token.cancelled && !touched.current) setModeState(saved)
		})
		return () => {
			token.cancelled = true
		}
	}, [store])

	const setMode = useCallback(
		(next: ThemeMode) => {
			touched.current = true
			setModeState(next)
			// Not saving is harmless: the choice only lasts until restart.
			store.save(next).catch(() => undefined)
		},
		[store],
	)

	const value = useMemo(
		() => ({ theme: createTheme(resolveColorScheme(mode, system)), mode, setMode }),
		[mode, system, setMode],
	)
	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

const useThemeContext = (): ThemeContextValue => {
	const value = useContext(ThemeContext)
	if (value === null) throw new Error("AppThemeProvider is missing")
	return value
}

export const useAppTheme = (): Theme => useThemeContext().theme

export const useThemeMode = (): {
	readonly mode: ThemeMode
	readonly setMode: (m: ThemeMode) => void
} => {
	const { mode, setMode } = useThemeContext()
	return { mode, setMode }
}

/**
 * Styles that depend on the theme: `StyleSheet.create` runs once per theme change inside `useMemo`.
 * `factory` must be a module-level function (a stable reference). Conditional variants (selected,
 * disabled, pressed) are separate named styles in the set, never inline objects in JSX.
 */
/** Shape every themed style factory must satisfy (`satisfies ThemedStyleSet` keeps literal types). */
export type ThemedStyleSet = Record<string, ViewStyle | TextStyle | ImageStyle>

export const useThemedStyles = <T extends ThemedStyleSet>(factory: (theme: Theme) => T): T => {
	const theme = useAppTheme()
	return useMemo(() => StyleSheet.create(factory(theme)), [factory, theme])
}
