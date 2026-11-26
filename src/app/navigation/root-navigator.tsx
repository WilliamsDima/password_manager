import {
	DarkTheme,
	DefaultTheme,
	NavigationContainer,
	ThemeProvider,
	type Theme as NavigationTheme,
} from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useMemo } from "react"
import { ActivityIndicator, View } from "react-native"
import { useSelector } from "react-redux"

import { selectSessionStatus, useVaultLockState } from "@/entities/session"
import { SettingsPage } from "@/pages/settings"
import { SignInPage } from "@/pages/sign-in"
import { UnlockPage } from "@/pages/unlock"
import { VaultPage } from "@/pages/vault"
import { VaultSetupPage } from "@/pages/vault-setup"
import { strings } from "@/shared/config"
import { useAppTheme, useThemedStyles, type Theme, type ThemedStyleSet } from "@/shared/theme"

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

const createSplashStyles = ({ colors }: Theme) =>
	({
		splash: {
			flex: 1,
			alignItems: "center",
			justifyContent: "center",
			backgroundColor: colors.background,
		},
	}) satisfies ThemedStyleSet

const Stack = createNativeStackNavigator<RootStackParamList>()

/**
 * Root navigation. Screens are chosen by the session status (the documented React Navigation
 * auth flow), so a signed-out user has no route to the vault. The lock gate sits **above** the
 * navigator: while the vault is locked (or not set up yet) the navigator is not mounted at all,
 * so no screen of it can be shown or reached.
 */
export const RootNavigator = () => {
	const appTheme = useAppTheme()
	const styles = useThemedStyles(createSplashStyles)
	const theme = useMemo(() => toNavigationTheme(appTheme), [appTheme])
	const status = useSelector(selectSessionStatus)
	const lock = useVaultLockState()

	const waiting =
		status === "initializing" || (status === "signed-in" && lock.status === "uninitialized")

	if (waiting) {
		return (
			<View style={styles.splash}>
				<ActivityIndicator
					color={appTheme.colors.primary}
					accessibilityLabel={strings.common.loading}
				/>
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
						<Stack.Screen
							name="Vault"
							component={VaultPage}
							options={{ title: strings.vault.title }}
						/>
						<Stack.Screen
							name="Settings"
							component={SettingsPage}
							options={{ title: strings.settings.title }}
						/>
					</>
				) : (
					<Stack.Screen name="SignIn" component={SignInPage} options={{ headerShown: false }} />
				)}
			</Stack.Navigator>
		</NavigationContainer>
	)
}
