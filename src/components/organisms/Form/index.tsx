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

type TForm = {}

const Form: FC<TForm> = memo(() => {
	const { registerHandler, loginHandler } = useAuth()

	const [loginText, bindLogin, resetLogin] = useInput("")
	const [password, bindPassword, resetPassword] = useInput("")

	const register = async () => {
		await registerHandler(loginText, password)
		resetLogin()
		resetPassword()
	}

	const login = async () => {
		await loginHandler("oxpa@mail.ru", "samurai")
		resetLogin()
		resetPassword()
	}
	return (
		<View style={styles.form}>
			<View style={{ marginBottom: 20 }}>
				<Text
					style={{ color: COLORS.TITLE_COLOR, fontSize: 22, fontWeight: "700" }}
				>
					Авторизация
				</Text>
			</View>

			<Input
				{...bindLogin}
				placeholder={"логин"}
				overStyle={styles.input}
				overStyleWrapp={{ marginBottom: 10 }}
			>
				<LoginSvg />
			</Input>
			<Input
				{...bindPassword}
				placeholder={"пароль"}
				secureTextEntry={true}
				overStyle={styles.input}
			>
				<PasswordSvg />
			</Input>

			<Button overStyle={{ width: "100%", marginTop: 20 }} onPress={login}>
				<Text style={{ color: COLORS.BLACK }}>Войти</Text>
			</Button>
			<PressedBtn
				overStyle={styles.btnRegister}
				onPress={register}
				colorPressed={"rgba(125, 156, 227, 0.1)"}
			>
				<Text style={{ color: COLORS.BLUE }}>Зарегестрироваться</Text>
			</PressedBtn>
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
	},
})
