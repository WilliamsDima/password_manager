import React, { useEffect } from "react"
import { StyleSheet, View, Image, Text } from "react-native"
import { useAppSelector } from "../../../hooks/hooks"
import { useActions } from "../../../hooks/useActions"
import Form from "../../organisms/Form"
import MyModal from "../../organisms/Modal"
import KeyGenTemplate from "../KeyGen"

const RegisterTemplate = () => {
	// const { keyGenModal, key } = useAppSelector(store => store.main)
	// const { setKeyModal } = useActions()

	useEffect(() => {}, [])
	return (
		<View style={styles.wrapp}>
			<Image
				style={styles.img}
				source={require("../../../assets/images/register.png")}
			/>
			<Form registerMode={true} />
			{/* <MyModal visible={keyGenModal && !!key} close={() => setKeyModal(false)}>
				<KeyGenTemplate />
			</MyModal> */}
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
