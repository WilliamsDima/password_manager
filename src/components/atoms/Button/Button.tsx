import React, { FC, ReactNode, memo } from "react"
import { TouchableOpacity, StyleSheet, ViewStyle } from "react-native"

interface IButton {
	children?: ReactNode
	onPress?: () => void
	overStyle?: ViewStyle
}

const Button: FC<IButton> = memo(({ children, onPress, overStyle }) => {
	return (
		<TouchableOpacity style={[styles.btn, { ...overStyle }]} onPress={onPress}>
			{children}
		</TouchableOpacity>
	)
})

export default Button

const styles = StyleSheet.create({
	btn: {
		padding: 7,
		paddingHorizontal: 20,
		borderRadius: 5,
		backgroundColor: "#F4D652",
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
	},
})
