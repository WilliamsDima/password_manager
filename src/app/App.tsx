import { preventScreenCaptureAsync } from "expo-screen-capture"
import { StatusBar } from "expo-status-bar"
import { useEffect, useMemo, useState } from "react"
import { Provider } from "react-redux"

import { SessionServicesProvider } from "@/entities/session"
import { BackupServicesProvider } from "@/features/vault-backup"
import { MigrationServicesProvider } from "@/features/vault-migration"
import { ClipboardProvider } from "@/shared/services/clipboard"
import { FileStorageProvider } from "@/shared/services/file-storage"
import { HapticsProvider } from "@/shared/services/haptics"
import { AppThemeProvider, useColorScheme } from "@/shared/theme"

import { StyleSheet, View } from "react-native"

import type { VaultLockService } from "@/entities/session"
import type { IAuthService } from "@/shared/services/auth"

import { createContainer } from "./di/container"
import { RootNavigator } from "./navigation/root-navigator"
import { useAuthSync } from "./session/use-auth-sync"
import { useVaultLockSync } from "./session/use-vault-lock-sync"
import { createAppStore } from "./store/store"

/**
 * Debug builds only: with `EXPO_PUBLIC_ALLOW_SCREENSHOTS=1` the screen-capture block is skipped so
 * that layouts can be checked from screenshots. `__DEV__` is `false` in release bundles, so this
 * is a constant `false` there and the block can never be lifted in an installed APK.
 */
const ALLOW_DEV_SCREENSHOTS = __DEV__ && process.env.EXPO_PUBLIC_ALLOW_SCREENSHOTS === "1"

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
		if (ALLOW_DEV_SCREENSHOTS) return
		preventScreenCaptureAsync().catch(() => undefined)
	}, [])
	const scheme = useColorScheme()
	const statusBarStyle = useMemo(() => (scheme === "dark" ? "light" : "dark"), [scheme])
	useAuthSync(authService)
	useVaultLockSync(lock)

	return (
		// Any touch counts as activity for the idle auto-lock; the handler never consumes the event.
		<View style={styles.root} onTouchStart={lock.noteActivity}>
			<RootNavigator />
			<StatusBar style={statusBarStyle} />
		</View>
	)
}

export const App = () => {
	// Created once per app process: the container and the store must not be rebuilt on re-render.
	const [container] = useState(createContainer)
	const [store] = useState(() => createAppStore(container))

	return (
		<Provider store={store}>
			<AppThemeProvider store={container.themeStore}>
				<HapticsProvider haptics={container.haptics}>
					<ClipboardProvider clipboard={container.clipboard}>
						<FileStorageProvider files={container.fileStorage}>
							<MigrationServicesProvider migration={container.vaultMigration}>
								<SessionServicesProvider
									lock={container.vaultLock}
									recovery={container.vaultRecovery}
								>
									<BackupServicesProvider
										backup={container.vaultBackup}
										files={container.fileStorage}
									>
										<AppContent authService={container.authService} lock={container.vaultLock} />
									</BackupServicesProvider>
								</SessionServicesProvider>
							</MigrationServicesProvider>
						</FileStorageProvider>
					</ClipboardProvider>
				</HapticsProvider>
			</AppThemeProvider>
		</Provider>
	)
}

const styles = StyleSheet.create({ root: { flex: 1 } })
