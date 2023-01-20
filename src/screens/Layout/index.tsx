import React, { FC, ReactNode, useEffect } from "react"
import {
	SafeAreaView,
	ScrollView,
	View,
	StyleSheet,
	StatusBar,
} from "react-native"
import changeNavigationBarColor from "react-native-navigation-bar-color"
import Message from "../../components/atoms/Message/Index"
import Loader from "../../components/atoms/Loader/Index"
import MyModal from "../../components/organisms/Modal"
import { useAppSelector } from "../../hooks/hooks"
import { useActions } from "../../hooks/useActions"
import { useAuth } from "../../hooks/useAuth"
import COLORS from "../../services/colors"
import { RoutesNames } from "../../navigation/routes-names"
import { useRoute } from "@react-navigation/native"

type TLayout = {
	children: ReactNode
	scroll?: boolean
}

const Layout: FC<TLayout> = ({ children, scroll = true }) => {
	const { isLoading } = useAuth()
	const { setMessage } = useActions()
	const { message, loading } = useAppSelector(store => store.main)
	const { name } = useRoute()

	const colorNavigate =
		name !== RoutesNames.Start &&
		name !== RoutesNames.Pin &&
		name !== RoutesNames.Auth.AuthStack &&
		name !== RoutesNames.Auth.Recovery &&
		name !== RoutesNames.Auth.Register &&
		name !== RoutesNames.Auth.index

	const setColorForNavigationBar = async () => {
		try {
			const response = await changeNavigationBarColor(
				colorNavigate ? COLORS.BG_TAB : COLORS.BG_DARK,
				false,
				false
			)
			console.log(response) // {success: true}
		} catch (e) {
			console.log(e) // {success: false}
		}
	}

	useEffect(() => {
		console.log("loading auth", isLoading)
		console.log("loading", loading)

		setColorForNavigationBar()
	}, [loading])

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar
				barStyle='light-content'
				hidden={false}
				backgroundColor={"transparent"}
				translucent={true}
			/>

			<MyModal
				visible={isLoading || loading}
				close={() => null}
				animationType={"fade"}
			>
				<Loader />
			</MyModal>
			<MyModal
				visible={!!message}
				close={() => setMessage(null)}
				animationType={"fade"}
			>
				<Message message={message} />
			</MyModal>
			{scroll ? <ScrollView>{children}</ScrollView> : <View>{children}</View>}
		</SafeAreaView>
	)
}

export default Layout

const styles = StyleSheet.create({
	container: {
		position: "relative",
		flex: 1,
		backgroundColor: COLORS.BG_DARK,
	},
})
