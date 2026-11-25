import React, { FC } from "react"
import { View, StyleSheet, Text, TouchableOpacity } from "react-native"
import { useAppSelector } from "../../../hooks/hooks"
import { useActions } from "../../../hooks/useActions"
import COLORS from "../../../services/colors"

type TLanguageModal = {
	setLanguageModal: (value: boolean) => void
}

const languages = [
	{
		lang: "Український",
		value: "uk_UA",
	},
	{
		lang: "English",
		value: "en_US",
	},
	{
		lang: "Русский",
		value: "ru_RU",
	},
]

const LanguageModal: FC<TLanguageModal> = React.memo(({ setLanguageModal }) => {
	const { changeLanguage } = useActions()
	const { language } = useAppSelector(store => store.main)

	const setLanguageHandler = (value: string) => {
		changeLanguage(value)
		setLanguageModal(false)
	}

	return (
		<TouchableOpacity activeOpacity={1} style={[styles.wrapp]}>
			{languages.map(item => {
				return (
					<TouchableOpacity
						key={item.value}
						style={[styles.item]}
						onPress={() => setLanguageHandler(item.value)}
					>
						<View
							style={[styles.circle, item.value === language && styles.active]}
						/>
						<Text
							style={[
								styles.text,
								item.value === language && styles.activeText,
							]}
						>
							{item.lang}
						</Text>
					</TouchableOpacity>
				)
			})}
		</TouchableOpacity>
	)
})

export default LanguageModal

const styles = StyleSheet.create({
	wrapp: {
		width: "70%",
		padding: 10,
		borderRadius: 5,
		backgroundColor: COLORS.TITLE_COLOR,
	},
	item: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 5,
	},
	text: {
		color: COLORS.BLACK,
		fontSize: 16,
	},
	active: {
		borderColor: COLORS.MAIN,
		backgroundColor: COLORS.MAIN,
	},
	activeText: {
		color: COLORS.MAIN,
	},
	circle: {
		width: 20,
		height: 20,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: COLORS.GRAY,
		marginRight: 10,
	},
})
