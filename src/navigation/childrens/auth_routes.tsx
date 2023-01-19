import React, { useEffect, useState } from "react"
import { createStackNavigator } from "@react-navigation/stack"
import { RoutesNames } from "../routes-names"
import { screenOptions, stackOptions } from "../routes-config"
import Auth from "../../screens/Auth"
import Pin from "../../screens/Pin"
import Start from "../../screens/Start"
import { getLocal } from "../../api/asyncStorage"
import { START } from "../../services/constants"
import Register from "../../screens/Register"
import KeyGen from "../../screens/KeyGen"
import Recovery from "../../screens/Recovery"
import Camera from "../../screens/Camera"

const AuthStack = createStackNavigator()

const AuthRoutes = () => {
	const [start, setStart] = useState<string | null>(null)

	const getLocalHandler = async () => {
		const resStart = await getLocal(START)

		if (!start && resStart) {
			setStart(resStart)
		}
	}

	useEffect(() => {
		// console.log("start", start)

		getLocalHandler()
	}, [])

	return (
		<AuthStack.Navigator
			screenOptions={{
				...screenOptions,
				headerShown: false,
			}}
		>
			{!start && (
				<>
					<AuthStack.Screen
						name={RoutesNames.Start}
						options={stackOptions}
						component={Start}
					/>
					<AuthStack.Screen
						name={RoutesNames.Pin}
						options={stackOptions}
						component={Pin}
					/>
				</>
			)}

			<AuthStack.Screen
				options={stackOptions}
				name={RoutesNames.Auth.AuthStack}
				component={Auth}
			/>
			<AuthStack.Screen
				options={stackOptions}
				name={RoutesNames.Auth.Register}
				component={Register}
			/>
			<AuthStack.Screen
				options={stackOptions}
				name={RoutesNames.Auth.Recovery}
				component={Recovery}
			/>
			<AuthStack.Screen
				options={stackOptions}
				name={RoutesNames.KeyGen}
				component={KeyGen}
			/>
		</AuthStack.Navigator>
	)
}

export default AuthRoutes
