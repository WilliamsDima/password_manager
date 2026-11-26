/** Design tokens (docs/ARCHITECTURE.md §5): the only place with raw colors, spacing and type sizes. */
export type ColorScheme = "light" | "dark"

export type ThemeColors = {
	readonly background: string
	readonly surface: string
	readonly surfaceMuted: string
	readonly text: string
	readonly textMuted: string
	readonly border: string
	/** Edge of inputs and other controls: at least 3:1 against the background (WCAG 1.4.11). */
	readonly inputBorder: string
	readonly primary: string
	readonly onPrimary: string
	readonly danger: string
	readonly onDanger: string
	readonly success: string
}

export const lightColors: ThemeColors = {
	background: "#F5F6F8",
	surface: "#FFFFFF",
	surfaceMuted: "#ECEEF2",
	text: "#13161B",
	textMuted: "#586170",
	border: "#CDD2DA",
	inputBorder: "#7D8696",
	primary: "#2C57E0",
	onPrimary: "#FFFFFF",
	danger: "#C4261D",
	onDanger: "#FFFFFF",
	success: "#17794A",
}

export const darkColors: ThemeColors = {
	background: "#0D0F12",
	surface: "#171A1F",
	surfaceMuted: "#21252C",
	text: "#ECEFF4",
	textMuted: "#9BA4B3",
	border: "#323843",
	inputBorder: "#6B7587",
	primary: "#86A2FF",
	onPrimary: "#0D0F12",
	danger: "#FF8F86",
	onDanger: "#0D0F12",
	success: "#62D693",
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const
export const radius = { sm: 8, md: 12, lg: 16 } as const

export type TextVariant = "title" | "heading" | "body" | "label" | "caption"

export const typography: Record<
	TextVariant,
	{
		readonly fontSize: number
		readonly lineHeight: number
		readonly fontWeight: "400" | "600" | "700"
	}
> = {
	title: { fontSize: 26, lineHeight: 32, fontWeight: "700" },
	heading: { fontSize: 19, lineHeight: 26, fontWeight: "700" },
	body: { fontSize: 16, lineHeight: 22, fontWeight: "400" },
	label: { fontSize: 16, lineHeight: 22, fontWeight: "600" },
	caption: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
}

export type Theme = {
	readonly scheme: ColorScheme
	readonly colors: ThemeColors
	readonly spacing: typeof spacing
	readonly radius: typeof radius
}

export const createTheme = (scheme: ColorScheme): Theme => ({
	scheme,
	colors: scheme === "dark" ? darkColors : lightColors,
	spacing,
	radius,
})

/** Both themes, registered in Unistyles by `unistyles.ts`. */
export const themes = { light: createTheme("light"), dark: createTheme("dark") } as const
