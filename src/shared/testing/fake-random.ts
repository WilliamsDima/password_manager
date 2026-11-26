import type { IRandom } from "@/shared/services/random"

/** Deterministic `IRandom` for tests: a counter stream, so every call returns different bytes. */
export class FakeRandom implements IRandom {
	private counter: number
	private uuidCounter = 0

	/** `seed` shifts the stream so two instances produce different keys. */
	constructor(seed = 0) {
		this.counter = seed
	}

	public readonly bytes = (length: number): Uint8Array =>
		Uint8Array.from({ length }, () => {
			this.counter += 1
			return (this.counter * 167 + 13) & 0xff
		})

	public readonly uuid = (): string => {
		this.uuidCounter += 1
		return `00000000-0000-4000-8000-${String(this.uuidCounter).padStart(12, "0")}`
	}
}
