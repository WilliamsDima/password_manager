import React, { useEffect } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { RoutesNames } from "./routes-names"
import MainRoutes from "./childrens/main_routes"
import { useAuth } from "../hooks/useAuth"
import AuthRoutes from "./childrens/auth_routes"
import {
	clearEncrypted,
	clearLocal,
	getEncrypted,
	getLocal,
} from "../api/asyncStorage"
import { USER, USER_PIN } from "../services/constants"
import { useActions } from "../hooks/useActions"
import { useAppSelector } from "../hooks/hooks"

const Stack = createStackNavigator()

const Routes = () => {
	const { pin, user } = useAppSelector(store => store.main)
	const { user: authUser } = useAuth()
	const { setPin, setUser } = useActions()

	// clearLocal()
	// clearEncrypted()

	const getLocalHandler = async () => {
		const resPin = await getEncrypted(USER_PIN)
		const resUser = await getLocal(USER)

		if (!pin && resPin) {
			setPin(resPin)
		}

		if (!user && resUser) {
			setUser(resUser)
		}
	}

	useEffect(() => {
		console.log("Routes user", user)
		console.log("pin", pin)

		getLocalHandler()
	}, [user, pin, authUser])

	return (
		<NavigationContainer>
			{user || authUser ? (
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
