import { preventScreenCaptureAsync } from "expo-screen-capture"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { Provider } from "react-redux"

import { SessionServicesProvider } from "@/entities/session"
import { BackupServicesProvider } from "@/features/vault-backup"

import { StyleSheet, View } from "react-native"

import type { VaultLockService } from "@/entities/session"
import type { IAuthService } from "@/shared/services/auth"

import { createContainer } from "./di/container"
import { RootNavigator } from "./navigation/root-navigator"
import { useAuthSync } from "./session/use-auth-sync"
import { useVaultLockSync } from "./session/use-vault-lock-sync"
import { createAppStore } from "./store/store"

const AppContent = ({
	authService,
	lock,
}: {
	readonly authService: IAuthService
	readonly lock: VaultLockService
}) => {
	// FLAG_SECURE for the whole app life: no screenshots, blank preview in recents (SECURITY_AUDIT L1).
	// Deliberately not the hook: its cleanup calls `allowScreenCapture` while the activity is already
	// gone, which rejects. The flag must never be lifted anyway.
	useEffect(() => {
		preventScreenCaptureAsync().catch(() => undefined)
	}, [])
	useAuthSync(authService)
	useVaultLockSync(lock)

	return (
		// Any touch counts as activity for the idle auto-lock; the handler never consumes the event.
		<View style={styles.root} onTouchStart={lock.noteActivity}>
			<RootNavigator />
			<StatusBar style="auto" />
		</View>
	)
}

export const App = () => {
	// Created once per app process: the container and the store must not be rebuilt on re-render.
	const [container] = useState(createContainer)
	const [store] = useState(() => createAppStore(container))

	return (
		<Provider store={store}>
			<SessionServicesProvider lock={container.vaultLock} recovery={container.vaultRecovery}>
				<BackupServicesProvider backup={container.vaultBackup} files={container.fileStorage}>
					<AppContent authService={container.authService} lock={container.vaultLock} />
				</BackupServicesProvider>
			</SessionServicesProvider>
		</Provider>
	)
}

const styles = StyleSheet.create({ root: { flex: 1 } })
