/** Options of a generated password. At least one character class must be on. */
export type PasswordOptions = {
	readonly length: number
	readonly lower: boolean
	readonly upper: boolean
	readonly digits: boolean
	readonly symbols: boolean
	/** Leave out characters that look alike: `0 O 1 l I`. */
	readonly avoidAmbiguous: boolean
}

export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 64

export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
	length: 20,
	lower: true,
	upper: true,
	digits: true,
	symbols: true,
	avoidAmbiguous: true,
}

/** Creates random passwords (docs/CRYPTO.md §3: the only source of randomness is `IRandom`). */
export type IPasswordGenerator = {
	/** Throws `RangeError` for a length outside the limits or when no character class is on. */
	readonly generate: (options: PasswordOptions) => string
}
