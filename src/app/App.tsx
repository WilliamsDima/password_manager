import { StatusBar } from "expo-status-bar"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { Provider } from "react-redux"

import { createContainer } from "./di/container"
import { createAppStore } from "./store/store"

// Temporary root screen. Navigation, theme and the lock gate arrive in 4.3–6.x.
export const App = () => {
	// Created once per app process: the container and the store must not be rebuilt on re-render.
	const [store] = useState(() => createAppStore(createContainer()))

	return (
		<Provider store={store}>
			<View style={styles.container}>
				<Text>Password Manager v2</Text>
				<StatusBar style="auto" />
			</View>
		</Provider>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
})
