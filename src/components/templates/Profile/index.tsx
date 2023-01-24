import React, { useState } from "react"
import { View, StyleSheet, Image, Text } from "react-native"
import UserProfile from "../../molecules/UserProfile"
import MyModal from "../../organisms/Modal"
import CameraTemplate from "../Camera"
import ProfileBtns from "../../molecules/ProfileBtns"
import COLORS from "../../../services/colors"
import IconMaterial from "react-native-vector-icons/MaterialIcons"

const ProfileTemplate = () => {
	const [camnera, setCamera] = useState(false)

	return (
		<View style={styles.container}>
			<UserProfile setCamera={setCamera} />

			<MyModal
				visible={camnera}
				close={() => setCamera(false)}
				animationType={"fade"}
			>
				<CameraTemplate setCamera={setCamera} />
			</MyModal>

			<View style={styles.imgBlock}>
				<Image
					style={styles.img}
					source={require("../../../assets/images/cpu.png")}
				/>
				<View style={styles.textBlock}>
					<Text style={styles.text}>Ваши данные защищены</Text>
					<IconMaterial name={"done"} size={18} color={COLORS.MAIN} />
				</View>
			</View>

			<ProfileBtns />
		</View>
	)
}
export default ProfileTemplate

const styles = StyleSheet.create({
	container: {
		position: "relative",
		width: "100%",
		paddingTop: 40,
	},
	imgBlock: {
		width: "100%",
		height: 200,
		justifyContent: "center",
		alignItems: "center",
		marginTop: 20,
	},
	textBlock: {
		marginTop: 10,
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
	},
	text: {
		color: COLORS.GRAY,
		marginRight: 5,
	},
	img: {
		flex: 1,
		width: "70%",
		maxHeight: 250,
		resizeMode: "contain",
	},
})
