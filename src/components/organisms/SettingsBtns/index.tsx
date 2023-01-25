import React, { FC, memo } from "react"
import { View, StyleSheet, Text } from "react-native"
import COLORS from "../../../services/colors"
import { useNavigation } from "@react-navigation/native"
import PressedBtn from "../../atoms/PressedBtn"
import IconAnt from "react-native-vector-icons/AntDesign"
import IconFont from "react-native-vector-icons/FontAwesome"
import { useAppSelector } from "../../../hooks/hooks"
import { RoutesNames } from "../../../navigation/routes-names"
import { useActions } from "../../../hooks/useActions"

type TBtns = {}

const SettingsBtns: FC<TBtns> = memo(({}) => {
	const { pin } = useAppSelector(store => store.main)
	const { setMessage } = useActions()

	const { navigate } = useNavigation()

	const toPin = () => {
		navigate(
			RoutesNames.Pin as never,
			{ createMode: true, settingsMode: true } as never
		)
	}

	const changeLanguageHandler = () => {
		setMessage({
			title: "",
			message: "В разработке...",
		})
	}

	return (
		<View style={styles.btns}>
			<View style={styles.item}>
				<PressedBtn overStyle={styles.btn} onPress={toPin}>
					<View style={styles.wrappIcon}>
						<IconAnt name={"lock"} size={26} color={COLORS.MAIN} />
					</View>
					<Text style={styles.btnText}>
						{pin
							? "изменить код для входа в приложение"
							: "установить код для входа в приложение"}
					</Text>
				</PressedBtn>
			</View>
			<View style={styles.item}>
				<PressedBtn overStyle={styles.btn} onPress={changeLanguageHandler}>
					<View style={styles.wrappIcon}>
						<IconFont name={"language"} size={26} color={COLORS.MAIN} />
					</View>
					<Text style={styles.btnText}>изменить язык</Text>
				</PressedBtn>
			</View>
		</View>
	)
})

export default SettingsBtns

export const styles = StyleSheet.create({
	btns: {
		width: "100%",
	},
	item: {
		width: "100%",
		marginBottom: 10,
	},
	btn: {
		width: "100%",
		justifyContent: "flex-start",
		alignItems: "center",
	},
	wrappIcon: {
		width: "10%",
		justifyContent: "flex-start",
		alignItems: "center",
	},
	btnText: {
		marginLeft: 10,
		color: COLORS.TITLE_COLOR,
		fontSize: 16,
	},
})
