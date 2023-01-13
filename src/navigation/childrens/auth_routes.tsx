import React, { useEffect, useState } from "react"
import { createStackNavigator } from "@react-navigation/stack"
import { RoutesNames } from "../routes-names"
import { screenOptions } from "../routes-config"
import Auth from "../../screens/Auth"
import Pin from "../../screens/Pin"
import Start from "../../screens/Start"
import {
	clearEncrypted,
	clearLocal,
	getEncrypted,
	getLocal,
} from "../../api/asyncStorage"
import { START, USER_PIN } from "../../services/constants"
import Register from "../../screens/Register"

const AuthStack = createStackNavigator()

const AuthRoutes = () => {
	const [start, setStart] = useState<string | null>(null)
	const [pin, setPin] = useState<string | null>(null)

	// clearLocal()
	// clearEncrypted()

	const getLocalHandler = async () => {
		const resStart = await getLocal(START)
		const resPin = await getEncrypted(USER_PIN)

		if (!start && resStart) {
			setStart(resStart)
		}

		if (!pin && resPin) {
			setPin(resPin)
		}
	}

	useEffect(() => {
		console.log("start", start)
		console.log("pin", pin)

		getLocalHandler()
	}, [])

	return (
		<AuthStack.Navigator
			screenOptions={{
				...screenOptions,
				headerShown: false,
			}}
		>
			{!start && !pin && (
				<>
					<AuthStack.Screen name={RoutesNames.Start} component={Start} />
					<AuthStack.Screen name={RoutesNames.Pin} component={Pin} />
				</>
			)}

			{pin && <AuthStack.Screen name={RoutesNames.Pin} component={Pin} />}
			<AuthStack.Screen name={RoutesNames.Auth.AuthStack} component={Auth} />
			<AuthStack.Screen name={RoutesNames.Auth.Register} component={Register} />
		</AuthStack.Navigator>
	)
}

export default AuthRoutes
