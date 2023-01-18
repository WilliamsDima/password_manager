import React from "react"
import { StyleSheet, View, Image, Text } from "react-native"
import Form from "../../organisms/Form"

const RecoveryTemplate = () => {
	return (
		<View style={styles.wrapp}>
			<Image
				style={styles.img}
				source={require("../../../assets/images/recovery.png")}
			/>
			<Form recoveryMode={true} />
		</View>
	)
}

export default RecoveryTemplate

const styles = StyleSheet.create({
	img: {
		flex: 1,
		width: "50%",
		maxHeight: 250,
		resizeMode: "contain",
	},
	wrapp: {
		width: "100%",
		height: "100%",
		justifyContent: "center",
		alignItems: "center",
	},
})
