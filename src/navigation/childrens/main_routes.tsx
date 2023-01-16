import React, { useEffect } from "react"
import { createStackNavigator } from "@react-navigation/stack"
import { RoutesNames } from "../routes-names"
import Main from "../../screens/Main"
import { screenOptions, stackOptions } from "../routes-config"
import Header from "../../components/organisms/Header"
import Pin from "../../screens/Pin"
import { useAppSelector } from "../../hooks/hooks"

const MainStack = createStackNavigator()

const MainRoutes = () => {
	const { pin } = useAppSelector(store => store.main)

	useEffect(() => {}, [pin])
	return (
		<MainStack.Navigator
			screenOptions={{
				...screenOptions,
				headerTitle: props => <Header {...props} />,
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
