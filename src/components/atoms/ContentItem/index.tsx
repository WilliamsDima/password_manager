import React, { FC, memo } from "react"
import { View, StyleSheet, TouchableOpacity, Text } from "react-native"
import { IItemContent } from "../../../services/types"

type TContent = {
	toggleListItem: () => void
	hidden: boolean
	data: IItemContent | null
}

const ContentItem: FC<TContent> = memo(({ data, toggleListItem, hidden }) => {
	return (
		<TouchableOpacity
			onPress={toggleListItem}
			style={[styles.showBlock, hidden && styles.hide]}
		>
			{hidden ? (
				<Text style={styles.hideText}>.......</Text>
			) : (
				<>
					<View style={styles.showItem}>
						<Text style={styles.showText}>{data?.login}</Text>
					</View>
					<View style={styles.showItem}>
						<Text style={styles.showText}>{data?.password}</Text>
					</View>
				</>
			)}
		</TouchableOpacity>
	)
})

export default ContentItem

const styles = StyleSheet.create({
	showText: {
		color: "#fff",
		fontSize: 16,
	},
	hide: {
		alignItems: "center",
		padding: 0,
	},
	hideText: {
		color: "rgba(255, 255, 255, 0.1)",
		fontSize: 20,
	},
	showBlock: {
		width: "100%",
		overflow: "hidden",
		marginTop: 10,
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		justifyContent: "center",
		alignItems: "flex-start",
		borderRadius: 5,
		padding: 10,
	},
	showItem: {},
})
