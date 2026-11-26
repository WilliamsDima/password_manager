import { startCacheReset } from "./cache-reset"

type Status = "unlocked" | "locked" | "setup-required" | "uninitialized"

const fakeLock = () => {
	const state = { status: "uninitialized" as Status }
	const listeners = new Set<() => void>()
	return {
		lock: {
			getState: () => ({ status: state.status }) as never,
			subscribe: (listener: () => void) => {
				listeners.add(listener)
				return () => listeners.delete(listener)
			},
		},
		set: (status: Status) => {
			state.status = status
			listeners.forEach(listener => {
				listener()
			})
		},
		count: () => listeners.size,
	}
}

describe("startCacheReset", () => {
	it("resets the cache on every transition away from unlocked, not while unlocked", () => {
		const { lock, set } = fakeLock()
		const reset = jest.fn()
		startCacheReset(lock, reset)
		set("unlocked")
		expect(reset).not.toHaveBeenCalled()
		set("locked")
		expect(reset).toHaveBeenCalledTimes(1)
		set("unlocked")
		set("setup-required")
		expect(reset).toHaveBeenCalledTimes(2)
	})

	it("stops listening after unsubscribe", () => {
		const { lock, set, count } = fakeLock()
		const reset = jest.fn()
		const stop = startCacheReset(lock, reset)
		stop()
		set("locked")
		expect(reset).not.toHaveBeenCalled()
		expect(count()).toBe(0)
	})
})
