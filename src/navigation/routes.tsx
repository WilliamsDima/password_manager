import React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { RoutesNames } from "./routes-names"
import MainRoutes from "./childrens/main_routes"
import { useAuth } from "../hooks/useAuth"
import AuthRoutes from "./childrens/auth_routes"

const Stack = createStackNavigator()

const Routes = () => {
	const { user, isLoading } = useAuth()

	console.log("user", user)
	console.log("isLoading", isLoading)

	return (
		<NavigationContainer>
			{user ? (
				<Stack.Navigator screenOptions={{ headerShown: false }}>
					<Stack.Screen name={RoutesNames.Main.index} component={MainRoutes} />
				</Stack.Navigator>
			) : (
				<Stack.Navigator screenOptions={{ headerShown: false }}>
					<Stack.Screen name={RoutesNames.Auth.index} component={AuthRoutes} />
				</Stack.Navigator>
			)}
		</NavigationContainer>
	)
}

export default Routes
