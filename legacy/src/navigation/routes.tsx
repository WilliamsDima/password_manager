import React, { useEffect } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { RoutesNames } from "./routes-names"
import AuthRoutes from "./childrens/auth_routes"
import { getEncrypted, getLocal } from "../api/asyncStorage"
import { KEY, LANG, USER, USER_PIN } from "../services/constants"
import { useActions } from "../hooks/useActions"
import { useAppSelector } from "../hooks/hooks"
import { createStackNavigator } from "@react-navigation/stack"
import TabNavigation from "./tab"
import i18n from "../i18n/i18n"

const Stack = createStackNavigator()

const Routes = () => {
	const { pin, user, key, language } = useAppSelector(store => store.main)
	const { setPin, setUser, setKey, changeLanguage } = useActions()

	const changeLang = lang => {
		i18n
			.changeLanguage(lang)
			.then(() => changeLanguage(lang))
			.catch(err => console.log("language error", err))
	}

	const getLocalHandler = async () => {
		const resPin = await getEncrypted(USER_PIN)
		const resKey = await getEncrypted(KEY)
		const resUser = await getLocal(USER)
		const resLang = await getLocal(LANG)

		if (!pin && resPin) {
			setPin(resPin)
		}

		if (resLang) {
			changeLang(resLang)
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
		// console.log("key", key)
		// console.log("locale", locale)

		getLocalHandler()
	}, [user, language])

	return (
		<NavigationContainer>
			{user ? (
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
