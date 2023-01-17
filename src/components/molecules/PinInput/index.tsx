import React, { FC, memo, useRef, useEffect } from "react"
import { StyleSheet, View, Animated, Easing } from "react-native"
import CircleInput from "../../atoms/CircleInput"

interface IInput {
	size?: number
	numbers: number[]
	error: boolean
	setError: (value: boolean) => void
}

const PinInput: FC<IInput> = memo(({ numbers, size = 4, error, setError }) => {
	const sizePin = Array(size).fill("circle")

	const shake = useRef(new Animated.Value(0.5)).current

	const translateXAnim = shake.interpolate({
		inputRange: [0, 1],
		outputRange: [error ? -5 : -10, error ? 5 : 10],
	})

	const getAnimationStyles = () => ({
		transform: [
			{
				translateX: translateXAnim,
			},
		],
	})

	const stopAnimation = () => {
		shake.stopAnimation()
	}

	const runAnimation = () => {
		Animated.sequence([
			Animated.timing(shake, {
				delay: 50,
				toValue: 1,
				duration: error ? 100 : 50,
				easing: Easing.out(Easing.sin),
				useNativeDriver: true,
			}),
			Animated.timing(shake, {
				toValue: 0,
				duration: error ? 50 : 25,
				easing: Easing.out(Easing.sin),
				useNativeDriver: true,
			}),
			Animated.timing(shake, {
				toValue: 1,
				duration: error ? 50 : 25,
				easing: Easing.out(Easing.sin),
				useNativeDriver: true,
			}),
			Animated.timing(shake, {
				toValue: 0,
				duration: error ? 50 : 25,
				easing: Easing.out(Easing.sin),
				useNativeDriver: true,
			}),
			Animated.timing(shake, {
				toValue: 0.5,
				duration: error ? 100 : 50,
				easing: Easing.out(Easing.sin),
				useNativeDriver: true,
			}),
		]).start(() => {
			console.log("runAnimation", error)

			if (error) stopAnimation()
			setError(false)
		})
	}

	useEffect(() => {
		if (error) {
			runAnimation()
		}
	}, [error])

	return (
		<Animated.View style={[getAnimationStyles(), styles.wrapp]}>
			<View style={styles.pinsBlock}>
				{sizePin.map((item, i) => {
					return <CircleInput key={i} number={numbers[i]} />
				})}
			</View>
		</Animated.View>
	)
})

export default PinInput

const styles = StyleSheet.create({
	wrapp: {
		width: "100%",
		alignItems: "center",
		justifyContent: "center",
	},
	pinsBlock: {
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
	},
})
