import React, { FC, memo } from "react"
import {
	View,
	StyleSheet,
	TouchableOpacity,
	Text,
	ToastAndroid,
	Vibration,
} from "react-native"
import COLORS from "../../../services/colors"
import { IItemContent } from "../../../services/types"
import Clipboard from "@react-native-clipboard/clipboard"

type TContent = {
	toggleListItem: () => void
	hidden: boolean
	data: IItemContent | null
}

const ContentItem: FC<TContent> = memo(({ data, toggleListItem, hidden }) => {
	const copyToClipboard = () => {
		if (!hidden) {
			const copyText = `${data?.login} ${data?.password}`
			data && Clipboard.setString(copyText)
			data && ToastAndroid.show("скопировано!", 2000)
			data && Vibration.vibrate()
		}

		toggleListItem()
	}
	return (
		<TouchableOpacity
			onPress={copyToClipboard}
			style={[styles.showBlock, hidden && styles.hide]}
		>
			{hidden ? (
				<Text style={styles.hideText}>.......</Text>
			) : (
				<>
					<View
						style={[
							styles.showItem,
							{
								borderBottomWidth: 1,
								borderBottomColor: COLORS.GRAY,
								paddingBottom: 5,
							},
						]}
					>
						<Text selectable={true} style={styles.showText}>
							{data?.login}
						</Text>
					</View>
					<View style={styles.showItem}>
						<Text selectable={true} style={styles.showText}>
							{data?.password}
						</Text>
					</View>
				</>
			)}
		</TouchableOpacity>
	)
})

export default ContentItem

const styles = StyleSheet.create({
	showText: {
		color: COLORS.WHITE,
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
	showItem: {
		width: "100%",
	},
})
