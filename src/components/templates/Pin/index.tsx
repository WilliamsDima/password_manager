import React, { FC, useCallback, useEffect, useState } from "react"
import {
	Text,
	View,
	StyleSheet,
	Vibration,
	ToastAndroid,
	TouchableOpacity,
} from "react-native"
import COLORS from "../../../services/colors"
import {
	useNavigation,
	CommonActions,
	useRoute,
} from "@react-navigation/native"
import { RoutesNames } from "../../../navigation/routes-names"
import PinInput from "../../molecules/PinInput"
import KeyboardNumber from "../../organisms/KeyboardNumber"
import { useAppSelector } from "../../../hooks/hooks"
import { useActions } from "../../../hooks/useActions"

type TPin = {
	setVisible: (value: boolean) => void
}

const PinTemplate: FC<TPin> = ({ setVisible }) => {
	const size = 4

	const { params } = useRoute<any>()

	const { user, pin: pinStore } = useAppSelector(store => store.main)
	const [pin, setPin] = useState<number[]>([])
	const { setPin: setPinAC } = useActions()
	const [error, setError] = useState(false)

	const navigation = useNavigation()

	const [step, setStep] = useState(1)
	const [userPin, setUserPin] = useState<undefined | string>(undefined)

	const setPinHandler = useCallback(
		(value: number | number[]) => {
			if (Array.isArray(value)) {
				setPin(value)
			} else {
				if (pin.length !== size) {
					setPin([...pin, value])
				}
			}
		},
		[pin]
	)

	const clearHandler = useCallback(() => {
		setPinHandler([])
	}, [])

	const errorHandler = () => {
		Vibration.vibrate()
		setError(true)
		clearHandler()
		ToastAndroid.show("пароли не совпадают!", 2000)
	}

	const canselHandler = () => {
		setUserPin(undefined)
		setStep(1)
		clearHandler()
		navigation.goBack()
		setVisible(false)
	}

	const toAuth = () => {
		clearHandler()

		if (user) {
			navigation.navigate(RoutesNames.Main.HomeStack as never)
			navigation.dispatch(
				CommonActions.reset({
					index: 1,
					routes: [{ name: RoutesNames.Main.HomeStack }],
				})
			)
			if (params?.settingsMode) {
				navigation.goBack()
				setVisible(false)
			}
		} else {
			navigation.navigate(RoutesNames.Auth.AuthStack as never)
			navigation.dispatch(
				CommonActions.reset({
					index: 1,
					routes: [{ name: RoutesNames.Auth.AuthStack }],
				})
			)
		}
	}

	const checkUserPin = () => {
		const pinStr = pin.join("")
		// console.log("pin", pinStr)

		if (!params?.createMode) {
			if (pinStore && pinStore === pinStr) {
				console.log("код верный!")
				clearHandler()
				toAuth()
			}

			if (pinStore && pinStr.length === size && pinStore !== pinStr) {
				// console.log("код неверный!")
				errorHandler()
			}
		} else {
			if (pinStr.length === size && step === 1) {
				setUserPin(pinStr)
				setStep(2)
				clearHandler()
				// console.log("первый шаг !")
			}

			if (pinStr.length === size && step === 2 && pinStr === userPin) {
				setPinAC(pinStr)
				setUserPin("")
				clearHandler()
				// console.log("второй шаг - пароль создан !")
				toAuth()
			}

			if (pinStr.length === size && step === 2 && pinStr !== userPin) {
				errorHandler()
				setUserPin("")
				setStep(1)
			}
		}
	}

	useEffect(() => {
		checkUserPin()
	}, [pin])

	return (
		<View style={[styles.container]}>
			<Text style={styles.title}>PIN</Text>
			{params?.createMode && (
				<Text style={styles.text}>
					{step === 1 ? "придумайте пароль" : "повторите пароль"}
				</Text>
			)}
			<PinInput numbers={pin} size={size} error={error} setError={setError} />
			<KeyboardNumber
				clear={clearHandler}
				numbers={pin}
				onChange={setPinHandler}
				size={size}
			/>

			{params?.settingsMode && (
				<TouchableOpacity onPress={canselHandler}>
					<Text style={styles.text}>отмена</Text>
				</TouchableOpacity>
			)}
		</View>
	)
}
export default PinTemplate

const styles = StyleSheet.create({
	container: {
		width: "100%",
		height: "100%",
		backgroundColor: COLORS.BG_DARK,
		justifyContent: "center",
		alignItems: "center",
	},
	text: {
		color: COLORS.TITLE_COLOR,
		fontSize: 18,
		marginBottom: 20,
	},
	title: {
		color: COLORS.BLUE,
		fontSize: 42,
		marginBottom: 40,
	},
})
