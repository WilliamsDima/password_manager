import type { IKdf, KdfParams } from "@/shared/services/crypto"

import { calibrateKdf, DEFAULT_KDF_PARAMS } from "./kdf-calibration"

/** A phone whose probe (N = 2^12) takes `probeMs`. */
const phone = (probeMs: number) => {
	const clock = { now: 0 }
	const seen: KdfParams[] = []
	const kdf: IKdf = {
		derive: (_p, _s, params) => {
			seen.push(params)
			clock.now += probeMs
			return Promise.resolve(new Uint8Array(32))
		},
	}
	return { kdf, now: () => clock.now, seen }
}

describe("calibrateKdf", () => {
	it.each([
		[1, 2 ** 16],
		[10, 2 ** 16],
		[22, 2 ** 16],
		[45, 2 ** 15],
		[90, 2 ** 14],
		[200, 2 ** 14],
		[5000, 2 ** 14],
	])("probe of %p ms → N = %p (target ≈ 700 ms, power of two in [2^14, 2^16])", async (ms, n) => {
		const { kdf, now } = phone(ms)

		expect(await calibrateKdf(kdf, now)).toEqual({ algorithm: "scrypt", N: n, r: 8, p: 1 })
	})

	it("probes with a cheap N and keeps r = 8, p = 1", async () => {
		const { kdf, now, seen } = phone(50)

		await calibrateKdf(kdf, now)

		expect(seen).toEqual([{ algorithm: "scrypt", N: 4096, r: 8, p: 1 }])
	})

	it("defaults to 2^15", () => {
		expect(DEFAULT_KDF_PARAMS.N).toBe(32768)
	})
})
