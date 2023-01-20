import React, { FC, memo } from "react"
import { StyleSheet, View, Image, Text } from "react-native"
import COLORS from "../../../services/colors"

type IEmpty = {}

const Empty: FC<IEmpty> = memo(() => {
	return (
		<View style={styles.imgWrapper}>
			<Image
				style={styles.img}
				source={require("../../../assets/images/empty.png")}
			/>
			<Text style={styles.text}>у вас пока нет данных</Text>
		</View>
	)
})

export default Empty

const styles = StyleSheet.create({
	img: {
		width: "50%",
		maxHeight: 250,
		resizeMode: "contain",
	},
	imgWrapper: {
		width: "100%",
		justifyContent: "center",
		alignItems: "center",
	},
	text: {
		color: COLORS.MAIN,
		fontSize: 16,
	},
})
