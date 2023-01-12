import React, { FC, useEffect, useRef, useState } from "react"
import { Text, View, StyleSheet, Vibration, ToastAndroid } from "react-native"
import ReactNativePinView from "react-native-pin-view"
import COLORS from "../../../services/colors"
import { HEIGHT, USER_PIN } from "../../../services/constants"
import IconIon from "react-native-vector-icons/Ionicons"
import IconEntypo from "react-native-vector-icons/Entypo"
import { getEncrypted, setEncrypted } from "../../../api/asyncStorage"
import {
	useNavigation,
	CommonActions,
	useRoute,
} from "@react-navigation/native"
import { RoutesNames } from "../../../navigation/routes-names"

type TPin = {}

const PinTemplate: FC<TPin> = ({}) => {
	const pinView = useRef<any>(null)
	const navigation = useNavigation()
	const { params } = useRoute<any>()

	const pinLength = 4

	const [step, setStep] = useState(1)
	const [userPin, setUserPin] = useState("")

	const [showButton, setShowButton] = useState(false)
	const [enteredPin, setEnteredPin] = useState("")
	const [userCode, setUserCode] = useState<undefined | string>(undefined)

	const changePinHandler = (value: string) => {
		setEnteredPin(value)
	}

	const onButtonPressHandler = (key: string) => {
		if (key === "custom_left") {
			pinView?.current?.clear()
		}
		if (key === "custom_right") {
			pinView?.current?.clearAll()
		}
	}

	const toAuth = () => {
		pinView?.current?.clearAll()
		navigation.navigate(RoutesNames.Auth.AuthStack as never)
		navigation.dispatch(
			CommonActions.reset({
				index: 1,
				routes: [{ name: RoutesNames.Auth.AuthStack }],
			})
		)
	}

	const checkUserPin = () => {
		// console.log("pin", userCode === enteredPin)

		if (enteredPin.length === pinLength && step === 1) {
			setUserPin(enteredPin)
			setStep(2)
			pinView?.current?.clearAll()
		} else if (userPin && userPin === enteredPin) {
			// console.log("пароль создан!", userPin)
			setUserPin("")
			toAuth()
		}

		if (
			userPin.length === pinLength &&
			enteredPin.length === pinLength &&
			userPin !== enteredPin &&
			step === 2
		) {
			Vibration.vibrate()
			ToastAndroid.show("пароли не совпадают!", 2000)
			setUserPin("")
			setStep(1)
			pinView?.current?.clearAll()
		}

		if (userCode === enteredPin && !params?.createMode) {
			toAuth()
		}
	}

	const getUserCodeHandler = async () => {
		const res = await getEncrypted(USER_PIN)
		setUserCode(res)
		// console.log("getUserCodeHandler", res)
	}

	const setUserCodeHandler = () => {
		setEncrypted(USER_PIN, "1828")
	}

	useEffect(() => {
		setUserCodeHandler()

		checkUserPin()

		if (!userCode) {
			getUserCodeHandler()
		}

		if (enteredPin.length > 0) {
			setShowButton(true)
		} else {
			setShowButton(false)
		}
	}, [enteredPin])

	return (
		<View style={[styles.container]}>
			<Text style={styles.title}>PIN</Text>
			{params?.createMode && (
				<Text style={styles.text}>
					{step === 1 ? "придумайте пароль" : "повторите пароль"}
				</Text>
			)}
			<ReactNativePinView
				style={{ height: "100%" }}
				inputSize={42}
				ref={pinView}
				pinLength={pinLength}
				buttonSize={60}
				onValueChange={changePinHandler}
				buttonAreaStyle={{
					marginTop: 24,
				}}
				inputAreaStyle={{
					marginBottom: 24,
				}}
				inputViewEmptyStyle={styles.inputViewEmptyStyle}
				inputViewFilledStyle={{
					backgroundColor: COLORS.MAIN,
				}}
				buttonViewStyle={{
					borderWidth: 1,
					borderColor: COLORS.WHITE,
				}}
				buttonTextStyle={{
					color: COLORS.WHITE,
				}}
				onButtonPress={onButtonPressHandler}
				customLeftButton={
					showButton ? (
						<IconIon name={"ios-backspace"} size={46} color={COLORS.WHITE} />
					) : undefined
				}
				customRightButton={
					showButton ? (
						<IconEntypo name={"cross"} size={56} color={COLORS.WHITE} />
					) : undefined
				}
			/>
		</View>
	)
}
export default PinTemplate

const styles = StyleSheet.create({
	container: {
		// flex: 1,
		width: "100%",
		height: HEIGHT,
		marginTop: HEIGHT / 3.5,
		justifyContent: "center",
		alignItems: "center",
	},
	title: {
		paddingTop: 0,
		paddingBottom: 20,
		color: COLORS.BLUE,
		fontSize: 48,
		textAlign: "center",
	},
	text: {
		paddingTop: 0,
		paddingBottom: 48,
		color: COLORS.TITLE_COLOR,
		fontSize: 18,
		textAlign: "center",
	},
	inputViewEmptyStyle: {
		backgroundColor: "transparent",
		borderWidth: 1,
		borderColor: COLORS.WHITE,
	},
})
