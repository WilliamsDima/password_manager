import React from "react"
import { RoutesNames } from "./routes-names"
import MainRoutes from "./childrens/main_routes"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import TabBar from "../components/organisms/TabBar"
import SettingsRoutes from "./childrens/settings_routes"
import ProfileRoutes from "./childrens/profile_routes"

const Tab = createBottomTabNavigator()

const TabNavigation = () => {
	return (
		<Tab.Navigator
			tabBar={props => <TabBar {...props} />}
			screenOptions={{
				headerShown: false,
			}}
		>
			<Tab.Screen
				options={{ headerShown: false }}
				name={RoutesNames.Main.index}
				component={MainRoutes}
			/>
			<Tab.Screen
				options={{ headerShown: false }}
				name={RoutesNames.Settings.index}
				component={SettingsRoutes}
			/>
			<Tab.Screen
				options={{ headerShown: false }}
				name={RoutesNames.Profile.index}
				component={ProfileRoutes}
			/>
		</Tab.Navigator>
	)
}

export default TabNavigation
