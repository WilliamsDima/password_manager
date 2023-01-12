import React from "react"
import { ScrollView, Text } from "react-native"
import { useAuth } from "../../../hooks/useAuth"
import Button from "../../atoms/Button/Button"
import { styles } from "./main.styles"

const MainTemplate = () => {
	const { logoutHandler } = useAuth()

	return (
		<ScrollView style={styles.container}>
			<Button onPress={logoutHandler}>
				<Text>выйти</Text>
			</Button>
		</ScrollView>
	)
}

export default MainTemplate
