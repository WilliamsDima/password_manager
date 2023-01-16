import React, { FC } from "react"
import {
	View,
	Text,
	StyleSheet,
	Animated,
	TouchableOpacity,
} from "react-native"
import IconEntypo from "react-native-vector-icons/Entypo"
import COLORS from "../../../services/colors"

export const openLeft = (progress, dragX) => {
	const scale = dragX.interpolate({
		inputRange: [0, 40],
		outputRange: [0, 1],
		extrapolate: "extend",
	})
	return (
		<View
			style={{ width: 50, justifyContent: "center", alignItems: "flex-start" }}
		>
			<Animated.View style={{ transform: [{ scale: scale }], marginLeft: 10 }}>
				<IconEntypo name={"eye"} size={20} color={COLORS.MAIN} />
			</Animated.View>
		</View>
	)
}
