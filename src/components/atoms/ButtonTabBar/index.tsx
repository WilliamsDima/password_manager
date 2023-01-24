import React, { FC } from "react"
import { TouchableOpacity, StyleSheet } from "react-native"
import COLORS from "../../../services/colors"
import Icon from "react-native-vector-icons/FontAwesome"

type TButtonTabBar = {
	onPress?: () => void
	isFocused?: boolean
	assetNames: string
}

const ButtonTabBar: FC<TButtonTabBar> = ({
	isFocused,
	assetNames,
	onPress,
}) => {
	return (
		<TouchableOpacity
			style={[styles.button, isFocused && { backgroundColor: COLORS.MAIN }]}
			onPress={onPress}
		>
			<Icon
				name={assetNames}
				size={22}
				color={isFocused ? COLORS.GOLD : COLORS.BLUE}
			/>
		</TouchableOpacity>
	)
}

export default ButtonTabBar

export const styles = StyleSheet.create({
	button: {
		borderRadius: 10,
		padding: 15,
		width: 50,
		height: 50,
		alignItems: "center",
		justifyContent: "center",
	},
	image: {
		width: 24,
		height: 24,
	},
})
