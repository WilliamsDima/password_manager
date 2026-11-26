import { createContext, useContext } from "react"

import type { IFileStorage } from "./file-storage"

const FileStorageContext = createContext<IFileStorage | null>(null)

/** Hands the container's `IFileStorage` to components (docs/ARCHITECTURE.md §3.2). */
export const FileStorageProvider = ({
	files,
	children,
}: {
	readonly files: IFileStorage
	readonly children: React.ReactNode
}) => <FileStorageContext.Provider value={files}>{children}</FileStorageContext.Provider>

export const useFileStorage = (): IFileStorage => {
	const files = useContext(FileStorageContext)
	if (files === null) throw new Error("FileStorageProvider is missing")
	return files
}
