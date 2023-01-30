import React, { FC } from "react"
import { View, StyleSheet, Text } from "react-native"
import COLORS from "../../../services/colors"
import Icon from "react-native-vector-icons/AntDesign"
import PressedBtn from "../../atoms/PressedBtn"
import { useTranslation } from "react-i18next"

type TSliderIndicator = {
	idx: number
	length: number
	setActive: (idx: number) => void
}

const SliderIndicators: FC<TSliderIndicator> = ({ length, idx, setActive }) => {
	const { t } = useTranslation()
	const count = Array(length).fill("dot")

	const activePrevHandler = () => {
		if (idx > 0) setActive(idx - 1)
	}

	const activeNextHandler = () => {
		if (idx >= 0 && length - 1 >= idx) setActive(idx + 1)
	}

	return (
		<View style={styles.container}>
			<PressedBtn disabled={idx === 0} onPress={activePrevHandler}>
				<>
					<Icon
						name={"left"}
						size={10}
						color={idx === 0 ? "transparent" : COLORS.MAIN}
					/>
					<Text
						style={{
							color: idx === 0 ? "transparent" : COLORS.MAIN,
							marginLeft: 10,
							marginBottom: 2,
						}}
					>
						{t("back")}
					</Text>
				</>
			</PressedBtn>

			<View style={styles.dots}>
				{count.map((item, i) => {
					return (
						<View
							style={[
								styles.dot,
								{
									backgroundColor: i === idx ? COLORS.MAIN : "transparent",
									borderColor: i === idx ? COLORS.MAIN : COLORS.GRAY,
								},
							]}
							key={i}
						/>
					)
				})}
			</View>

			<PressedBtn disabled={length - 1 === idx} onPress={activeNextHandler}>
				<>
					<Text
						style={{
							color: length - 1 === idx ? "transparent" : COLORS.MAIN,
							marginRight: 10,
							marginBottom: 2,
						}}
					>
						далее
					</Text>
					<Icon
						name={"right"}
						size={10}
						color={length - 1 === idx ? "transparent" : COLORS.MAIN}
					/>
				</>
			</PressedBtn>
		</View>
	)
}

export default SliderIndicators

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 40,
		paddingHorizontal: 20,
	},
	dots: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
	},
	dot: {
		width: 10,
		height: 10,
		marginHorizontal: 5,
		borderRadius: 5,
		borderWidth: 1,
		borderColor: COLORS.GRAY,
	},
})
