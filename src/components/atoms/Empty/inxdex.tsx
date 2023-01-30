import React, { FC, memo } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View, Image, Text } from "react-native"
import COLORS from "../../../services/colors"

type IEmpty = {}

const Empty: FC<IEmpty> = memo(() => {
	const { t } = useTranslation()
	return (
		<View style={styles.imgWrapper}>
			<Image
				style={styles.img}
				source={require("../../../assets/images/empty.png")}
			/>
			<Text style={styles.text}>{t("empty")}</Text>
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
