import React, { FC } from "react"
import { Provider } from "react-redux"
import { AuthProvider } from "./src/hooks/useAuth"
import SplashScreen from "react-native-splash-screen"
import Routes from "./src/navigation/routes"
import { store } from "./src/store/index"
import { LogBox } from "react-native"

const App: FC = () => {
	LogBox.ignoreLogs([
		"Warning: Async Storage has been extracted from react-native core",
	])

	React.useEffect(() => {
		SplashScreen.hide()
		console.log("app start")
	}, [])

	return (
		<Provider store={store}>
			<AuthProvider>
				<Routes />
			</AuthProvider>
		</Provider>
	)
}

export default App
