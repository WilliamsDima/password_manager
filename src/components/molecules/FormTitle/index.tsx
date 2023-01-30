import React, { FC, memo } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View, Text } from "react-native"
import COLORS from "../../../services/colors"

interface ITitle {
	recoveryMode: boolean
	registerMode: boolean
}

const FormTitle: FC<ITitle> = memo(({ recoveryMode, registerMode }) => {
	const { t } = useTranslation()
	return (
		<View style={{ marginBottom: 20 }}>
			<Text style={styles.title}>
				{recoveryMode
					? t("recovery")
					: registerMode
					? t("register_btn")
					: t("auth_btn")}
			</Text>

			{recoveryMode && <Text style={styles.text}>{t("form_text_email")}</Text>}
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
