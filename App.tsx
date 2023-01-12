import React, { FC } from "react"
import { Provider } from "react-redux"
import { AuthProvider } from "./src/hooks/useAuth"
import Routes from "./src/navigation/routes"
import { store } from "./src/store/index"

const App: FC = () => {
	return (
		<Provider store={store}>
			<AuthProvider>
				<Routes />
			</AuthProvider>
		</Provider>
	)
}

export default App
