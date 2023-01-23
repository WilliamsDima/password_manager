import React from "react"
import { createStackNavigator } from "@react-navigation/stack"
import { RoutesNames } from "../routes-names"
import { screenOptions, stackOptions } from "../routes-config"
import Header from "../../components/organisms/Header"
import Profile from "../../screens/Profile"
import KeyGen from "../../screens/KeyGen"

const ProfileStack = createStackNavigator()

const ProfileRoutes = () => {
	return (
		<ProfileStack.Navigator
			screenOptions={{
				...screenOptions,
				headerShown: false,
				headerTitle: props => <Header {...props} />,
			}}
		>
			<ProfileStack.Screen
				name={RoutesNames.Profile.ProfilStack}
				component={Profile}
			/>
			<ProfileStack.Screen
				options={stackOptions}
				name={RoutesNames.KeyGen}
				component={KeyGen}
			/>
		</ProfileStack.Navigator>
	)
}

export default ProfileRoutes
