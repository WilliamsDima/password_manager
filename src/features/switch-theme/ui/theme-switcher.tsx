import { strings } from "@/shared/config"
import { THEME_MODES, useThemeMode } from "@/shared/theme"
import { SegmentedControl } from "@/shared/ui"

const OPTIONS = THEME_MODES.map(value => ({ value, label: strings.settings.themeNames[value] }))

/** Light / dark / system switch; the choice is saved by the theme provider. */
export const ThemeSwitcher = () => {
	const { mode, setMode } = useThemeMode()
	return <SegmentedControl options={OPTIONS} value={mode} onChange={setMode} />
}
