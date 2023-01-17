import React, { FC, memo, useRef, useState } from "react"
import {
	View,
	StyleSheet,
	TouchableOpacity,
	Text,
	Animated,
	Easing,
	LayoutAnimation,
} from "react-native"
import { toggleAnimation } from "../../../services/animation"
import COLORS from "../../../services/colors"

type TDescription = {
	description: string
}

const DescriptionItem: FC<TDescription> = memo(({ description }) => {
	const [showDescription, setShowDescription] = useState(false)
	const animatedController = useRef(new Animated.Value(0)).current

	const toggleListItem = () => {
		const config = {
			duration: 300,
			toValue: showDescription ? 0 : 1,
			easing: Easing.bezier(0.4, 0.0, 0.2, 1),
			useNativeDriver: false,
		}

		Animated.timing(animatedController, config).start()
		LayoutAnimation.configureNext(toggleAnimation)
		setShowDescription(!showDescription)
	}

	return (
		<View style={styles.descriptionBlock}>
			<TouchableOpacity style={styles.btn} onPress={toggleListItem}>
				<Text style={styles.btnText}>?</Text>
			</TouchableOpacity>
			{showDescription && (
				<View style={styles.description}>
					<Text style={styles.descriptionText}>{description}</Text>
				</View>
			)}
		</View>
	)
})

export default DescriptionItem

const styles = StyleSheet.create({
	description: {
		marginTop: 10,
	},
	descriptionText: {
		color: COLORS.TITLE_COLOR,
	},
	descriptionBlock: {
		width: "100%",
	},
	btn: {
		position: "absolute",
		bottom: -30,
		right: 0,
		borderWidth: 1,
		borderColor: COLORS.WHITE,
		width: 20,
		height: 20,
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 10,
	},
	btnText: {
		color: COLORS.WHITE,
		fontSize: 13,
	},
})
