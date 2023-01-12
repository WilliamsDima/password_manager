import React, { FC } from "react"
import { View, StyleSheet, ViewStyle, ActivityIndicator } from "react-native"
import COLORS from "../../../services/colors"

interface ILoader {
	overStyle?: ViewStyle
}

const Loader: FC<ILoader> = React.memo(({ overStyle }) => {
	return (
		<ActivityIndicator
			style={{ transform: [{ scale: 2 }] }}
			size='large'
			color={COLORS.MAIN}
		/>
	)
})

export default Loader

const styles = StyleSheet.create({
	wrapp: {
		position: "absolute",
		width: "100%",
		height: "100%",
		justifyContent: "center",
		alignItems: "center",
		zIndex: 100,
	},
})
