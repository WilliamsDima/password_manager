import React, { FC, memo } from "react"
import { StyleSheet, TouchableOpacity } from "react-native"
import COLORS from "../../../services/colors"
import LoginSvg from "../../atoms/Icons/LoginSvg"
import PasswordSvg from "../../atoms/Icons/PasswordSvg"
import UserSvg from "../../atoms/Icons/UserSvg"
import Input from "../../atoms/Input/Input"
import IconDesign from "react-native-vector-icons/AntDesign"
import { useTranslation } from "react-i18next"

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
		const { t } = useTranslation()
		return (
			<>
				<Input
					{...bindLogin}
					placeholder={
						recoveryMode
							? "email"
							: registerMode
							? t("login_input_register")
							: t("login_input")
					}
					overStyle={styles.input}
					overStyleWrapp={{ marginBottom: 15 }}
				>
					<LoginSvg />
				</Input>

				{registerMode && (
					<Input
						{...bindName}
						placeholder={t("name_placeholder")}
						overStyle={styles.input}
						overStyleWrapp={{ marginBottom: 15 }}
					>
						<UserSvg style={{ marginLeft: -3, marginRight: 3 }} />
					</Input>
				)}

				{!recoveryMode && (
					<Input
						{...bindPassword}
						placeholder={t("password_placeholder")}
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
						placeholder={t("key_placeholder")}
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
						placeholder={t("repeat_password")}
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
