import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useUnistyles } from "react-native-unistyles"

import { applyThemeMode, type ThemeMode } from "./theme-mode"
import type { IThemePreferenceStore } from "./theme-store"
import type { ColorScheme, Theme } from "./tokens"

type ThemeModeContextValue = {
	readonly mode: ThemeMode
	readonly setMode: (mode: ThemeMode) => void
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null)

/** Loads the saved mode once, applies it to Unistyles, saves every change. */
export const AppThemeProvider = ({
	store,
	children,
}: {
	readonly store: IThemePreferenceStore
	readonly children: React.ReactNode
}) => {
	const [mode, setModeState] = useState<ThemeMode>("system")
	const touched = useRef(false)

	useEffect(() => {
		const token = { cancelled: false }
		void store.load().then(saved => {
			// A choice made before the load finished wins over the stored one.
			if (token.cancelled || touched.current) return
			applyThemeMode(saved)
			setModeState(saved)
		})
		return () => {
			token.cancelled = true
		}
	}, [store])

	const setMode = useCallback(
		(next: ThemeMode) => {
			touched.current = true
			applyThemeMode(next)
			setModeState(next)
			// Not saving is harmless: the choice only lasts until restart.
			store.save(next).catch(() => undefined)
		},
		[store],
	)

	const value = useMemo(() => ({ mode, setMode }), [mode, setMode])
	return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>
}

export const useThemeMode = (): ThemeModeContextValue => {
	const value = useContext(ThemeModeContext)
	if (value === null) throw new Error("AppThemeProvider is missing")
	return value
}

/** The active theme for props that are not styles (icon colors, ActivityIndicator, navigation). */
export const useAppTheme = (): Theme => useUnistyles().theme

/** `light` or `dark`: what is on screen right now (after resolving `system`). */
export const useColorScheme = (): ColorScheme => useUnistyles().rt.themeName ?? "light"
