import React, { useEffect } from "react"
import { NavigationContainer } from "@react-navigation/native"
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
import { KEY, USER, USER_PIN } from "../services/constants"
import { useActions } from "../hooks/useActions"
import { useAppSelector } from "../hooks/hooks"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import TabBar from "../components/organisms/TabBar"
import SettingsRoutes from "./childrens/settings_routes"
import ProfileRoutes from "./childrens/profile_routes"

const Tab = createBottomTabNavigator()

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
			<Tab.Navigator
				screenOptions={{ headerShown: false }}
				tabBar={props => (user || authUser) && key && <TabBar {...props} />}
			>
				{(user || authUser) && key ? (
					<>
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
					</>
				) : (
					<Tab.Screen
						options={{
							headerShown: false,
						}}
						name={RoutesNames.Auth.index}
						component={AuthRoutes}
					/>
				)}
			</Tab.Navigator>
		</NavigationContainer>
	)
}

export default Routes
