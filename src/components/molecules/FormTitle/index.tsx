import React, { FC, memo } from "react"
import { StyleSheet, View, Text } from "react-native"
import COLORS from "../../../services/colors"

interface ITitle {
	recoveryMode: boolean
	registerMode: boolean
}

const FormTitle: FC<ITitle> = memo(({ recoveryMode, registerMode }) => {
	return (
		<View style={{ marginBottom: 20 }}>
			<Text style={styles.title}>
				{recoveryMode
					? "Сброс пароля"
					: registerMode
					? "Зарегистрироваться"
					: "Авторизация"}
			</Text>

			{recoveryMode && (
				<Text style={styles.text}>
					Вам придёт письмо с инструкцией на почту, которую вы указали. Следуйте
					инструкции в письме.
				</Text>
			)}
		</View>
	)
})

export default FormTitle

const styles = StyleSheet.create({
	title: {
		color: COLORS.TITLE_COLOR,
		fontSize: 22,
		fontWeight: "700",
		textAlign: "center",
	},
	text: {
		color: COLORS.TITLE_COLOR,
		fontSize: 14,
		fontWeight: "700",
		marginTop: 10,
		textAlign: "center",
	},
})
