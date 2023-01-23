import React, { FC, memo, useEffect, useState } from "react"
import {
	StyleSheet,
	Text,
	View,
	TouchableOpacity,
	ScrollView,
} from "react-native"
import { useInput } from "../../../hooks/useInput"
import COLORS from "../../../services/colors"
import Input from "../../atoms/Input/Input"
import Icon from "react-native-vector-icons/MaterialIcons"
import PressedBtn from "../../atoms/PressedBtn"
import { useActions } from "../../../hooks/useActions"
import { IItem, IItemContent } from "../../../services/types"
import { useAppSelector } from "../../../hooks/hooks"
import { DecryptData, EncryptData } from "../../../hooks/helpers"

type IModal = {
	setFormItem: (value: IItem | boolean) => void
	formItem: IItem | boolean
}

const FormItem: FC<IModal> = memo(({ setFormItem, formItem }) => {
	const { setMessage, addItem, editItem } = useActions()
	const { key } = useAppSelector(store => store.main)
	const titleMax = 40
	const loginMax = 100
	const passwordMax = 100
	const descriptionMax = 100

	const isItem = typeof formItem === "object"

	const [data, setData] = useState<IItemContent | null>(null)

	const [title, bindTitle, resetTitle] = useInput(
		isItem && key
			? DecryptData(formItem?.title, key)
			: "какой длинный тестовый заголовок"
	)
	const [login, bindLogin, resetLogin, setLogin] = useInput("text@test.ru")
	const [password, bindPassword, resetPassword, setPassword] =
		useInput("1234567890")
	const [description, bindDescription, resetDescription, setDescription] =
		useInput("какое то описание")

	const descriptData = () => {
		const isItem = typeof formItem === "object"
		if (isItem && key) {
			const data: IItemContent = DecryptData(formItem?.message, key, setMessage)
			setLogin(data?.login || "")
			setPassword(data?.password || "")
			setDescription(data?.description || "")
			setData(data)
		}
	}

	const checkError = () => {
		if (title.trim().length === 0) {
			setMessage({
				title: "Ошибка",
				message: `Заголовок обязателеное поле!`,
			})
			return true
		}
		if (login.trim().length === 0) {
			setMessage({
				title: "Ошибка",
				message: `Логин обязателеное поле!`,
			})
			return true
		}
		if (password.trim().length === 0) {
			setMessage({
				title: "Ошибка",
				message: `Пароль обязателеное поле!`,
			})
			return true
		}
		if (title.length > titleMax) {
			setMessage({
				title: "Ошибка",
				message: `Длина заголовка превышает ${titleMax}!`,
			})
			return true
		}
		if (login.length > loginMax) {
			setMessage({
				title: "Ошибка",
				message: `Длина логина превышает ${loginMax}!`,
			})
			return true
		}
		if (password.length > passwordMax) {
			setMessage({
				title: "Ошибка",
				message: `Длина пароля превышает ${passwordMax}!`,
			})
			return true
		}
		if (description.length > descriptionMax) {
			setMessage({
				title: "Ошибка",
				message: `Длина описания превышает ${descriptionMax}!`,
			})
			return true
		}
		return false
	}

	const sendHandler = () => {
		if (!checkError() && key) {
			const dataEncript = EncryptData(
				{
					description,
					login,
					password,
				},
				key,
				setMessage
			)

			const data = {
				id: +new Date(),
				title: EncryptData(title, key),
				message: dataEncript,
			}

			if (isItem) {
				const editData = {
					id: formItem.id,
					title: EncryptData(title, key),
					message: dataEncript,
				}
				editItem(editData)
			} else {
				addItem(data)
			}
			setFormItem(false)
			resetTitle()
			resetLogin()
			resetPassword()
			resetDescription()
		}
	}

	useEffect(() => {
		if (!data) descriptData()
	}, [data])

	return (
		<TouchableOpacity activeOpacity={1} style={styles.modal}>
			<ScrollView>
				<View style={styles.item}>
					<Input
						placeholder='Заголовок'
						overStyle={styles.input}
						{...bindTitle}
						maxLength={titleMax}
					/>
				</View>
				<View style={styles.item}>
					<Input
						placeholder='Логин'
						overStyle={styles.input}
						{...bindLogin}
						maxLength={loginMax}
					/>
				</View>
				<View style={styles.item}>
					<Input
						placeholder='Пароль'
						overStyle={styles.input}
						{...bindPassword}
						maxLength={passwordMax}
					/>
				</View>
				<View style={styles.item}>
					<Input
						placeholder='Описание *'
						overStyle={styles.input}
						{...bindDescription}
						multiline={true}
						maxLength={descriptionMax}
					/>
				</View>
				<View style={[styles.item, { alignItems: "flex-start" }]}>
					<Text style={[styles.text, { marginTop: 0 }]}>
						* - не обязательно
					</Text>
				</View>
				<View style={styles.item}>
					<Text style={styles.text}>Ваши данные будут зашифрованы</Text>
				</View>
				<View style={styles.item}>
					<PressedBtn overStyle={styles.btn} onPress={sendHandler}>
						<Icon name={"done"} size={42} color={COLORS.MAIN} />
					</PressedBtn>
				</View>
			</ScrollView>
		</TouchableOpacity>
	)
})

export default FormItem

const styles = StyleSheet.create({
	modal: {
		width: "90%",
		height: "53%",
		backgroundColor: COLORS.BG_DARK,
		borderRadius: 5,
		padding: 20,
	},
	btn: {
		width: 60,
		height: 60,
		borderRadius: 30,
		justifyContent: "center",
		alignItems: "center",
	},
	item: {
		marginBottom: 10,
		justifyContent: "center",
		alignItems: "center",
	},
	description: {
		color: COLORS.GOLD,
		fontSize: 18,
		paddingBottom: 5,
		paddingLeft: 0,
		height: 60,
	},
	input: {
		color: COLORS.GOLD,
		fontSize: 18,
		paddingBottom: 5,
		paddingLeft: 0,
	},
	title: {
		color: COLORS.MAIN,
		textTransform: "uppercase",
	},
	text: {
		marginTop: 20,
		textAlign: "center",
		fontSize: 16,
		color: COLORS.BG_TAB,
	},
})
