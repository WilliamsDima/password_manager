import { createContext, useContext } from "react"

import type { IHaptics } from "./haptics"

const HapticsContext = createContext<IHaptics | null>(null)

/** Hands the container's `IHaptics` to components (docs/ARCHITECTURE.md §3.2: no adapter imports in UI). */
export const HapticsProvider = ({
	haptics,
	children,
}: {
	readonly haptics: IHaptics
	readonly children: React.ReactNode
}) => <HapticsContext.Provider value={haptics}>{children}</HapticsContext.Provider>

export const useHaptics = (): IHaptics => {
	const haptics = useContext(HapticsContext)
	if (haptics === null) throw new Error("HapticsProvider is missing")
	return haptics
}
