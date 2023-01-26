import React, { FC, memo, useState } from "react"
import {
	View,
	Text,
	StyleSheet,
	Share,
	Linking,
	TouchableOpacity,
} from "react-native"
import Icon from "react-native-vector-icons/MaterialIcons"
import IconEntypo from "react-native-vector-icons/Entypo"
import { useAuth } from "../../../hooks/useAuth"
import COLORS from "../../../services/colors"
import PressedBtn from "../../atoms/PressedBtn"
import { urlAppStore } from "../../../services/constants"
import { useActions } from "../../../hooks/useActions"
import MyModal from "../../organisms/Modal"
import Form from "../../organisms/Form"

type TProfileBtns = {}

const ProfileBtns: FC<TProfileBtns> = memo(({}) => {
	const { logoutHandler } = useAuth()
	const { setMessage } = useActions()
	const [recovery, setRecovery] = useState(false)

	const logout = () => {
		setMessage({
			title: "",
			message: "Выйти из аккаунта?",
			callback: () => logoutHandler(),
		})
	}

	const toGooglePlay = () => {
		Linking.openURL(urlAppStore)
	}

	const onShare = async () => {
		try {
			const result = await Share.share({
				message: urlAppStore,
			})
			if (result.action === Share.sharedAction) {
				if (result.activityType) {
					// shared with activity type of result.activityType
				} else {
					// shared
				}
			} else if (result.action === Share.dismissedAction) {
				// dismissed
			}
		} catch (error) {
			console.log(error.message)
		}
	}

	return (
		<View style={styles.container}>
			<MyModal visible={recovery} close={() => setRecovery(false)}>
				<TouchableOpacity
					activeOpacity={1}
					style={{
						justifyContent: "center",
						alignItems: "center",
						width: "100%",
					}}
				>
					<Form recoveryMode={true} recoveryProfile={true} />
				</TouchableOpacity>
			</MyModal>
			<PressedBtn
				overStyle={styles.btn}
				onPress={toGooglePlay}
				colorPressed={"rgba(226,234,255, 0.1)"}
			>
				<IconEntypo name={"google-play"} size={26} color={COLORS.TITLE_COLOR} />
				<Text style={styles.textBtn}>оставить отзыв</Text>
			</PressedBtn>
			<PressedBtn
				overStyle={styles.btn}
				onPress={onShare}
				colorPressed={"rgba(226,234,255, 0.1)"}
			>
				<IconEntypo name={"share"} size={26} color={COLORS.TITLE_COLOR} />
				<Text style={styles.textBtn}>поделиться</Text>
			</PressedBtn>
			<PressedBtn
				overStyle={styles.btn}
				onPress={() => setRecovery(true)}
				colorPressed={"rgba(226,234,255, 0.1)"}
			>
				<IconEntypo name={"email"} size={26} color={COLORS.TITLE_COLOR} />
				<Text style={styles.textBtn}>сменить пароль</Text>
			</PressedBtn>
			<PressedBtn
				colorPressed={"rgba(255, 255, 255, 0.12)"}
				overStyle={styles.btn}
				onPress={logout}
			>
				<Icon name={"exit-to-app"} size={26} color={COLORS.TITLE_COLOR} />
				<Text style={styles.textBtn}>выйти</Text>
			</PressedBtn>
		</View>
	)
})

export default ProfileBtns

const styles = StyleSheet.create({
	btnRcovery: {
		width: "100%",
		marginTop: 10,
		padding: 7,
	},
	container: {
		// position: "absolute",
		width: "100%",
		justifyContent: "flex-start",
		alignItems: "center",
		marginTop: 40,
		// bottom: 0,
	},
	textBtn: {
		color: COLORS.TITLE_COLOR,
		fontSize: 16,
		textTransform: "uppercase",
		marginLeft: 20,
	},
	btn: {
		justifyContent: "flex-start",
		alignItems: "center",
		width: "100%",
		paddingHorizontal: 20,
		borderRadius: 0,
	},
})
