import React, { FC, useEffect } from "react"
import {
	Text,
	View,
	StyleSheet,
	Vibration,
	ToastAndroid,
	TouchableOpacity,
} from "react-native"
import COLORS from "../../../services/colors"
import { useAuth } from "../../../hooks/useAuth"
import PressedBtn from "../../atoms/PressedBtn"
import Clipboard from "@react-native-clipboard/clipboard"
import { useActions } from "../../../hooks/useActions"
import { EncryptData } from "../../../hooks/helpers"
import QR from "../../atoms/QR/index"
import { useTranslation } from "react-i18next"

type TPin = {}

const KeyGenTemplate: FC<TPin> = ({}) => {
	const { t } = useTranslation()
	const { setUser, setKey, setMessage } = useActions()
	const { user } = useAuth()

	const keyError = () => {
		setMessage({
			title: t("error"),
			message: t("key_message"),
		})
	}

	const key = EncryptData(
		user?.uid + +new Date().toString(),
		user?.accessToken?.toString(),
		keyError
	)

	const copyToClipboard = () => {
		key && Clipboard.setString(key)
		key && ToastAndroid.show(t("copy"), 2000)
		key && Vibration.vibrate()
	}

	const redy = () => {
		// console.log("key redy", user?.accessToken?.toString())
		setKey(key)
		setUser(user)
	}

	useEffect(() => {
		// console.log("key gen screen", user)
		// console.log("params key", key)
	}, [user])

	return (
		<View style={styles.conteiner}>
			{!!key && (
				<>
					<QR keyUser={key} />
					<Text
						style={[styles.text, { marginTop: 20, color: COLORS.TITLE_COLOR }]}
					>
						{t("screenshot")}
					</Text>
				</>
			)}

			<Text style={[styles.text, { marginTop: 10 }]}>{t("without_key")}</Text>
			<TouchableOpacity
				activeOpacity={1}
				style={{ marginTop: 40 }}
				onPress={copyToClipboard}
			>
				<Text selectable={true} style={styles.key}>
					{key}
				</Text>
			</TouchableOpacity>

			<PressedBtn overStyle={{ marginTop: 20 }} onPress={redy}>
				<Text style={styles.btnText}>{t("saved")}</Text>
			</PressedBtn>
		</View>
	)
}
export default KeyGenTemplate

const styles = StyleSheet.create({
	conteiner: {
		width: "100%",
		height: "100%",
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 50,
		backgroundColor: COLORS.BG_DARK,
	},
	text: {
		color: COLORS.RED,
		fontSize: 16,
		textAlign: "center",
	},
	btnText: {
		fontSize: 16,
		color: COLORS.MAIN,
	},
	key: {
		color: COLORS.BLUE,
		textAlign: "center",
		fontSize: 16,
	},
})
