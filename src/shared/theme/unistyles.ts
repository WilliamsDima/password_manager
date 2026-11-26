import { StyleSheet } from "react-native-unistyles"

import { themes } from "./tokens"

type AppThemes = typeof themes

declare module "react-native-unistyles" {
	// Module augmentation must be an interface: it tells Unistyles the shape of our themes.
	// eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-empty-object-type
	export interface UnistylesThemes extends AppThemes {}
}

/**
 * Registers the themes. Imported first in `index.ts`: it must run before any
 * `StyleSheet.create(theme => ...)` of the app. Starts in `system` mode (adaptive themes);
 * the saved choice is applied by `AppThemeProvider` once it is read.
 */
StyleSheet.configure({ themes, settings: { adaptiveThemes: true } })
