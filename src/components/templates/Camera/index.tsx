import React, { FC, useRef } from "react"
import { View, StyleSheet, Text } from "react-native"
import { setEncrypted } from "../../../api/asyncStorage"
import { KEY, WIDTH } from "../../../services/constants"
import { RNCamera } from "react-native-camera"
import { useActions } from "../../../hooks/useActions"
import COLORS from "../../../services/colors"

type TCamera = {
	setCamera: (value: boolean) => void
}

const CameraTemplate: FC<TCamera> = ({ setCamera }) => {
	const { setKey } = useActions()

	const cameraRef = useRef(null)

	const readingQR = ({ data }) => {
		data && setEncrypted(KEY, data)
		data && setKey(data)
		setCamera(false)
		// console.log("barcodesс", data)
	}

	return (
		<View style={styles.container}>
			<RNCamera
				ref={cameraRef}
				style={{
					flex: 1,
					width: "100%",
				}}
				onBarCodeRead={readingQR}
			>
				<View style={styles.camera}>
					<View style={styles.qr} />
					<Text
						style={{
							color: COLORS.GOLD,
							marginTop: 30,
							fontSize: 20,
							fontWeight: "700",
						}}
					>
						Наведите камеру на QR код
					</Text>
				</View>
			</RNCamera>
		</View>
	)
}
export default CameraTemplate

const styles = StyleSheet.create({
	container: {
		width: "100%",
		height: "100%",
		justifyContent: "center",
		alignItems: "center",
	},
	camera: {
		width: "100%",
		height: "100%",
		justifyContent: "center",
		alignItems: "center",
	},
	qr: {
		width: WIDTH / 1.5,
		height: WIDTH / 1.5,
		borderWidth: 2,
		borderColor: COLORS.MAIN,
		borderRadius: 50,
	},
})
