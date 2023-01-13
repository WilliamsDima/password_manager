import React, { FC, memo, useCallback } from "react"
import { View, StyleSheet, Text, TouchableOpacity } from "react-native"
import COLORS from "../../../services/colors"
import PressedBtn from "../../atoms/PressedBtn"
import IconIon from "react-native-vector-icons/Ionicons"
import IconEntypo from "react-native-vector-icons/Entypo"

type TKeyboard = {
	numbers: number[]
	onChange: (number: number | number[]) => void
	clear: () => void
	size: number
}

const KeyboardNumber: FC<TKeyboard> = memo(
	({ numbers, size, onChange, clear }) => {
		const disabled = numbers.length === size

		const deleteNumberHandler = useCallback(() => {
			const nums = numbers.splice(0, numbers.length - 1)
			onChange(nums)
		}, [numbers])

		return (
			<View style={styles.keyboard}>
				<View style={styles.row}>
					<PressedBtn
						disabled={disabled}
						onPress={() => onChange(1)}
						overStyle={styles.btn}
						colorPressed={"rgba(255,255,255, 0.1)"}
					>
						<Text style={styles.textBtn}>1</Text>
					</PressedBtn>
					<PressedBtn
						disabled={disabled}
						onPress={() => onChange(2)}
						overStyle={styles.btn}
						colorPressed={"rgba(255,255,255, 0.1)"}
					>
						<Text style={styles.textBtn}>2</Text>
					</PressedBtn>
					<PressedBtn
						disabled={disabled}
						onPress={() => onChange(3)}
						overStyle={styles.btn}
						colorPressed={"rgba(255,255,255, 0.1)"}
					>
						<Text style={styles.textBtn}>3</Text>
					</PressedBtn>
				</View>

				<View style={styles.row}>
					<PressedBtn
						disabled={disabled}
						onPress={() => onChange(4)}
						overStyle={styles.btn}
						colorPressed={"rgba(255,255,255, 0.1)"}
					>
						<Text style={styles.textBtn}>4</Text>
					</PressedBtn>
					<PressedBtn
						disabled={disabled}
						onPress={() => onChange(5)}
						overStyle={styles.btn}
						colorPressed={"rgba(255,255,255, 0.1)"}
					>
						<Text style={styles.textBtn}>5</Text>
					</PressedBtn>
					<PressedBtn
						disabled={disabled}
						onPress={() => onChange(6)}
						overStyle={styles.btn}
						colorPressed={"rgba(255,255,255, 0.1)"}
					>
						<Text style={styles.textBtn}>6</Text>
					</PressedBtn>
				</View>

				<View style={styles.row}>
					<PressedBtn
						disabled={disabled}
						onPress={() => onChange(7)}
						overStyle={styles.btn}
						colorPressed={"rgba(255,255,255, 0.1)"}
					>
						<Text style={styles.textBtn}>7</Text>
					</PressedBtn>
					<PressedBtn
						disabled={disabled}
						onPress={() => onChange(8)}
						overStyle={styles.btn}
						colorPressed={"rgba(255,255,255, 0.1)"}
					>
						<Text style={styles.textBtn}>8</Text>
					</PressedBtn>
					<PressedBtn
						disabled={disabled}
						onPress={() => onChange(9)}
						overStyle={styles.btn}
						colorPressed={"rgba(255,255,255, 0.1)"}
					>
						<Text style={styles.textBtn}>9</Text>
					</PressedBtn>
				</View>

				<View style={styles.row}>
					<TouchableOpacity
						disabled={!numbers.length}
						onPress={deleteNumberHandler}
						style={[styles.btn, { borderWidth: 0 }]}
					>
						<IconIon
							name={"ios-backspace"}
							style={!numbers.length && { opacity: 0 }}
							size={46}
							color={COLORS.WHITE}
						/>
					</TouchableOpacity>
					<PressedBtn
						disabled={disabled}
						onPress={() => onChange(0)}
						overStyle={styles.btn}
						colorPressed={"rgba(255,255,255, 0.1)"}
					>
						<Text style={styles.textBtn}>0</Text>
					</PressedBtn>
					<TouchableOpacity
						disabled={!numbers.length}
						onPress={clear}
						style={[styles.btn, { borderWidth: 0 }]}
					>
						<IconEntypo
							style={!numbers.length && { opacity: 0 }}
							name={"cross"}
							size={56}
							color={COLORS.WHITE}
						/>
					</TouchableOpacity>
				</View>
			</View>
		)
	}
)

export default KeyboardNumber

const styles = StyleSheet.create({
	keyboard: {
		marginTop: 40,
		width: "100%",
		justifyContent: "center",
		alignItems: "center",
	},
	row: {
		width: "100%",
		justifyContent: "center",
		alignItems: "center",
		flexDirection: "row",
		marginBottom: 20,
	},
	textBtn: {
		color: COLORS.WHITE,
		fontSize: 22,
		fontWeight: "700",
	},
	btn: {
		width: 70,
		height: 70,
		borderRadius: 35,
		borderWidth: 1,
		justifyContent: "center",
		alignItems: "center",
		borderColor: COLORS.GRAY,
		marginHorizontal: 20,
	},
})
