import React, { FC } from "react"
import {
	View,
	StyleSheet,
	ViewStyle,
	Text,
	TouchableOpacity,
} from "react-native"
import { useActions } from "../../../hooks/useActions"
import COLORS from "../../../services/colors"
import { IMessage } from "../../../services/types"

type TErrorMessage = {
	overStyle?: ViewStyle
	message: IMessage | null
}

const ErrorMessage: FC<TErrorMessage> = React.memo(({ overStyle, message }) => {
	const { setMessage } = useActions()
	const closeHandler = () => {
		message?.callback && message?.callback()
		setMessage(null)
	}
	return (
		<TouchableOpacity
			activeOpacity={1}
			style={[styles.wrapp, { ...overStyle }]}
		>
			<Text
				style={{
					color: COLORS.RED,
					fontSize: 18,
					marginBottom: 10,
					fontWeight: "700",
				}}
			>
				{message?.title}
			</Text>
			<Text style={{ color: COLORS.BLACK, marginBottom: 20 }}>
				{message?.message}
			</Text>

			<View style={styles.btnWrapper}>
				<TouchableOpacity onPress={closeHandler}>
					<Text style={{ color: COLORS.MAIN, fontSize: 18 }}>ok</Text>
				</TouchableOpacity>
			</View>
		</TouchableOpacity>
	)
})

export default ErrorMessage

const styles = StyleSheet.create({
	btnWrapper: {
		width: "100%",
		alignItems: "flex-end",
	},
	wrapp: {
		width: "70%",
		padding: 10,
		borderRadius: 5,
		backgroundColor: COLORS.WHITE,
	},
})
