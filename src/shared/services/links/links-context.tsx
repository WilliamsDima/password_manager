import { createContext, useContext } from "react"

import type { IUrlOpener } from "./links"

const UrlOpenerContext = createContext<IUrlOpener | null>(null)

/** Hands the container's `IUrlOpener` to components (docs/ARCHITECTURE.md §3.2). */
export const UrlOpenerProvider = ({
	opener,
	children,
}: {
	readonly opener: IUrlOpener
	readonly children: React.ReactNode
}) => <UrlOpenerContext.Provider value={opener}>{children}</UrlOpenerContext.Provider>

export const useUrlOpener = (): IUrlOpener => {
	const opener = useContext(UrlOpenerContext)
	if (opener === null) throw new Error("UrlOpenerProvider is missing")
	return opener
}
