import React from "react"
import { View, StyleSheet, Text } from "react-native"
import UserProfile from "../../molecules/UserProfile"
import ProfileBtns from "../../molecules/ProfileBtns"
import COLORS from "../../../services/colors"
import IconMaterial from "react-native-vector-icons/MaterialIcons"
import QR from "../../atoms/QR"
import { useAppSelector } from "../../../hooks/hooks"

const ProfileTemplate = () => {
	const { key } = useAppSelector(store => store.main)

	return (
		<View style={styles.container}>
			<UserProfile />

			<View style={styles.imgBlock}>
				{key && <QR keyUser={key} visible={false} />}

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
