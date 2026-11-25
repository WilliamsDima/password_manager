import React, { FC, ReactNode, memo } from "react"
import { Pressable, StyleSheet, ViewStyle } from "react-native"

type TButton = {
	children?: ReactNode
	onPress?: () => void
	overStyle?: ViewStyle
	disabled?: boolean
	colorPressed?: string
}

const PressedBtn: FC<TButton> = memo(
	({
		children,
		onPress,
		overStyle,
		disabled = false,
		colorPressed = "rgba(27,170,117, 0.1)",
	}) => {
		return (
			<Pressable
				onPress={onPress}
				disabled={disabled}
				style={({ pressed }) => [
					{
						backgroundColor: pressed ? colorPressed : "transparent",
					},
					styles.btn,
					overStyle,
				]}
			>
				{children}
			</Pressable>
		)
	}
)

export default PressedBtn

const styles = StyleSheet.create({
	btn: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		padding: 5,
		borderRadius: 5,
	},
})
