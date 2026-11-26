import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react"

import type { VaultLockService } from "../model/vault-lock-service"
import type { VaultLockState } from "../model/vault-lock-types"
import type { VaultRecoveryService } from "../model/vault-recovery-service"

type SessionServices = {
	readonly lock: VaultLockService
	readonly recovery: VaultRecoveryService
}

const SessionServicesContext = createContext<SessionServices | null>(null)

/** Gives screens the lock and recovery services without importing the DI container (ARCHITECTURE §3). */
export const SessionServicesProvider = ({
	lock,
	recovery,
	children,
}: SessionServices & { readonly children: ReactNode }) => (
	<SessionServicesContext.Provider value={{ lock, recovery }}>
		{children}
	</SessionServicesContext.Provider>
)

const useServices = (): SessionServices => {
	const services = useContext(SessionServicesContext)
	if (services === null) throw new Error("SessionServicesProvider is missing")
	return services
}

export const useVaultLock = (): VaultLockService => useServices().lock

export const useVaultRecovery = (): VaultRecoveryService => useServices().recovery

/** Re-renders on every lock state change. The DEK is never exposed through this hook. */
export const useVaultLockState = (): VaultLockState => {
	const lock = useVaultLock()
	return useSyncExternalStore(lock.subscribe, lock.getState)
}
