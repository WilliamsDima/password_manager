import React, { FC, memo, ReactNode } from "react"
import {
	View,
	StyleSheet,
	StatusBar,
	Modal,
	TouchableOpacity,
} from "react-native"
import COLORS from "../../../services/colors"

type TModal = {
	visible: boolean
	close: () => void
	animationType?: "slide" | undefined | "none" | "fade"
	children: ReactNode
}

const MyModal: FC<TModal> = memo(
	({ visible, close, animationType = "slide", children }) => {
		const closeHandler = () => {
			close()
		}

		return (
			<Modal
				visible={visible}
				animationType={animationType}
				transparent={true}
				onRequestClose={closeHandler}
			>
				<TouchableOpacity
					activeOpacity={1}
					onPress={closeHandler}
					style={[styles.modalStyle, { backgroundColor: COLORS.MODAL_BG }]}
				>
					<StatusBar
						barStyle='dark-content'
						hidden={false}
						backgroundColor={COLORS.MODAL_BG}
						translucent={true}
					/>

					{children}
				</TouchableOpacity>
			</Modal>
		)
	}
)

export default MyModal

const styles = StyleSheet.create({
	modalStyle: {
		height: "100%",
		position: "relative",
		justifyContent: "center",
		alignItems: "center",
	},
})
