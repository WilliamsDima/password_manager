import React, { FC, memo } from "react"
import { View, StyleSheet, Text } from "react-native"
import { useAuth } from "../../../hooks/useAuth"
import { useInput } from "../../../hooks/useInput"
import COLORS from "../../../services/colors"
import Button from "../../atoms/Button/Button"
import LoginSvg from "../../atoms/Icons/LoginSvg"
import PasswordSvg from "../../atoms/Icons/PasswordSvg"
import Input from "../../atoms/Input/Input"
import PressedBtn from "../../atoms/PressedBtn"
import { useNavigation } from "@react-navigation/native"
import { RoutesNames } from "../../../navigation/routes-names"
import { useActions } from "../../../hooks/useActions"

type TForm = {
	registerMode?: boolean
}

const Form: FC<TForm> = memo(({ registerMode = false }) => {
	const { registerHandler, loginHandler } = useAuth()
	const { setError } = useActions()
	const navigation = useNavigation()

	const [loginText, bindLogin, resetLogin] = useInput("oxpa@mail.ru")
	const [password, bindPassword, resetPassword] = useInput("samurai")
	const [password2, bindPassword2, resetPassword2] = useInput("samura")

	const toRegister = () => {
		navigation.navigate(RoutesNames.Auth.Register as never)
		resetLogin()
		resetPassword()
	}

	const toAuth = () => {
		navigation.navigate(RoutesNames.Auth.AuthStack as never)
		resetLogin()
		resetPassword()
		resetPassword2()
	}

	const register = async () => {
		if (password === password2) {
			await registerHandler(loginText, password)
			resetLogin()
		} else {
			setError("Пароли не совпадают!")
		}
		resetPassword()
		resetPassword2()
	}

	const login = async () => {
		await loginHandler(loginText, password)
		resetLogin()
		resetPassword()
	}
	return (
		<View style={styles.form}>
			<View style={{ marginBottom: 20 }}>
				<Text
					style={{ color: COLORS.TITLE_COLOR, fontSize: 22, fontWeight: "700" }}
				>
					{registerMode ? "Регистрация" : "Авторизация"}
				</Text>
			</View>

			<Input
				{...bindLogin}
				placeholder={"логин"}
				overStyle={styles.input}
				overStyleWrapp={{ marginBottom: 15 }}
			>
				<LoginSvg />
			</Input>
			<Input
				{...bindPassword}
				placeholder={"пароль"}
				secureTextEntry={true}
				overStyle={styles.input}
				overStyleWrapp={{ marginBottom: 15 }}
			>
				<PasswordSvg />
			</Input>

			{registerMode && (
				<Input
					{...bindPassword2}
					placeholder={"повторный пароль"}
					secureTextEntry={true}
					overStyle={styles.input}
					overStyleWrapp={{ marginBottom: 15 }}
				>
					<PasswordSvg />
				</Input>
			)}

			<Button
				overStyle={{ width: "100%", marginTop: 20 }}
				onPress={registerMode ? register : login}
			>
				<Text style={{ color: COLORS.BLACK }}>
					{registerMode ? "Зарегестрироваться" : "Войти"}
				</Text>
			</Button>

			{registerMode ? (
				<PressedBtn
					overStyle={styles.btnRegister}
					onPress={toAuth}
					colorPressed={"rgba(125, 156, 227, 0.1)"}
				>
					<Text style={{ color: COLORS.BLUE }}>Войти</Text>
				</PressedBtn>
			) : (
				<PressedBtn
					overStyle={styles.btnRegister}
					onPress={toRegister}
					colorPressed={"rgba(125, 156, 227, 0.1)"}
				>
					<Text style={{ color: COLORS.BLUE }}>Зарегестрироваться</Text>
				</PressedBtn>
			)}
		</View>
	)
})

export default Form

const styles = StyleSheet.create({
	form: {
		width: "70%",
		justifyContent: "center",
		alignItems: "center",
	},
	btnRegister: {
		width: "100%",
		marginTop: 10,
		padding: 7,
	},
	input: {
		// width: "50%",
		color: COLORS.GOLD,
		padding: 0,
		paddingLeft: 10,
	},
})
