import React, { useEffect } from "react"
import { createStackNavigator } from "@react-navigation/stack"
import { RoutesNames } from "../routes-names"
import Main from "../../screens/Main"
import { screenOptions, stackOptions } from "../routes-config"
import Pin from "../../screens/Pin"
import { useAppSelector } from "../../hooks/hooks"

const MainStack = createStackNavigator()

const MainRoutes = () => {
	const { pin } = useAppSelector(store => store.main)

	useEffect(() => {
		// console.log("main rotes user", user)
	}, [pin])
	return (
		<MainStack.Navigator
			screenOptions={{
				...screenOptions,
				headerShown: false,
				// headerTitle: props => <Header {...props} />,
			}}
		>
			{pin && (
				<MainStack.Screen
					options={{ headerShown: false, ...stackOptions }}
					name={RoutesNames.Pin}
					component={Pin}
				/>
			)}

			<MainStack.Screen name={RoutesNames.Main.HomeStack} component={Main} />
		</MainStack.Navigator>
	)
}

export default MainRoutes
