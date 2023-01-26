import React, { FC, memo } from "react"
import { View, StyleSheet, Text, Linking, TouchableOpacity } from "react-native"
import COLORS from "../../../services/colors"
import IconAnt from "react-native-vector-icons/AntDesign"
import IconFont from "react-native-vector-icons/FontAwesome"
import IconEntypo from "react-native-vector-icons/Entypo"
import IconIonicons from "react-native-vector-icons/Ionicons"
import IconFontisto from "react-native-vector-icons/Fontisto"
import { urlAppStore } from "../../../services/constants"
import { useAppSelector } from "../../../hooks/hooks"

type TBtns = {}

const DevInfo: FC<TBtns> = memo(({}) => {
	const { user } = useAppSelector(store => store.main)
	const toMySite = () => {
		Linking.openURL("https://williams-dy.ru/")
	}

	const toPrivacy = () => {
		Linking.openURL(
			"https://doc-hosting.flycricket.io/menedzher-parolei-privacy-policy/cb38791d-4d5b-4d94-ad86-ebfc4bc4b7ca/privacy"
		)
	}

	const toMyVk = () => {
		Linking.openURL("https://vk.com/williamsdy")
	}

	const toInst = () => {
		Linking.openURL("https://www.instagram.com/williams.css/")
	}

	const toTelegram = () => {
		Linking.openURL("https://t.me/DyWilliams")
	}

	const toMail = () => {
		Linking.openURL(`mailto:oxpa97@mail.ru?subject=${user?.id}`)
	}

	// const toLindedin = () => {
	// 	Linking.openURL("https://ru.linkedin.com/in/dmitry-lemetin-87b412238/ru")
	// }

	// const toTwitter = () => {
	// 	Linking.openURL("https://twitter.com/DmitryWilliam")
	// }

	const toReactNative = () => {
		Linking.openURL("https://reactnative.dev/")
	}

	const toGoogleStore = () => {
		Linking.openURL(urlAppStore)
	}
	return (
		<View style={[styles.itemCenter, styles.container]}>
			<TouchableOpacity onPress={toMySite}>
				<Text style={[{ color: COLORS.MAIN }]}>
					сайт разработчика{": "}
					<Text style={{ textDecorationLine: "underline" }}>
						williams-dy.ru
					</Text>
				</Text>
			</TouchableOpacity>

			<TouchableOpacity
				style={[styles.itemCenter, styles.orders]}
				onPress={toGoogleStore}
			>
				<IconFontisto name={"slightly-smile"} size={46} color={COLORS.MAIN} />
				<Text style={[styles.text, { marginTop: 10 }]}>оставь отзыв</Text>

				<View style={[styles.itemCenter, styles.stars]}>
					<IconAnt name={"star"} size={46} color={COLORS.GOLD} />
					<IconAnt name={"star"} size={46} color={COLORS.GOLD} />
					<IconAnt name={"star"} size={46} color={COLORS.GOLD} />
					<IconAnt name={"star"} size={46} color={COLORS.GOLD} />
					<IconAnt name={"star"} size={46} color={COLORS.GOLD} />
				</View>
			</TouchableOpacity>

			<View style={[styles.itemCenter]}>
				<Text style={styles.title}>контакты разработчика:</Text>

				<View style={[styles.itemCenter, styles.socials]}>
					<TouchableOpacity onPress={toMyVk}>
						<IconFont name={"vk"} size={36} color={COLORS.MAIN} />
					</TouchableOpacity>
					<TouchableOpacity onPress={toInst}>
						<IconFont name={"instagram"} size={36} color={COLORS.MAIN} />
					</TouchableOpacity>
					<TouchableOpacity onPress={toTelegram}>
						<IconFont name={"telegram"} size={33} color={COLORS.MAIN} />
					</TouchableOpacity>
					<TouchableOpacity onPress={toMail}>
						<IconEntypo name={"email"} size={33} color={COLORS.MAIN} />
					</TouchableOpacity>
				</View>
			</View>

			<View style={[styles.itemCenter]}>
				<Text style={[styles.title, { marginBottom: 10 }]}>о приложении:</Text>

				<TouchableOpacity onPress={toReactNative}>
					<IconIonicons name={"logo-react"} size={63} color={COLORS.MAIN} />
				</TouchableOpacity>

				<Text style={[styles.text, { marginTop: 10 }]}>
					версия приложения 1.0.1
				</Text>

				<TouchableOpacity onPress={toPrivacy}>
					<Text style={[styles.text, { marginTop: 10 }]}>
						политика конфиденциальности
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	)
})

export default DevInfo

export const styles = StyleSheet.create({
	itemCenter: {
		width: "100%",
		justifyContent: "center",
		alignItems: "center",
		marginTop: 20,
	},
	container: {
		height: "100%",
		justifyContent: "flex-start",
	},
	socials: {
		flexDirection: "row",
		justifyContent: "space-evenly",
	},
	orders: {},
	title: {
		color: COLORS.BLUE,
		textTransform: "uppercase",
	},
	text: {
		color: COLORS.TITLE_COLOR,
		fontSize: 16,
	},
	stars: {
		flexDirection: "row",
	},
})
