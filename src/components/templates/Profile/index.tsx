import React from "react"
import { View, StyleSheet, Text } from "react-native"
import { useAppSelector } from "../../../hooks/hooks"
import { useAuth } from "../../../hooks/useAuth"
import Button from "../../atoms/Button/Button"

const ProfileTemplate = () => {
	const { logoutHandler, deleteUserHandler } = useAuth()
	const { user } = useAppSelector(store => store.main)
	return (
		<View style={styles.container}>
			<Button overStyle={{ marginTop: 10 }} onPress={logoutHandler}>
				<Text>выйти</Text>
			</Button>
			<Button
				overStyle={{ marginTop: 10 }}
				onPress={() => user && deleteUserHandler(user?.id)}
			>
				<Text>Удалить аккаунт</Text>
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
