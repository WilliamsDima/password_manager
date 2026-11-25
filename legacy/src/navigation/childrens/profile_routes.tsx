import React from "react"
import { createStackNavigator } from "@react-navigation/stack"
import { RoutesNames } from "../routes-names"
import { screenOptions, stackOptions } from "../routes-config"
import Profile from "../../screens/Profile"

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
				options={stackOptions}
				name={RoutesNames.Profile.ProfilStack}
				component={Profile}
			/>
		</ProfileStack.Navigator>
	)
}

export default ProfileRoutes
