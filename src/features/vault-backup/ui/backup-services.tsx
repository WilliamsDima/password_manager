import { createContext, useContext, useMemo, type ReactNode } from "react"

import type { IFileStorage } from "@/shared/services/file-storage"

import type { VaultBackupService } from "../model/vault-backup-service"

type BackupServices = { readonly backup: VaultBackupService; readonly files: IFileStorage }

const BackupServicesContext = createContext<BackupServices | null>(null)

/** Gives the backup section its services without importing the DI container (ARCHITECTURE §3). */
export const BackupServicesProvider = ({
	backup,
	files,
	children,
}: BackupServices & { readonly children: ReactNode }) => {
	const value = useMemo(() => ({ backup, files }), [backup, files])
	return <BackupServicesContext.Provider value={value}>{children}</BackupServicesContext.Provider>
}

export const useBackupServices = (): BackupServices => {
	const services = useContext(BackupServicesContext)
	if (services === null) throw new Error("BackupServicesProvider is missing")
	return services
}
