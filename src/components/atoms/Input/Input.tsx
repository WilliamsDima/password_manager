import React, { FC, ReactNode, useState, memo } from "react"
import {
	TouchableOpacity,
	StyleSheet,
	View,
	ViewStyle,
	TextInput,
} from "react-native"
import COLORS from "../../../services/colors"
import EyeCloseSvg from "../Icons/EyeCloseSvg"
import EyeOpenSvg from "../Icons/EyeOpenSvg"

interface IInput extends TextInput {
	overStyle?: ViewStyle
	overStyleWrapp?: ViewStyle
	children?: ReactNode
	placeholder: string
	secureTextEntry?: boolean
	value: string
	onChange: () => void
	error?: boolean
}

const Input: FC<IInput> = memo(props => {
	const {
		overStyle,
		placeholder,
		secureTextEntry = false,
		value,
		onChange,
		children,
		overStyleWrapp,
		error,
	} = props

	const [showPassword, setShowPassword] = useState(false)
	return (
		<View
			style={[
				styles.wrapp,
				error && { borderBottomColor: COLORS.RED },
				{ ...overStyleWrapp },
			]}
		>
			{children}
			<TextInput
				style={[styles.input, { ...overStyle }]}
				placeholder={placeholder}
				secureTextEntry={!showPassword && secureTextEntry}
				value={value}
				placeholderTextColor={COLORS.GRAY}
				onChange={onChange}
				autoCapitalize={"none"}
			/>

			{secureTextEntry && (
				<TouchableOpacity
					style={styles.btnEye}
					onPress={() => setShowPassword(!showPassword)}
				>
					{showPassword ? <EyeOpenSvg /> : <EyeCloseSvg />}
				</TouchableOpacity>
			)}
		</View>
	)
})

export default Input

const styles = StyleSheet.create({
	btnEye: {
		position: "absolute",
		right: 0,
	},
	wrapp: {
		position: "relative",
		width: "100%",
		borderBottomWidth: 1,
		borderBottomColor: COLORS.GRAY,
		flexDirection: "row",
		alignItems: "center",
		overflow: "hidden",
	},
	input: {
		width: "100%",
	},
})
