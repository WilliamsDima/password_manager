import {
	DarkTheme,
	DefaultTheme,
	NavigationContainer,
	ThemeProvider,
	type Theme as NavigationTheme,
} from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { ActivityIndicator, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"
import { useSelector } from "react-redux"

import { selectSessionStatus, useVaultLockState } from "@/entities/session"
import { EntryDetailsPage } from "@/pages/entry-details"
import { EntryEditPage } from "@/pages/entry-edit"
import { SettingsPage } from "@/pages/settings"
import { SignInPage } from "@/pages/sign-in"
import { UnlockPage } from "@/pages/unlock"
import { VaultPage } from "@/pages/vault"
import { VaultSetupPage } from "@/pages/vault-setup"
import { strings } from "@/shared/config"
import { themes, useAppTheme, useColorScheme, type Theme } from "@/shared/theme"

import type { RootStackParamList } from "./types"

/** Navigation chrome (headers, transitions) takes its colors from our tokens, keeping its fonts. */
const toNavigationTheme = ({ scheme, colors }: Theme): NavigationTheme => {
	const base = scheme === "dark" ? DarkTheme : DefaultTheme
	return {
		...base,
		colors: {
			...base.colors,
			primary: colors.primary,
			background: colors.background,
			card: colors.surface,
			text: colors.text,
			border: colors.border,
			notification: colors.danger,
		},
	}
}

const NAVIGATION_THEMES = {
	light: toNavigationTheme(themes.light),
	dark: toNavigationTheme(themes.dark),
}

const VAULT_OPTIONS = { title: strings.vault.title }
const SETTINGS_OPTIONS = { title: strings.settings.title }
const SIGN_IN_OPTIONS = { headerShown: false }
const ENTRY_DETAILS_OPTIONS = { title: strings.entry.detailsTitle }
/** "New entry" without an `entryId`, "Edit entry" with one. */
const entryEditOptions = ({
	route,
}: {
	readonly route: { readonly params: { readonly entryId?: string } }
}) => ({
	title: route.params.entryId === undefined ? strings.entry.newTitle : strings.entry.editTitle,
})

const Stack = createNativeStackNavigator<RootStackParamList>()

/**
 * Root navigation. Screens are chosen by the session status (the documented React Navigation
 * auth flow), so a signed-out user has no route to the vault. The lock gate sits **above** the
 * navigator: while the vault is locked (or not set up yet) the navigator is not mounted at all,
 * so no screen of it can be shown or reached.
 */
export const RootNavigator = () => {
	const { colors } = useAppTheme()
	const scheme = useColorScheme()
	const theme = NAVIGATION_THEMES[scheme]
	const status = useSelector(selectSessionStatus)
	const lock = useVaultLockState()

	const waiting =
		status === "initializing" || (status === "signed-in" && lock.status === "uninitialized")

	if (waiting) {
		return (
			<View style={styles.splash}>
				<ActivityIndicator color={colors.primary} accessibilityLabel={strings.common.loading} />
			</View>
		)
	}

	if (status === "signed-in" && lock.status !== "unlocked") {
		return (
			<ThemeProvider value={theme}>
				{lock.status === "setup-required" ? <VaultSetupPage /> : <UnlockPage />}
			</ThemeProvider>
		)
	}

	return (
		<NavigationContainer theme={theme}>
			<Stack.Navigator>
				{status === "signed-in" ? (
					<>
						<Stack.Screen name="Vault" component={VaultPage} options={VAULT_OPTIONS} />
						<Stack.Screen name="Settings" component={SettingsPage} options={SETTINGS_OPTIONS} />
						<Stack.Screen
							name="EntryDetails"
							component={EntryDetailsPage}
							options={ENTRY_DETAILS_OPTIONS}
						/>
						<Stack.Screen name="EntryEdit" component={EntryEditPage} options={entryEditOptions} />
					</>
				) : (
					<Stack.Screen name="SignIn" component={SignInPage} options={SIGN_IN_OPTIONS} />
				)}
			</Stack.Navigator>
		</NavigationContainer>
	)
}

const styles = StyleSheet.create(theme => ({
	splash: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.background,
	},
}))
