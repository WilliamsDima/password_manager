import { createContext, useContext } from "react"

import type { IClipboard } from "./clipboard"

const ClipboardContext = createContext<IClipboard | null>(null)

/** Hands the container's `IClipboard` to components (docs/ARCHITECTURE.md §3.2). */
export const ClipboardProvider = ({
	clipboard,
	children,
}: {
	readonly clipboard: IClipboard
	readonly children: React.ReactNode
}) => <ClipboardContext.Provider value={clipboard}>{children}</ClipboardContext.Provider>

export const useClipboard = (): IClipboard => {
	const clipboard = useContext(ClipboardContext)
	if (clipboard === null) throw new Error("ClipboardProvider is missing")
	return clipboard
}
