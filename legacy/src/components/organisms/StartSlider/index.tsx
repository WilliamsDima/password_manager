import React, { FC, memo, useRef, useState } from "react"
import { View, StyleSheet, ScrollView, Text } from "react-native"
import COLORS from "../../../services/colors"
import { WIDTH } from "../../../services/constants"
import PressedBtn from "../../atoms/PressedBtn"
import SliderIndicators from "../../molecules/SliderIndicators"
import SliderItem from "../../molecules/SliderItem"
import { useNavigation } from "@react-navigation/native"
import { RoutesNames } from "../../../navigation/routes-names"
import { useTranslation } from "react-i18next"

type TStartSlider = {}

const StartSlider: FC<TStartSlider> = memo(() => {
	const { t } = useTranslation()
	const navigation = useNavigation()

	const toPin = () => {
		navigation.navigate(RoutesNames.Pin as never, { createMode: true } as never)
	}

	const sliders = [
		{
			text: t("slide_1"),
			source: require("../../../assets/images/technology.png"),
		},
		{
			text: t("slide_2"),
			source: require("../../../assets/images/slide2.png"),
		},
		{
			text: t("slide_3"),
			source: require("../../../assets/images/pin.png"),
			btn: (
				<PressedBtn overStyle={{ marginTop: 20 }} onPress={toPin}>
					<Text style={{ color: COLORS.MAIN, fontSize: 16 }}>
						{t("create")}
					</Text>
				</PressedBtn>
			),
		},
	]

	const scrollRef = useRef<any>()

	const [idx, setIndx] = useState(0)

	const setActiveHandler = (index: number) => {
		scrollRef?.current?.scrollTo({ x: WIDTH * index, y: 0, animated: true })
		setIndx(index)
	}

	const onChange = ({ nativeEvent }) => {
		const active = Math.floor(
			nativeEvent.contentOffset.x / nativeEvent.layoutMeasurement.width
		)
		setIndx(active)
	}

	return (
		<View>
			<ScrollView
				ref={scrollRef}
				style={[{ height: 400 }]}
				pagingEnabled={true}
				horizontal={true}
				onMomentumScrollEnd={onChange}
				showsHorizontalScrollIndicator={false}
				decelerationRate='fast'
			>
				{sliders.map((item, i) => {
					return (
						<SliderItem key={i} {...item}>
							{item.btn && item.btn}
						</SliderItem>
					)
				})}
			</ScrollView>

			<SliderIndicators
				setActive={setActiveHandler}
				length={sliders.length}
				idx={idx}
			/>
		</View>
	)
})

export default StartSlider

const styles = StyleSheet.create({})
