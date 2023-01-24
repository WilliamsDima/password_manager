import React from "react"
import { View, StyleSheet, Text } from "react-native"
import COLORS from "../../../services/colors"
import PressedBtn from "../../atoms/PressedBtn"
import StartSlider from "../../organisms/StartSlider"
import { useNavigation, CommonActions } from "@react-navigation/native"
import { RoutesNames } from "../../../navigation/routes-names"
import { setLocal } from "../../../api/asyncStorage"
import { HEIGHT, START, WIDTH } from "../../../services/constants"

const StartTemplate = () => {
	const navigation = useNavigation()

	const skip = () => {
		setLocal(START, true)
		navigation.navigate(RoutesNames.Auth.AuthStack as never)
		navigation.dispatch(
			CommonActions.reset({
				index: 1,
				routes: [{ name: RoutesNames.Auth.AuthStack }],
			})
		)
	}

	return (
		<View style={styles.container}>
			<PressedBtn overStyle={styles.skipBtn} onPress={skip}>
				<Text style={{ color: COLORS.MAIN }}>пропустить</Text>
			</PressedBtn>
			<StartSlider />
		</View>
	)
}
export default StartTemplate

const styles = StyleSheet.create({
	container: {
		width: WIDTH,
		height: HEIGHT,
		justifyContent: "center",
		alignItems: "center",
	},
	skipBtn: {
		position: "absolute",
		top: 50,
		right: 10,
		zIndex: 10,
	},
})
