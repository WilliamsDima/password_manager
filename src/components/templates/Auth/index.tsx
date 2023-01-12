import React from "react"
import { StyleSheet, View, Image } from "react-native"
import Form from "../../organisms/Form"

const AuthTemplate = () => {
	return (
		<View style={styles.wrapp}>
			<Image
				style={styles.img}
				source={require("../../../assets/images/auth.png")}
			/>
			<Form />
		</View>
	)
}

export default AuthTemplate

const styles = StyleSheet.create({
	img: {
		flex: 1,
		width: "70%",
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
