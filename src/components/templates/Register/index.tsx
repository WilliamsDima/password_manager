import React, { useEffect } from "react"
import { StyleSheet, View, Image } from "react-native"
import Form from "../../organisms/Form"

const RegisterTemplate = () => {
	useEffect(() => {}, [])
	return (
		<View style={styles.wrapp}>
			<Image
				style={styles.img}
				source={require("../../../assets/images/register.png")}
			/>
			<Form registerMode={true} />
		</View>
	)
}

export default RegisterTemplate

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
