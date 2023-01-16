import React, { FC } from "react"
import { useNavigation } from "@react-navigation/native"
import { View, Text, StyleSheet } from "react-native"
import COLORS from "../../../services/colors"
import UserHeader from "../UserHeader"

interface IHeaderMain {}

const HeaderMain: FC<IHeaderMain> = props => {
	const navigation = useNavigation()

	return (
		<View style={styles.header}>
			<Text style={styles.title}>Главная</Text>
			<UserHeader />
		</View>
	)
}

const styles = StyleSheet.create({
	header: {
		width: "100%",
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	title: {
		color: COLORS.TITLE_COLOR,
		fontSize: 20,
	},
})

export default HeaderMain
