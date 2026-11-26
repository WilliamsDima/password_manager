import { createContext, useContext } from "react"

import type { VaultMigrationService } from "../model/vault-migration-service"

const MigrationServiceContext = createContext<VaultMigrationService | null>(null)

/** Gives the onboarding screens the migration service without importing the container (ARCHITECTURE §3). */
export const MigrationServicesProvider = ({
	migration,
	children,
}: {
	readonly migration: VaultMigrationService
	readonly children: React.ReactNode
}) => (
	<MigrationServiceContext.Provider value={migration}>{children}</MigrationServiceContext.Provider>
)

export const useVaultMigration = (): VaultMigrationService => {
	const migration = useContext(MigrationServiceContext)
	if (migration === null) throw new Error("MigrationServicesProvider is missing")
	return migration
}
