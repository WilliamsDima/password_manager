import { ExpoRandom } from "@/shared/services/random"
import type { IRandom } from "@/shared/services/random"
import { FakeRandom } from "@/shared/testing"

import {
	DEFAULT_PASSWORD_OPTIONS,
	MAX_PASSWORD_LENGTH,
	MIN_PASSWORD_LENGTH,
} from "./password-generator"
import { estimatePasswordStrength } from "./password-strength"
import { RandomPasswordGenerator } from "./random-password-generator"

/** mulberry32: a small, well-mixed seeded generator, so statistics are not skewed by the test source. */
class SeededRandom implements IRandom {
	private state: number
	constructor(seed: number) {
		this.state = seed >>> 0
	}
	private readonly next = (): number => {
		this.state = (this.state + 0x6d2b79f5) >>> 0
		const mixed = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state)
		const result = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed
		return (result ^ (result >>> 14)) >>> 0
	}
	public readonly bytes = (length: number): Uint8Array =>
		Uint8Array.from({ length }, () => this.next() & 0xff)
	public readonly uuid = (): string => "00000000-0000-4000-8000-000000000000"
}

const generator = (seed = 0) => new RandomPasswordGenerator(new SeededRandom(seed))

describe("RandomPasswordGenerator", () => {
	it("makes a password of the requested length with every chosen class", () => {
		for (const seed of [0, 1, 2, 3, 4, 5, 6, 7]) {
			const password = generator(seed).generate({ ...DEFAULT_PASSWORD_OPTIONS, length: 12 })
			expect(password).toHaveLength(12)
			expect(password).toMatch(/[a-z]/)
			expect(password).toMatch(/[A-Z]/)
			expect(password).toMatch(/[2-9]/)
			expect(password).toMatch(/[!@#$%^&*\-_=+?]/)
		}
	})

	it("uses only the chosen classes", () => {
		const password = generator().generate({
			length: 30,
			lower: false,
			upper: false,
			digits: true,
			symbols: false,
			avoidAmbiguous: false,
		})
		expect(password).toMatch(/^[0-9]{30}$/)
	})

	it("leaves out look-alike characters on request, and keeps them otherwise", () => {
		const options = { ...DEFAULT_PASSWORD_OPTIONS, length: MAX_PASSWORD_LENGTH }
		for (const seed of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
			expect(generator(seed).generate(options)).not.toMatch(/[0O1lI]/)
		}
		const all = Array.from({ length: 40 }, (_, seed) =>
			generator(seed).generate({ ...options, avoidAmbiguous: false }),
		).join("")
		expect(all).toMatch(/[0O1lI]/)
	})

	it("gives different passwords from a changing random stream", () => {
		const random = new FakeRandom()
		const make = new RandomPasswordGenerator(random)
		const a = make.generate(DEFAULT_PASSWORD_OPTIONS)
		const b = make.generate(DEFAULT_PASSWORD_OPTIONS)
		expect(a).not.toBe(b)
	})

	it("is not biased toward the first characters of a class", () => {
		const make = new RandomPasswordGenerator(new SeededRandom(11))
		const counts = new Map<string, number>()
		Array.from({ length: 400 }, () =>
			make.generate({
				length: 16,
				lower: false,
				upper: false,
				digits: true,
				symbols: false,
				avoidAmbiguous: true,
			}),
		)
			.join("")
			.split("")
			.forEach(char => counts.set(char, (counts.get(char) ?? 0) + 1))
		const values = [...counts.values()]
		expect(values).toHaveLength(8)
		expect(Math.max(...values) / Math.min(...values)).toBeLessThan(1.25)
	})

	it("rejects bad options", () => {
		const bad = { ...DEFAULT_PASSWORD_OPTIONS }
		expect(() => generator().generate({ ...bad, length: MIN_PASSWORD_LENGTH - 1 })).toThrow(
			RangeError,
		)
		expect(() => generator().generate({ ...bad, length: MAX_PASSWORD_LENGTH + 1 })).toThrow(
			RangeError,
		)
		expect(() => generator().generate({ ...bad, length: 12.5 })).toThrow(RangeError)
		expect(() =>
			generator().generate({ ...bad, lower: false, upper: false, digits: false, symbols: false }),
		).toThrow(RangeError)
	})

	it("fails with an error, not an endless loop, when the random source is broken", () => {
		const stuck: IRandom = {
			bytes: length => new Uint8Array(length).fill(0xff),
			uuid: () => "00000000-0000-4000-8000-000000000000",
		}
		expect(() => new RandomPasswordGenerator(stuck).generate(DEFAULT_PASSWORD_OPTIONS)).toThrow(
			"Random source is broken",
		)
	})

	it("works with the real random source type", () => {
		expect(new RandomPasswordGenerator(new ExpoRandom())).toBeInstanceOf(RandomPasswordGenerator)
	})
})

describe("estimatePasswordStrength", () => {
	const level = (password: string) => estimatePasswordStrength(password).level

	it("rates empty and well-known passwords as the weakest", () => {
		expect(level("")).toBe(0)
		expect(level("password")).toBe(0)
		expect(level("QWERTY")).toBe(0)
		expect(level("123456")).toBe(0)
		expect(level("пароль")).toBe(0)
	})

	it("does not call a dictionary word with digits and a symbol strong", () => {
		for (const weak of [
			"Password123!",
			"P@ssw0rd2024!",
			"Iloveyou2024!",
			"Summer2024!",
			"Qwerty123!",
			"Admin12345!",
			"Пароль123!",
		]) {
			expect(level(weak)).toBeLessThanOrEqual(1)
		}
	})

	it("still rates a long random password strong", () => {
		expect(level("k7#Pq2!vXm9@Lw4$Zt8&Rb5^")).toBe(4)
	})

	it("rates short, repeated and sequential passwords low", () => {
		expect(level("abc12")).toBe(0)
		expect(level("aaaaaaaaaaaa")).toBeLessThanOrEqual(1)
		expect(level("abcdefghij")).toBeLessThanOrEqual(1)
		expect(level("qwertyuiop12")).toBeLessThanOrEqual(2)
	})

	it("rates longer mixed passwords higher", () => {
		expect(level("Tr0ub4dor&3")).toBeGreaterThanOrEqual(2)
		expect(level("k7#Pq2!vXm9@Lw4$")).toBeGreaterThanOrEqual(3)
		expect(level("k7#Pq2!vXm9@Lw4$Zt8&Rb5^")).toBe(4)
	})

	it("never lowers the level when a password gets longer with new characters", () => {
		const base = "k7#Pq2!v"
		expect(level(base + "Xm9@Lw4$")).toBeGreaterThanOrEqual(level(base))
	})

	it("rates generated default passwords as strong", () => {
		expect(level(generator(3).generate(DEFAULT_PASSWORD_OPTIONS))).toBeGreaterThanOrEqual(3)
	})
})
