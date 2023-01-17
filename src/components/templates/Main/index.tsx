import React, { useEffect } from "react"
import {
	View,
	Text,
	StyleSheet,
	StatusBar,
	TouchableOpacity,
} from "react-native"
import { useAppSelector } from "../../../hooks/hooks"
import { useAuth } from "../../../hooks/useAuth"
import COLORS from "../../../services/colors"
import { WIDTH } from "../../../services/constants"
import Button from "../../atoms/Button/Button"
import ListAccaunts from "../../organisms/ListAccaunts"
import Icon from "react-native-vector-icons/Ionicons"
import { useActions } from "../../../hooks/useActions"

const MainTemplate = () => {
	const { user } = useAppSelector(store => store.main)
	const { logoutHandler } = useAuth()
	const { addItem } = useActions()

	const addHandler = () => {
		const data = {
			id: +new Date(),
			title: `Title ${+new Date()}`,
		}

		addItem(data)
	}

	useEffect(() => {
		console.log("user", user)
	}, [])

	return (
		<View style={styles.container}>
			<StatusBar
				barStyle='light-content'
				hidden={false}
				backgroundColor={COLORS.MAIN}
				translucent={true}
			/>

			{/* <Button onPress={logoutHandler}>
				<Text>выйти</Text>
			</Button> */}

			<ListAccaunts />

			<View style={styles.btnWrapper}>
				<TouchableOpacity style={styles.btn} onPress={addHandler}>
					<Icon name={"add-circle"} size={66} color={COLORS.GOLD} />
				</TouchableOpacity>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		height: "100%",
		paddingHorizontal: 10,
		paddingVertical: 10,
		position: "relative",
	},
	btnWrapper: {
		position: "absolute",
		width: WIDTH,
		height: 0,
		justifyContent: "center",
		alignItems: "center",
		bottom: 100,
		left: 0,
		zIndex: 10,
		backgroundColor: "red",
	},
	btn: {
		height: 64,
		width: 60,
	},
})

export default MainTemplate
