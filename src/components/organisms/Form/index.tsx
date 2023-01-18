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
import UserSvg from "../../atoms/Icons/UserSvg"
import { IUser } from "../../../services/types"
import IconDesign from "react-native-vector-icons/AntDesign"

type TForm = {
	registerMode?: boolean
	recoveryMode?: boolean
}

const Form: FC<TForm> = memo(
	({ registerMode = false, recoveryMode = false }) => {
		const { registerHandler, loginHandler, recoveryHandler } = useAuth()
		const { setError } = useActions()
		const navigation = useNavigation()

		const [loginText, bindLogin, resetLogin] = useInput("")
		const [key, bindKey, resetKey] = useInput("")
		const [name, bindName, resetName] = useInput("")
		const [password, bindPassword, resetPassword] = useInput("")
		const [password2, bindPassword2, resetPassword2] = useInput("")

		const clearFilds = () => {
			resetLogin()
			resetName()
			resetPassword()
			resetPassword2()
			resetKey()
		}

		const toRegister = () => {
			navigation.navigate(RoutesNames.Auth.Register as never)
			clearFilds()
		}

		const toRecovery = () => {
			navigation.navigate(RoutesNames.Auth.Recovery as never)
			clearFilds()
		}

		const toAuth = () => {
			navigation.navigate(RoutesNames.Auth.AuthStack as never)
			clearFilds()
		}

		const toKeyGen = () => {
			navigation.navigate(RoutesNames.KeyGen as never)
			clearFilds()
		}

		const register = async () => {
			if (!name.trim() || name.trim().length < 3) {
				setError("Имя должно состоять миниму из 3-х символов!")
				return
			}

			if (password === password2) {
				const user = {
					displayName: name,
				} as IUser

				await registerHandler(loginText, password, user)
				toKeyGen()
			} else {
				setError("Пароли не совпадают!")
				resetPassword()
				resetPassword2()
			}
		}

		const login = async () => {
			if (key) {
				await loginHandler(loginText, password, key)
				clearFilds()
			} else {
				setError("Ключ обязателен!")
			}
		}

		const recovery = async () => {
			await recoveryHandler(loginText)
			clearFilds()
		}
		return (
			<View style={styles.form}>
				<View style={{ marginBottom: 20 }}>
					<Text
						style={{
							color: COLORS.TITLE_COLOR,
							fontSize: 22,
							fontWeight: "700",
							textAlign: "center",
						}}
					>
						{recoveryMode
							? "Восстановление"
							: registerMode
							? "Зарегестрироваться"
							: "Авторизация"}
					</Text>

					{recoveryMode && (
						<Text
							style={{
								color: COLORS.TITLE_COLOR,
								fontSize: 14,
								fontWeight: "700",
								marginTop: 10,
								textAlign: "center",
							}}
						>
							Вам придёт письмо с инструкцией на почту, которую вы указали.
							Следуйте инструкции в письме.
						</Text>
					)}
				</View>

				<Input
					{...bindLogin}
					placeholder={
						recoveryMode
							? "email"
							: registerMode
							? "логин (существующая почта)"
							: "логин"
					}
					overStyle={styles.input}
					overStyleWrapp={{ marginBottom: 15 }}
				>
					<LoginSvg />
				</Input>

				{registerMode && (
					<Input
						{...bindName}
						placeholder={"имя"}
						overStyle={styles.input}
						overStyleWrapp={{ marginBottom: 15 }}
					>
						<UserSvg style={{ marginLeft: -3, marginRight: 3 }} />
					</Input>
				)}

				{!recoveryMode && (
					<Input
						{...bindPassword}
						placeholder={"пароль"}
						secureTextEntry={true}
						overStyle={styles.input}
						overStyleWrapp={{ marginBottom: 15 }}
					>
						<PasswordSvg />
					</Input>
				)}

				{!registerMode && !recoveryMode && (
					<Input
						{...bindKey}
						placeholder={"ключ"}
						overStyle={styles.input}
						overStyleWrapp={{ marginBottom: 15 }}
					>
						<IconDesign name={"qrcode"} size={24} color={COLORS.MAIN} />
					</Input>
				)}

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
					onPress={recoveryMode ? recovery : registerMode ? register : login}
				>
					<Text style={{ color: COLORS.BLACK }}>
						{recoveryMode
							? "Восстановить"
							: registerMode
							? "Зарегестрироваться"
							: "Войти"}
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
					<>
						<PressedBtn
							overStyle={styles.btnRegister}
							onPress={toRegister}
							colorPressed={"rgba(125, 156, 227, 0.1)"}
						>
							<Text style={{ color: COLORS.BLUE }}>Зарегестрироваться</Text>
						</PressedBtn>

						{!recoveryMode ? (
							<PressedBtn
								overStyle={styles.btnRegister}
								onPress={toRecovery}
								colorPressed={"rgba(226,234,255, 0.1)"}
							>
								<Text style={{ color: COLORS.TITLE_COLOR }}>Забыл пароль</Text>
							</PressedBtn>
						) : (
							<PressedBtn
								overStyle={styles.btnRegister}
								onPress={toAuth}
								colorPressed={"rgba(125, 156, 227, 0.1)"}
							>
								<Text style={{ color: COLORS.BLUE }}>Войти</Text>
							</PressedBtn>
						)}
					</>
				)}
			</View>
		)
	}
)

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
