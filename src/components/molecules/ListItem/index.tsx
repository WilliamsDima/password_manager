import React, { FC } from "react"
import { View, Text, StyleSheet } from "react-native"
import { Swipeable } from "react-native-gesture-handler"
import { useActions } from "../../../hooks/useActions"
import COLORS from "../../../services/colors"
import { WIDTH } from "../../../services/constants"
import { IItem } from "../../../services/types"
import { openLeft } from "./LeftBtn"
import { openRight } from "./RightBtn"

type TListItem = {
	item: IItem
}

const ListItem: FC<TListItem> = ({ item }) => {
	const { deleteItem } = useActions()

	const deleteHandler = () => {
		console.log("delete")
		// deleteItem(item.id)
	}

	const openHandler = () => {
		console.log("open")
		// deleteItem(item.id)
	}

	return (
		<Swipeable
			rightThreshold={WIDTH / 3}
			leftThreshold={WIDTH / 3}
			onSwipeableRightOpen={deleteHandler}
			onSwipeableLeftWillOpen={openHandler}
			overshootRight={false}
			overshootLeft={false}
			renderRightActions={openRight}
			renderLeftActions={openLeft}
		>
			<View style={styles.item}>
				<Text style={styles.title}>{item.title}</Text>
			</View>
		</Swipeable>
	)
}

const styles = StyleSheet.create({
	item: {
		backgroundColor: COLORS.ITEM_BG,
		padding: 15,
		marginVertical: 8,
		borderRadius: 5,
	},
	title: {
		color: COLORS.TITLE_COLOR,
		fontSize: 16,
	},
})

export default ListItem
