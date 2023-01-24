import React, { FC, useCallback, useEffect, useState } from "react"
import { Text, View, StyleSheet, Vibration, ToastAndroid } from "react-native"
import COLORS from "../../../services/colors"
import { START, USER_PIN } from "../../../services/constants"
import { getEncrypted, setEncrypted, setLocal } from "../../../api/asyncStorage"
import {
	useNavigation,
	CommonActions,
	useRoute,
} from "@react-navigation/native"
import { RoutesNames } from "../../../navigation/routes-names"
import PinInput from "../../molecules/PinInput"
import KeyboardNumber from "../../organisms/KeyboardNumber"
import { useAppSelector } from "../../../hooks/hooks"

type TPin = {}

const PinTemplate: FC<TPin> = ({}) => {
	const size = 4

	const [pin, setPin] = useState<number[]>([])
	const { user } = useAppSelector(store => store.main)
	const [error, setError] = useState(false)

	const navigation = useNavigation()
	const { params } = useRoute<any>()

	const [step, setStep] = useState(1)
	const [userPinLocal, setUserPinLocal] = useState<undefined | string>(
		undefined
	)
	const [userPin, setUserPin] = useState<undefined | string>(undefined)

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

	const checkUserPin = () => {
		const pinStr = pin.join("")
		console.log("pin", pinStr)

		if (!params?.createMode) {
			if (userPinLocal && userPinLocal === pinStr) {
				console.log("код верный!")
				clearHandler()
				toAuth()
			}

			if (userPinLocal && pinStr.length === size && userPinLocal !== pinStr) {
				console.log("код неверный!")
				clearHandler()
				setError(true)
				Vibration.vibrate()
			}
		} else {
			if (pinStr.length === size && step === 1) {
				setUserPin(pinStr)
				setStep(2)
				clearHandler()
				console.log("первый шаг !")
			}

			if (pinStr.length === size && step === 2 && pinStr === userPin) {
				setEncrypted(USER_PIN, pinStr)
				setLocal(START, true)
				setUserPin("")
				clearHandler()
				console.log("второй шаг - пароль создан !")
				toAuth()
			}

			if (pinStr.length === size && step === 2 && pinStr !== userPin) {
				Vibration.vibrate()
				setError(true)
				ToastAndroid.show("пароли не совпадают!", 2000)
				setUserPin("")
				setStep(1)
				clearHandler()
			}
		}
	}

	const getUserCodeHandler = async () => {
		const res = await getEncrypted(USER_PIN)
		setUserPinLocal(res)
		console.log("get UserCode local", res)
	}

	useEffect(() => {
		checkUserPin()

		if (!userPinLocal && !params?.createMode) {
			getUserCodeHandler()
		}
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
