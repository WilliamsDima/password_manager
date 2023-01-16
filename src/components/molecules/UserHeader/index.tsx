import React, { FC, memo } from "react"
import { View, Text, StyleSheet } from "react-native"
import { useAppSelector } from "../../../hooks/hooks"
import COLORS from "../../../services/colors"

type TUser = {}

const UserHeader: FC<TUser> = memo(props => {
	const { user } = useAppSelector(store => store.main)
	return (
		<View style={styles.container}>
			<Text style={styles.name} numberOfLines={1}>
				{user?.displayName}
			</Text>
		</View>
	)
})

export default UserHeader

const styles = StyleSheet.create({
	container: {
		width: 200,
		flexDirection: "row",
		justifyContent: "flex-end",
		alignItems: "center",
	},
	name: {
		color: COLORS.TITLE_COLOR,
		fontSize: 20,
	},
})
