import React, { FC } from "react"
import { View, StyleSheet } from "react-native"
import COLORS from "../../../services/colors"
import ButtonTabBar from "../../atoms/ButtonTabBar"
import {
	BottomTabDescriptorMap,
	BottomTabNavigationEventMap,
} from "@react-navigation/bottom-tabs/lib/typescript/src/types"
import {
	NavigationHelpers,
	ParamListBase,
	TabNavigationState,
} from "@react-navigation/native"

type TTabBar = {
	state: TabNavigationState<ParamListBase>
	descriptors: BottomTabDescriptorMap
	navigation: NavigationHelpers<ParamListBase, BottomTabNavigationEventMap>
}

const TabBar: FC<TTabBar> = props => {
	const { state, descriptors, navigation } = props
	return (
		<View style={[styles.tab]}>
			{state?.routes.map((route, index) => {
				const { options } = descriptors[route.key]
				const label = options.title !== undefined ? options.title : route.name

				const isFocused = state.index === index

				const onPress = () => {
					const event = navigation.emit({
						type: "tabPress",
						target: route.key,
						canPreventDefault: true,
					})

					if (!isFocused && !event.defaultPrevented) {
						navigation.navigate(route.name, { merge: true })
					}
				}

				return (
					<ButtonTabBar
						key={index}
						onPress={onPress}
						isFocused={isFocused}
						assetNames={label as string}
					/>
				)
			})}
		</View>
	)
}

export default TabBar

export const styles = StyleSheet.create({
	tab: {
		position: "relative",
		zIndex: 10,
		justifyContent: "space-between",
		padding: 10,
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: COLORS.BG_TAB,
	},
})
