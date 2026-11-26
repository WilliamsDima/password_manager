import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { ActivityIndicator, StyleSheet, useColorScheme, View } from "react-native"
import { useSelector } from "react-redux"

import { selectSessionStatus } from "@/entities/session"
import { SignInPage } from "@/pages/sign-in"
import { VaultPage } from "@/pages/vault"
import { strings } from "@/shared/config"

import type { RootStackParamList } from "./types"

const Stack = createNativeStackNavigator<RootStackParamList>()

/**
 * Root navigation. Screens are chosen by the session status (the documented React Navigation
 * auth flow), so a signed-out user has no route to the vault. The lock screen (5.3) will sit
 * above this navigator.
 */
export const RootNavigator = () => {
	const colorScheme = useColorScheme()
	const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme
	const status = useSelector(selectSessionStatus)

	if (status === "initializing") {
		return (
			<View style={[styles.splash, { backgroundColor: theme.colors.background }]}>
				<ActivityIndicator
					color={theme.colors.primary}
					accessibilityLabel={strings.common.loading}
				/>
			</View>
		)
	}

	return (
		<NavigationContainer theme={theme}>
			<Stack.Navigator>
				{status === "signed-in" ? (
					<Stack.Screen
						name="Vault"
						component={VaultPage}
						options={{ title: strings.vault.title }}
					/>
				) : (
					<Stack.Screen name="SignIn" component={SignInPage} options={{ headerShown: false }} />
				)}
			</Stack.Navigator>
		</NavigationContainer>
	)
}

const styles = StyleSheet.create({
	splash: { flex: 1, alignItems: "center", justifyContent: "center" },
})
