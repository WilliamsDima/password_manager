import React, { FC } from "react"
import { View, StyleSheet } from "react-native"
import COLORS from "../../../services/colors"
import HeaderMain from "../../molecules/Headers"

const Header: FC = () => {
	return (
		<View style={[styles.header]}>
			<HeaderMain />
		</View>
	)
}

const styles = StyleSheet.create({
	header: {
		width: "100%",
		alignItems: "center",
	},
})

export default Header
