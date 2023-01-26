import React from "react"
import { createStackNavigator } from "@react-navigation/stack"
import { RoutesNames } from "../routes-names"
import { screenOptions, stackOptions } from "../routes-config"
import Settings from "../../screens/Settings"
import Pin from "../../screens/Pin"

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
			<SettingsStack.Screen
				name={RoutesNames.Pin}
				options={stackOptions}
				component={Pin}
			/>
		</SettingsStack.Navigator>
	)
}

export default SettingsRoutes
