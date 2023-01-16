import React, { FC, ReactNode, useEffect } from "react"
import {
	SafeAreaView,
	ScrollView,
	View,
	StyleSheet,
	StatusBar,
} from "react-native"
import changeNavigationBarColor from "react-native-navigation-bar-color"
import ErrorMessage from "../../components/atoms/ErrorMessage/Index"
import Loader from "../../components/atoms/Loader/Index"
import MyModal from "../../components/organisms/Modal"
import { useAppSelector } from "../../hooks/hooks"
import { useActions } from "../../hooks/useActions"
import { useAuth } from "../../hooks/useAuth"
import COLORS from "../../services/colors"

type TLayout = {
	children: ReactNode
	scroll?: boolean
}

const Layout: FC<TLayout> = ({ children, scroll = true }) => {
	const { isLoading } = useAuth()
	const { setError } = useActions()
	const { error, loading } = useAppSelector(store => store.main)

	const setColorForNavigationBar = async () => {
		try {
			const response = await changeNavigationBarColor(COLORS.BG_DARK)
			console.log(response) // {success: true}
		} catch (e) {
			console.log(e) // {success: false}
		}
	}

	useEffect(() => {
		console.log("loading", isLoading || loading)

		setColorForNavigationBar()
	}, [loading])

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar
				barStyle='light-content'
				hidden={false}
				backgroundColor={COLORS.BG_DARK}
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
				visible={!!error}
				close={() => setError(null)}
				animationType={"fade"}
			>
				<ErrorMessage text={error} />
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
