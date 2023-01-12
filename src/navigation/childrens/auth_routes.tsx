import React, { useEffect, useState } from "react"
import { createStackNavigator } from "@react-navigation/stack"
import { RoutesNames } from "../routes-names"
import { screenOptions } from "../routes-config"
import Auth from "../../screens/Auth"
import Pin from "../../screens/Pin"
import Start from "../../screens/Start"
import { getLocal } from "../../api/asyncStorage"
import { START } from "../../services/constants"

const AuthStack = createStackNavigator()

const AuthRoutes = () => {
	const [start, setStart] = useState<string | null>(null)

	const getStart = async () => {
		const res = await getLocal(START)

		res && setStart(res)
	}

	useEffect(() => {
		!start && getStart()
	}, [])

	return (
		<AuthStack.Navigator
			screenOptions={{
				...screenOptions,
				headerShown: false,
			}}
		>
			{/* {!start && (
				<AuthStack.Screen name={RoutesNames.Start} component={Start} />
			)} */}

			<AuthStack.Screen name={RoutesNames.Start} component={Start} />
			<AuthStack.Screen name={RoutesNames.Pin} component={Pin} />
			<AuthStack.Screen name={RoutesNames.Auth.AuthStack} component={Auth} />
		</AuthStack.Navigator>
	)
}

export default AuthRoutes
