import React, { useEffect, useState } from "react"
import { View, StyleSheet, TouchableOpacity } from "react-native"
import COLORS from "../../../services/colors"
import { WIDTH } from "../../../services/constants"
import ListAccaunts from "../../organisms/ListAccaunts"
import Icon from "react-native-vector-icons/Ionicons"
import MyModal from "../../organisms/Modal"
import { IItem } from "../../../services/types"
import FormItem from "../../molecules/FormItem"

const MainTemplate = () => {
	const [formItem, setFormItem] = useState<boolean | IItem>(false)

	useEffect(() => {}, [])

	return (
		<View style={styles.container}>
			<ListAccaunts setFormItem={setFormItem} />

			<View style={styles.btnWrapper}>
				<TouchableOpacity style={styles.btn} onPress={() => setFormItem(true)}>
					<Icon name={"add-circle"} size={66} color={COLORS.GOLD} />
				</TouchableOpacity>
			</View>

			<MyModal visible={!!formItem} close={() => setFormItem(false)}>
				<FormItem setFormItem={setFormItem} formItem={formItem} />
			</MyModal>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		height: "100%",
		paddingHorizontal: 10,
		position: "relative",
	},
	btnWrapper: {
		position: "absolute",
		width: WIDTH,
		height: 0,
		justifyContent: "center",
		alignItems: "center",
		bottom: 50,
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
