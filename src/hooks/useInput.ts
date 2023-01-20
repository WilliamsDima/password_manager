import { useState } from "react"
import { NativeSyntheticEvent, TextInputChangeEventData } from "react-native"

export const useInput = (initialValue: any) => {
	const [value, setValue] = useState(initialValue)

	const reset = () => {
		setValue(initialValue)
	}

	const bind = {
		value,
		onChange: (event: NativeSyntheticEvent<TextInputChangeEventData>) => {
			setValue(event.nativeEvent.text)
		},
	}

	return [value, bind, reset, setValue]
}
