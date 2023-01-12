import React, { FC } from "react"
import { styles } from "./header.styles"
import { IHeader } from "./header.types"
import { View } from "react-native"
import HeaderMain from "../../molecules/Headers/HeaderMain"

const Header: FC<IHeader> = () => {
	return (
		<View style={[styles.view]}>
			<HeaderMain />
		</View>
	)
}

export default Header
