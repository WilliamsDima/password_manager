import React, { FC, memo, useEffect } from "react"
import { View, StyleSheet } from "react-native"
import { useInput } from "../../../hooks/useInput"

import { useAppSelector } from "../../../hooks/hooks"
import FormTitle from "../../molecules/FormTitle"
import FormFilds from "../../molecules/FormFilds"
import FormBtns from "../../molecules/FormBtns"

type TForm = {
	registerMode?: boolean
	recoveryMode?: boolean
	recoveryProfile?: boolean
	setCamera?: (value: boolean) => void
}

const Form: FC<TForm> = memo(
	({
		registerMode = false,
		recoveryMode = false,
		recoveryProfile = false,
		setCamera,
	}) => {
		const { key: keyStore, user } = useAppSelector(store => store.main)

		const [loginText, bindLogin, resetLogin] = useInput(
			user?.email || "test@mail.ru"
		)
		const [key, bindKey, resetKey, setKey] = useInput(keyStore)
		const [name, bindName, resetName] = useInput("Dmitry")
		const [password, bindPassword, resetPassword] = useInput("123456789")
		const [password2, bindPassword2, resetPassword2] = useInput("123456789")

		const clearFilds = () => {
			resetLogin()
			resetName()
			resetPassword()
			resetPassword2()
			resetKey()
		}

		useEffect(() => {
			if (keyStore && !key) {
				setKey(keyStore)
			}
		}, [keyStore])
		return (
			<View style={styles.form}>
				<FormTitle recoveryMode={recoveryMode} registerMode={registerMode} />

				<FormFilds
					bindKey={bindKey}
					bindLogin={bindLogin}
					bindName={bindName}
					bindPassword={bindPassword}
					bindPassword2={bindPassword2}
					recoveryMode={recoveryMode}
					registerMode={registerMode}
					setCamera={setCamera}
				/>

				<FormBtns
					clearFilds={clearFilds}
					loginText={loginText}
					name={name}
					password={password}
					password2={password2}
					recoveryMode={recoveryMode}
					registerMode={registerMode}
					resetPassword={resetPassword}
					resetPassword2={resetPassword2}
					keyUser={key}
					recoveryProfile={recoveryProfile}
				/>
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
})
