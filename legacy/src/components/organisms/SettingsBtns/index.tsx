import React, { FC, memo } from "react"
import { View, StyleSheet, Text } from "react-native"
import COLORS from "../../../services/colors"
import { useNavigation } from "@react-navigation/native"
import PressedBtn from "../../atoms/PressedBtn"
import IconAnt from "react-native-vector-icons/AntDesign"
import IconFont from "react-native-vector-icons/FontAwesome"
import { useAppSelector } from "../../../hooks/hooks"
import { RoutesNames } from "../../../navigation/routes-names"
import { useTranslation } from "react-i18next"

type TBtns = {
	setLanguageModal: (value: boolean) => void
}

const SettingsBtns: FC<TBtns> = memo(({ setLanguageModal }) => {
	const { t } = useTranslation()
	const { pin } = useAppSelector(store => store.main)

	const { navigate } = useNavigation()

	const toPin = () => {
		navigate(
			RoutesNames.Pin as never,
			{ createMode: true, settingsMode: true } as never
		)
	}

	const changeLanguageHandler = () => {
		setLanguageModal(true)
	}

	return (
		<View style={styles.btns}>
			<View style={styles.item}>
				<PressedBtn overStyle={styles.btn} onPress={toPin}>
					<View style={styles.wrappIcon}>
						<IconAnt name={"lock"} size={26} color={COLORS.MAIN} />
					</View>
					<Text style={styles.btnText}>
						{pin ? t("change_code") : t("set_code")}
					</Text>
				</PressedBtn>
			</View>
			<View style={styles.item}>
				<PressedBtn overStyle={styles.btn} onPress={changeLanguageHandler}>
					<View style={styles.wrappIcon}>
						<IconFont name={"language"} size={26} color={COLORS.MAIN} />
					</View>
					<Text style={styles.btnText}>{t("change_language")}</Text>
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
		// width: "100%",
		justifyContent: "flex-start",
		alignItems: "center",
		paddingHorizontal: 10,
	},
	wrappIcon: {
		width: "10%",
		justifyContent: "flex-start",
		alignItems: "center",
	},
	btnText: {
		width: "87%",
		marginLeft: 10,
		color: COLORS.TITLE_COLOR,
		fontSize: 16,
	},
})
