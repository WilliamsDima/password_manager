import React from "react"
import { View, StyleSheet, Text } from "react-native"
import { useAuth } from "../../../hooks/useAuth"
import Button from "../../atoms/Button/Button"

const ProfileTemplate = () => {
	const { logoutHandler } = useAuth()
	return (
		<View style={styles.container}>
			<Button onPress={logoutHandler}>
				<Text>выйти</Text>
			</Button>
			<Text>ProfileTemplate</Text>
		</View>
	)
}
export default ProfileTemplate

const styles = StyleSheet.create({
	container: {
		width: "100%",
		height: "100%",
	},
})
