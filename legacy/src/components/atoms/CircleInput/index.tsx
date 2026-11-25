import React, { FC, ReactNode, memo } from "react"
import { View, StyleSheet, ViewStyle, Text } from "react-native"
import COLORS from "../../../services/colors"

type TCircle = {
	number: ReactNode
	overStyle?: ViewStyle
}

const CircleInput: FC<TCircle> = memo(({ number, overStyle }) => {
	return (
		<View
			style={[
				styles.circle,
				number !== undefined && {
					backgroundColor: COLORS.MAIN,
					borderColor: COLORS.MAIN,
				},
				{ ...overStyle },
			]}
		>
			<Text style={{ opacity: 0 }}>{number}</Text>
		</View>
	)
})

export default CircleInput

const styles = StyleSheet.create({
	circle: {
		marginHorizontal: 5,
		width: 50,
		height: 50,
		borderRadius: 25,
		borderWidth: 1,
		borderColor: COLORS.GRAY,
		backgroundColor: "transparent",
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
	},
})
