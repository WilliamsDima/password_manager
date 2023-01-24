import React from "react"
import { createStackNavigator } from "@react-navigation/stack"
import { RoutesNames } from "../routes-names"
import { screenOptions } from "../routes-config"
import Header from "../../components/organisms/Header"
import Settings from "../../screens/Settings"

const SettingsStack = createStackNavigator()

const SettingsRoutes = () => {
	return (
		<SettingsStack.Navigator
			screenOptions={{
				...screenOptions,
				headerShown: false,
			}}
		>
			<SettingsStack.Screen
				name={RoutesNames.Settings.SettingsStack}
				component={Settings}
			/>
		</SettingsStack.Navigator>
	)
}

export default SettingsRoutes
