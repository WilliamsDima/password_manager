import React, { FC, useEffect, useState } from "react"
import {
	Text,
	View,
	StyleSheet,
	Vibration,
	ToastAndroid,
	TouchableOpacity,
} from "react-native"
import COLORS from "../../../services/colors"
import { KEY } from "../../../services/constants"
import { setEncrypted } from "../../../api/asyncStorage"
import { useAuth } from "../../../hooks/useAuth"
import CryptoJS from "crypto-js"
import QRCode from "react-native-qrcode-svg"
import PressedBtn from "../../atoms/PressedBtn"
import Clipboard from "@react-native-clipboard/clipboard"
import { useActions } from "../../../hooks/useActions"

type TPin = {}

const KeyGenTemplate: FC<TPin> = ({}) => {
	const { setKey } = useActions()

	const [keyGen, setKeyGen] = useState(null)

	const { user } = useAuth()

	const copyToClipboard = () => {
		keyGen && Clipboard.setString(keyGen)
		keyGen && ToastAndroid.show("скопировано!", 2000)
		Vibration.vibrate()
	}

	const redy = () => {
		console.log("key redy", keyGen)
		setEncrypted(KEY, keyGen)
		keyGen && setKey(keyGen)
	}

	const createKey = () => {
		const keyText = user?.uid + +new Date()
		const encryptedAES = CryptoJS.AES.encrypt(
			keyText.toString(),
			user?.accessToken
		)

		setKeyGen(encryptedAES.toString())
	}

	useEffect(() => {
		if (user && !keyGen) {
			createKey()
		}
	}, [user])

	return (
		<View style={styles.conteiner}>
			{keyGen && (
				<>
					<QRCode
						color={COLORS.MAIN}
						size={150}
						enableLinearGradient={true}
						linearGradient={[COLORS.MAIN, COLORS.TITLE_COLOR]}
						backgroundColor={"transparent"}
						value={keyGen}
						logoBackgroundColor='transparent'
					/>
					<Text
						style={[styles.text, { marginTop: 20, color: COLORS.TITLE_COLOR }]}
					>
						Сделайте скриншот экрана или сохраните ключ.
					</Text>

					<Text style={[styles.text, { marginTop: 10 }]}>
						Без ключа вы не сможете восстановить доступ к вашим данным!
					</Text>
					<TouchableOpacity
						activeOpacity={1}
						style={{ marginTop: 40 }}
						onPress={copyToClipboard}
					>
						<Text selectable={true} style={styles.key}>
							{keyGen}
						</Text>
					</TouchableOpacity>
					<PressedBtn overStyle={{ marginTop: 20 }} onPress={redy}>
						<Text style={styles.btnText}>Я сохранил!</Text>
					</PressedBtn>
				</>
			)}
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
