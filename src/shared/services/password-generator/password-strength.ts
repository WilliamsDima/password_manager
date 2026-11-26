export type StrengthLevel = 0 | 1 | 2 | 3 | 4

export type PasswordStrength = {
	readonly level: StrengthLevel
	/** Rough entropy estimate in bits; a guide, not a guarantee. */
	readonly bits: number
}

const COMMON = new Set([
	"password",
	"passw0rd",
	"qwerty",
	"qwertyuiop",
	"йцукен",
	"123456",
	"1234567",
	"12345678",
	"123456789",
	"1234567890",
	"111111",
	"000000",
	"abc123",
	"iloveyou",
	"admin",
	"letmein",
	"welcome",
	"monkey",
	"dragon",
	"qazwsx",
	"пароль",
])

/** Words that make a password weak wherever they sit: "Password123!" is still "password". */
const COMMON_WORDS = [
	"password",
	"qwerty",
	"admin",
	"welcome",
	"iloveyou",
	"letmein",
	"monkey",
	"dragon",
	"summer",
	"winter",
	"spring",
	"autumn",
	"football",
	"master",
	"login",
	"hello",
	"sunshine",
	"princess",
	"пароль",
	"привет",
	"любовь",
]

/** What people swap in: `P@ssw0rd` reads as `password` to anyone guessing. */
const LEET: Readonly<Record<string, string>> = {
	"@": "a",
	"0": "o",
	"1": "i",
	"3": "e",
	$: "s",
	"5": "s",
	"7": "t",
}

/** Lower case, look-alikes undone, digits and symbols cut off both ends: the base word. */
const baseWord = (lower: string): string =>
	Array.from(lower)
		.map(char => LEET[char] ?? char)
		.join("")
		.replace(/^[^a-zа-яё]+|[^a-zа-яё]+$/g, "")

/** Passwords built on a well-known word cannot be "strong", whatever their length. */
const WEAK_BASE_BITS = 35

const SEQUENCES = [
	"abcdefghijklmnopqrstuvwxyz",
	"0123456789",
	"qwertyuiopasdfghjklzxcvbnm",
	"йцукенгшщзхъфывапролджэячсмитьбю",
]

/** Number of 3-character runs that follow a keyboard/alphabet/number sequence (forwards or back). */
const sequenceRuns = (lower: string): number =>
	Array.from(lower).filter((_, index) => {
		const triple = lower.slice(index, index + 3)
		if (triple.length < 3) return false
		const back = Array.from(triple).reverse().join("")
		return SEQUENCES.some(sequence => sequence.includes(triple) || sequence.includes(back))
	}).length

const poolSize = (password: string): number =>
	(/[a-z]/.test(password) ? 26 : 0) +
	(/[A-Z]/.test(password) ? 26 : 0) +
	(/[0-9]/.test(password) ? 10 : 0) +
	(/[а-яё]/i.test(password) ? 33 : 0) +
	(/[^a-zA-Z0-9а-яёА-ЯЁ]/.test(password) ? 33 : 0)

/**
 * A quick offline estimate: length × size of the character pool, reduced for repeated characters,
 * alphabet/keyboard runs and well-known passwords. It never leaves the device and nothing is stored.
 */
export const estimatePasswordStrength = (password: string): PasswordStrength => {
	if (password === "") return { level: 0, bits: 0 }
	const lower = password.toLowerCase()
	if (COMMON.has(lower)) return { level: 0, bits: 0 }
	const base = baseWord(lower)
	const onKnownWord = COMMON.has(base) || COMMON_WORDS.some(word => base.includes(word))

	const chars = Array.from(password)
	const unique = new Set(chars).size
	// Repeats add little: count a character fully only the first time, a fifth of it afterwards.
	const effectiveLength = unique + (chars.length - unique) * 0.2
	const runs = sequenceRuns(lower)
	const usable = Math.max(effectiveLength - runs * 0.7, 0)
	const estimated = Math.round(usable * Math.log2(Math.max(poolSize(password), 2)))
	const bits = onKnownWord ? Math.min(estimated, WEAK_BASE_BITS) : estimated

	const level: StrengthLevel = bits < 28 ? 0 : bits < 40 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4
	return { level, bits }
}
