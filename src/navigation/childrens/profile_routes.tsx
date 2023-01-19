import React from "react"
import { createStackNavigator } from "@react-navigation/stack"
import { RoutesNames } from "../routes-names"
import { screenOptions } from "../routes-config"
import Header from "../../components/organisms/Header"
import Profile from "../../screens/Profile"

const ProfileStack = createStackNavigator()

const ProfileRoutes = () => {
	return (
		<ProfileStack.Navigator
			screenOptions={{
				...screenOptions,
				headerTitle: props => <Header {...props} />,
			}}
		>
			<ProfileStack.Screen
				name={RoutesNames.Profile.ProfilStack}
				component={Profile}
			/>
		</ProfileStack.Navigator>
	)
}

export default ProfileRoutes
