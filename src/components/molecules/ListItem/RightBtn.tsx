import React, { FC } from "react"
import {
	View,
	Text,
	StyleSheet,
	Animated,
	TouchableOpacity,
} from "react-native"
import IconMeterial from "react-native-vector-icons/MaterialCommunityIcons"
import COLORS from "../../../services/colors"

export const openRight = (progress, dragX) => {
	const scale = dragX.interpolate({
		inputRange: [0, 100],
		outputRange: [1, 0],
		extrapolate: "extend",
	})
	return (
		<View
			style={{ width: 50, justifyContent: "center", alignItems: "flex-end" }}
		>
			<Animated.View style={{ transform: [{ scale: scale }] }}>
				<IconMeterial name={"delete"} size={20} color={COLORS.RED} />
			</Animated.View>
		</View>
	)
}
