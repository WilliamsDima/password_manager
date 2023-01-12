import React, { FC, memo, ReactNode } from "react"
import {
	View,
	Text,
	Image,
	StyleSheet,
	ImageSourcePropType,
} from "react-native"
import COLORS from "../../../services/colors"
import { WIDTH } from "../../../services/constants"

type TSliderItem = {
	text: string
	source?: ImageSourcePropType
	children?: ReactNode
}

const SliderItem: FC<TSliderItem> = memo(({ text, source, children }) => {
	return (
		<View
			style={{
				width: WIDTH,
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			{source && <Image style={styles.img} source={source} />}
			<Text style={styles.text}>{text}</Text>
			{children}
		</View>
	)
})

export default SliderItem

const styles = StyleSheet.create({
	img: {
		flex: 1,
		width: "80%",
		maxHeight: 250,
		resizeMode: "contain",
	},
	text: {
		width: "80%",
		textAlign: "center",
		color: COLORS.TITLE_COLOR,
		fontSize: 22,
		marginTop: 40,
	},
})
