import React, { FC } from "react"
import { Provider } from "react-redux"
import { AuthProvider } from "./src/hooks/useAuth"
import Routes from "./src/navigation/routes"
import { store } from "./src/store/index"
import { LogBox } from "react-native"

const App: FC = () => {
	LogBox.ignoreLogs([
		"Warning: Async Storage has been extracted from react-native core",
	])
	return (
		<Provider store={store}>
			<AuthProvider>
				<Routes />
			</AuthProvider>
		</Provider>
	)
}

export default App
