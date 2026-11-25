import { StatusBar } from "expo-status-bar"
import { StyleSheet, Text, View } from "react-native"

// Temporary root screen. Providers, DI container, navigation and the lock gate arrive in 4.1a–5.3.
export const App = () => (
	<View style={styles.container}>
		<Text>Password Manager v2</Text>
		<StatusBar style="auto" />
	</View>
)

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
})
