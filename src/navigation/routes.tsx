import React, { useEffect } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { RoutesNames } from "./routes-names"
import { useAuth } from "../hooks/useAuth"
import AuthRoutes from "./childrens/auth_routes"
import {
	clearEncrypted,
	clearLocal,
	getEncrypted,
	getLocal,
} from "../api/asyncStorage"
import { KEY, USER, USER_PIN } from "../services/constants"
import { useActions } from "../hooks/useActions"
import { useAppSelector } from "../hooks/hooks"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createStackNavigator } from "@react-navigation/stack"
import TabNavigation from "./tab"

const Stack = createStackNavigator()

const Routes = () => {
	const { pin, user, key } = useAppSelector(store => store.main)
	const { user: authUser } = useAuth()
	const { setPin, setUser, setKey } = useActions()

	// clearLocal()
	// clearEncrypted()

	const getLocalHandler = async () => {
		const resPin = await getEncrypted(USER_PIN)
		const resKey = await getEncrypted(KEY)
		const resUser = await getLocal(USER)

		if (!pin && resPin) {
			setPin(resPin)
		}

		if (!key && resKey) {
			setKey(resKey)
		}

		if (!user && resUser) {
			setUser(resUser)
		}
	}

	useEffect(() => {
		// console.log("Routes user", user)
		console.log("key", key)

		getLocalHandler()
	}, [user, pin, authUser, key])

	return (
		<NavigationContainer>
			{(user || authUser) && key ? (
				<TabNavigation />
			) : (
				<Stack.Navigator>
					<Stack.Screen
						options={{
							headerShown: false,
						}}
						name={RoutesNames.Auth.index}
						component={AuthRoutes}
					/>
				</Stack.Navigator>
			)}
		</NavigationContainer>
	)
}

export default Routes
