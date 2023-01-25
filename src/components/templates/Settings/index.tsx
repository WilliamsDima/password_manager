import React, { useEffect } from "react"
import { View, StyleSheet, Text, Image } from "react-native"
import { useAppSelector } from "../../../hooks/hooks"
import PressedBtn from "../../atoms/PressedBtn"
import IconAnt from "react-native-vector-icons/AntDesign"
import COLORS from "../../../services/colors"
import { useNavigation } from "@react-navigation/native"
import { RoutesNames } from "../../../navigation/routes-names"
import SettingsBtns from "../../organisms/SettingsBtns"
import DevInfo from "../../organisms/DevInfo"

const SettingsTemplate = () => {
	useEffect(() => {
		// console.log(pin)
	}, [])
	return (
		<View style={styles.container}>
			<SettingsBtns />
			<View style={styles.imgWrapper}>
				<Image
					style={styles.img}
					source={require("../../../assets/images/cpu.png")}
				/>
			</View>
			<DevInfo />
		</View>
	)
}
export default SettingsTemplate

const styles = StyleSheet.create({
	container: {
		width: "100%",
		height: "100%",
		paddingVertical: 40,
		paddingHorizontal: 10,
		justifyContent: "flex-start",
		alignItems: "flex-start",
	},
	img: {
		width: "50%",
		maxHeight: 200,
		resizeMode: "contain",
	},
	imgWrapper: {
		width: "100%",
		maxHeight: 200,
		justifyContent: "flex-start",
		alignItems: "center",
	},
})
