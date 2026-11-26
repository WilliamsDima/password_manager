import type { IRandom } from "@/shared/services/random"

import {
	type IPasswordGenerator,
	MAX_PASSWORD_LENGTH,
	MIN_PASSWORD_LENGTH,
	type PasswordOptions,
} from "./password-generator"

const LOWER = "abcdefghijklmnopqrstuvwxyz"
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const DIGITS = "0123456789"
const SYMBOLS = "!@#$%^&*-_=+?"
const AMBIGUOUS = new Set("0O1lI")

const UINT32 = 2 ** 32

/**
 * `IPasswordGenerator` on `IRandom`. Every class that is on appears at least once; positions and
 * the remaining characters are uniform (rejection sampling, no modulo bias).
 */
export class RandomPasswordGenerator implements IPasswordGenerator {
	constructor(private readonly random: IRandom) {}

	public readonly generate = (options: PasswordOptions): string => {
		if (
			!Number.isInteger(options.length) ||
			options.length < MIN_PASSWORD_LENGTH ||
			options.length > MAX_PASSWORD_LENGTH
		) {
			throw new RangeError("Password length is out of range")
		}
		const classes = this.classesOf(options)
		if (classes.length === 0) throw new RangeError("No character class selected")
		if (options.length < classes.length)
			throw new RangeError("Password is shorter than the classes")

		const alphabet = classes.flat()
		const required = classes.map(chars => this.pick(chars))
		const rest = Array.from({ length: options.length - required.length }, () => this.pick(alphabet))
		return this.shuffle([...required, ...rest]).join("")
	}

	private readonly classesOf = (options: PasswordOptions): readonly (readonly string[])[] =>
		[
			options.lower ? LOWER : "",
			options.upper ? UPPER : "",
			options.digits ? DIGITS : "",
			options.symbols ? SYMBOLS : "",
		]
			.filter(chars => chars !== "")
			.map(chars =>
				Array.from(chars).filter(char => !options.avoidAmbiguous || !AMBIGUOUS.has(char)),
			)

	/** Uniform integer in `[0, max)`; a broken random source ends in an error, not in a loop. */
	private readonly below = (max: number, attempts = 64): number => {
		if (attempts === 0) throw new Error("Random source is broken")
		const limit = Math.floor(UINT32 / max) * max
		const bytes = this.random.bytes(4)
		const value =
			(bytes[0] ?? 0) * 2 ** 24 +
			(bytes[1] ?? 0) * 2 ** 16 +
			(bytes[2] ?? 0) * 2 ** 8 +
			(bytes[3] ?? 0)
		return value < limit ? value % max : this.below(max, attempts - 1)
	}

	private readonly pick = (chars: readonly string[]): string =>
		chars[this.below(chars.length)] ?? ""

	/** Fisher-Yates with the same unbiased integers. It swaps inside its own copy of `items`. */
	private readonly shuffle = (items: readonly string[]): readonly string[] =>
		items.reduceRight<string[]>(
			(result, _item, index) => {
				const swapWith = this.below(index + 1)
				const current = result[index] ?? ""
				result[index] = result[swapWith] ?? ""
				result[swapWith] = current
				return result
			},
			[...items],
		)
}
