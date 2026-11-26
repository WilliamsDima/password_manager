import * as ExpoCrypto from "expo-crypto"

import { ExpoRandom } from "./expo-random"

jest.mock("expo-crypto", () => ({
	getRandomValues: jest.fn(),
	randomUUID: jest.fn(),
}))

const native = jest.mocked(ExpoCrypto)

describe("ExpoRandom", () => {
	const random = new ExpoRandom()

	beforeEach(() => {
		jest.resetAllMocks()
	})

	it("fills a buffer of the requested length from the native CSPRNG", () => {
		native.getRandomValues.mockImplementation(<T extends ArrayBufferView>(array: T): T => {
			new Uint8Array(array.buffer).fill(7)
			return array
		})

		const bytes = random.bytes(32)

		expect(bytes).toEqual(new Uint8Array(32).fill(7))
		expect(native.getRandomValues).toHaveBeenCalledTimes(1)
	})

	it("returns an independent buffer on every call", () => {
		native.getRandomValues.mockImplementation(array => array)

		expect(random.bytes(16)).not.toBe(random.bytes(16))
	})

	it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])("rejects length %p", length => {
		expect(() => random.bytes(length)).toThrow("Invalid random length")
		expect(native.getRandomValues).not.toHaveBeenCalled()
	})

	it("delegates uuid to the native generator", () => {
		native.randomUUID.mockReturnValue("123e4567-e89b-42d3-a456-426614174000")

		expect(random.uuid()).toBe("123e4567-e89b-42d3-a456-426614174000")
	})
})
