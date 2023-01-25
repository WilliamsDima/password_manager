import React, { FC, memo, useEffect, useState } from "react"
import { TouchableOpacity, StyleSheet, View } from "react-native"
import QRCode from "react-native-qrcode-svg"
import COLORS from "../../../services/colors"
import { BlurView } from "@react-native-community/blur"
import Icon from "react-native-vector-icons/Entypo"

type IQR = {
	keyUser: string
	visible?: boolean
}

const QR: FC<IQR> = memo(({ keyUser, visible = true }) => {
	const [show, setShow] = useState(visible)

	useEffect(() => {}, [keyUser])
	return (
		<TouchableOpacity
			style={styles.container}
			activeOpacity={1}
			onPress={() => setShow(false)}
		>
			{!show && (
				<TouchableOpacity
					activeOpacity={1}
					style={styles.btnWrapper}
					onPress={() => setShow(true)}
				>
					<Icon name={"eye"} size={48} color={COLORS.BLUE} />
				</TouchableOpacity>
			)}

			<View style={styles.qr}>
				{!show && (
					<BlurView
						overlayColor=''
						style={styles.blur}
						blurType='light'
						blurAmount={7}
					/>
				)}
				<QRCode
					color={COLORS.MAIN}
					size={150}
					enableLinearGradient={true}
					linearGradient={[COLORS.MAIN, COLORS.TITLE_COLOR]}
					backgroundColor={"transparent"}
					value={keyUser}
					logoBackgroundColor='transparent'
				/>
				{!show && (
					<BlurView
						overlayColor=''
						style={styles.blur}
						blurType='light'
						blurAmount={7}
					/>
				)}
			</View>
		</TouchableOpacity>
	)
})

export default QR

const styles = StyleSheet.create({
	container: {
		position: "relative",
		borderRadius: 5,
		overflow: "hidden",
		width: 150,
		height: 150,
	},
	btnWrapper: {
		position: "absolute",
		zIndex: 5,
		width: "100%",
		height: "100%",
		justifyContent: "center",
		alignItems: "center",
	},
	qr: {
		width: "100%",
		height: "100%",
	},
	blur: {
		position: "absolute",
		zIndex: 1,
		width: "100%",
		height: "100%",
	},
})
