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

type TPin = {}

const KeyGenTemplate: FC<TPin> = ({}) => {
	const { setUser, setKey } = useActions()
	const { user } = useAuth()

	const key = EncryptData(
		user?.uid + +new Date().toString(),
		user?.accessToken?.toString()
	)

	const copyToClipboard = () => {
		key && Clipboard.setString(key)
		key && ToastAndroid.show("скопировано!", 2000)
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
						Сделайте скриншот экрана или сохраните ключ.
					</Text>
				</>
			)}

			<Text style={[styles.text, { marginTop: 10 }]}>
				Без ключа вы не сможете восстановить доступ к вашим данным!
			</Text>
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
				<Text style={styles.btnText}>Я сохранил!</Text>
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
