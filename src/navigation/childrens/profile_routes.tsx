import React from "react"
import { createStackNavigator } from "@react-navigation/stack"
import { RoutesNames } from "../routes-names"
import { screenOptions, stackOptions } from "../routes-config"
import Profile from "../../screens/Profile"
import RecoveryPassword from "../../screens/RecoveryPassword"

const ProfileStack = createStackNavigator()

const ProfileRoutes = () => {
	return (
		<ProfileStack.Navigator
			screenOptions={{
				...screenOptions,
				headerShown: false,
			}}
		>
			<ProfileStack.Screen
				options={{ headerShown: false, ...stackOptions }}
				name={RoutesNames.Profile.ProfilStack}
				component={Profile}
			/>
			<ProfileStack.Screen
				options={{ headerShown: false, ...stackOptions }}
				name={RoutesNames.Profile.RecoveryPassword}
				component={RecoveryPassword}
			/>
		</ProfileStack.Navigator>
	)
}

export default ProfileRoutes
