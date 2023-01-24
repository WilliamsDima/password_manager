import React, { FC, memo } from "react"
import { StyleSheet, TouchableOpacity } from "react-native"
import COLORS from "../../../services/colors"
import LoginSvg from "../../atoms/Icons/LoginSvg"
import PasswordSvg from "../../atoms/Icons/PasswordSvg"
import UserSvg from "../../atoms/Icons/UserSvg"
import Input from "../../atoms/Input/Input"
import IconDesign from "react-native-vector-icons/AntDesign"

interface IFilds {
	recoveryMode: boolean
	registerMode: boolean
	bindLogin: any
	bindName: any
	bindPassword: any
	bindPassword2: any
	bindKey: any
	setCamera?: (value: boolean) => void
}

const FormFilds: FC<IFilds> = memo(
	({
		bindLogin,
		recoveryMode,
		registerMode,
		bindName,
		bindPassword,
		bindPassword2,
		bindKey,
		setCamera,
	}) => {
		return (
			<>
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
						<TouchableOpacity onPress={() => setCamera && setCamera(true)}>
							<IconDesign name={"qrcode"} size={24} color={COLORS.MAIN} />
						</TouchableOpacity>
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
			</>
		)
	}
)

export default FormFilds

const styles = StyleSheet.create({
	input: {
		// width: "50%",
		color: COLORS.GOLD,
		padding: 0,
		paddingLeft: 10,
	},
})
