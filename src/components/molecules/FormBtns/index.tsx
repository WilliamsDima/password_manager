import React, { FC, memo } from "react"
import { StyleSheet, Text } from "react-native"
import COLORS from "../../../services/colors"
import Button from "../../atoms/Button/Button"
import { useNavigation } from "@react-navigation/native"
import { useActions } from "../../../hooks/useActions"
import { useAuth } from "../../../hooks/useAuth"
import { RoutesNames } from "../../../navigation/routes-names"
import { IUser } from "../../../services/types"
import PressedBtn from "../../atoms/PressedBtn"

type IBtns = {
	recoveryMode: boolean
	registerMode: boolean
	clearFilds: () => void
	resetPassword: () => void
	resetPassword2: () => void
	keyUser: string
	loginText: string
	password: string
	password2: string
	name: string
}

const FormBtns: FC<IBtns> = memo(
	({
		recoveryMode,
		registerMode,
		clearFilds,
		resetPassword,
		resetPassword2,
		keyUser,
		loginText,
		password,
		password2,
		name,
	}) => {
		const navigation = useNavigation()
		const { setError } = useActions()
		const { registerHandler, loginHandler, recoveryHandler } = useAuth()

		const toKeyGen = () => {
			navigation.navigate(RoutesNames.KeyGen as never)
			clearFilds()
		}

		const toAuth = () => {
			navigation.navigate(RoutesNames.Auth.AuthStack as never)
			clearFilds()
		}

		const toRegister = () => {
			navigation.navigate(RoutesNames.Auth.Register as never)
			clearFilds()
		}

		const toRecovery = () => {
			navigation.navigate(RoutesNames.Auth.Recovery as never)
			clearFilds()
		}

		const login = async () => {
			if (keyUser) {
				await loginHandler(loginText, password, keyUser)
				clearFilds()
			} else {
				setError("Ключ обязателен!")
			}
		}

		const recovery = async () => {
			await recoveryHandler(loginText)
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
		return (
			<>
				<Button
					overStyle={{ width: "100%", marginTop: 20 }}
					onPress={recoveryMode ? recovery : registerMode ? register : login}
				>
					<Text style={{ color: COLORS.BLACK }}>
						{recoveryMode
							? "Восстановить"
							: registerMode
							? "Зарегистрироваться"
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
							<Text style={{ color: COLORS.BLUE }}>Зарегистрироваться</Text>
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
			</>
		)
	}
)

export default FormBtns

const styles = StyleSheet.create({
	btnRegister: {
		width: "100%",
		marginTop: 10,
		padding: 7,
	},
})
