import React, { useState } from "react"
import { StyleSheet, View, Image } from "react-native"
import Form from "../../organisms/Form"
import MyModal from "../../organisms/Modal"
import CameraTemplate from "../Camera"

const AuthTemplate = () => {
	const [camnera, setCamera] = useState(false)
	return (
		<View style={styles.wrapp}>
			<Image
				style={styles.img}
				source={require("../../../assets/images/auth.png")}
			/>
			<Form setCamera={setCamera} />

			<MyModal
				visible={camnera}
				close={() => setCamera(false)}
				animationType={"fade"}
			>
				<CameraTemplate setCamera={setCamera} />
			</MyModal>
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
		// width: "100%",
		// height: "100%",
		justifyContent: "center",
		alignItems: "center",
	},
})
