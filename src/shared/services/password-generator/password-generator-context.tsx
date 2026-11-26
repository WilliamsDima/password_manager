import { createContext, useContext } from "react"

import type { IPasswordGenerator } from "./password-generator"

const PasswordGeneratorContext = createContext<IPasswordGenerator | null>(null)

/** Hands the container's `IPasswordGenerator` to components (docs/ARCHITECTURE.md §3.2). */
export const PasswordGeneratorProvider = ({
	generator,
	children,
}: {
	readonly generator: IPasswordGenerator
	readonly children: React.ReactNode
}) => (
	<PasswordGeneratorContext.Provider value={generator}>
		{children}
	</PasswordGeneratorContext.Provider>
)

export const usePasswordGenerator = (): IPasswordGenerator => {
	const generator = useContext(PasswordGeneratorContext)
	if (generator === null) throw new Error("PasswordGeneratorProvider is missing")
	return generator
}
