import { useState, useEffect } from "react"
import { NativeSyntheticEvent, TextInputChangeEventData } from "react-native"

export const useInput = (initialValue: any, useValidation: boolean = false) => {
	const [value, setValue] = useState(initialValue)
	const [error, setError] = useState(false)

	// const validateEmail = () => {
	// 	const reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/
	// 	console.log("validateEmail")

	// 	if (reg.test(value) === false) {
	// 		console.log("Email is Not Correct")
	// 		setError(true)
	// 		return false
	// 	} else {
	// 		setError(false)
	// 		console.log("Email is Correct")
	// 	}
	// }

	const reset = () => {
		setValue(initialValue)
	}

	const bind = {
		value,
		onChange: (event: NativeSyntheticEvent<TextInputChangeEventData>) => {
			setValue(event.nativeEvent.text)
		},
	}

	// useEffect(() => {
	// 	if (useValidation) validateEmail()
	// }, [])

	return [value, bind, reset, setValue]
}
