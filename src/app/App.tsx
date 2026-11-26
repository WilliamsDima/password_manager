import { StatusBar } from "expo-status-bar"
import { useState } from "react"
import { Provider } from "react-redux"

import type { IAuthService } from "@/shared/services/auth"

import { createContainer } from "./di/container"
import { RootNavigator } from "./navigation/root-navigator"
import { useAuthSync } from "./session/use-auth-sync"
import { createAppStore } from "./store/store"

const AppContent = ({ authService }: { readonly authService: IAuthService }) => {
	useAuthSync(authService)

	return (
		<>
			<RootNavigator />
			<StatusBar style="auto" />
		</>
	)
}

export const App = () => {
	// Created once per app process: the container and the store must not be rebuilt on re-render.
	const [container] = useState(createContainer)
	const [store] = useState(() => createAppStore(container))

	return (
		<Provider store={store}>
			<AppContent authService={container.authService} />
		</Provider>
	)
}
