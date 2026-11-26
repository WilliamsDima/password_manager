import { settleWithin, WRITE_ACK_MS } from "./settle-write"

describe("settleWithin", () => {
	beforeEach(() => {
		jest.useFakeTimers()
	})
	afterEach(() => {
		jest.useRealTimers()
	})

	it("reports synced when the server confirms in time", async () => {
		const result = settleWithin(Promise.resolve())
		await expect(result).resolves.toBe("synced")
		expect(jest.getTimerCount()).toBe(0)
	})

	it("reports queued when the server does not answer within the limit", async () => {
		const result = settleWithin(new Promise<void>(() => undefined))
		await jest.advanceTimersByTimeAsync(WRITE_ACK_MS)
		await expect(result).resolves.toBe("queued")
	})

	it("rejects when the write fails before the limit", async () => {
		const failure = new Error("denied")
		await expect(settleWithin(Promise.reject(failure))).rejects.toBe(failure)
		expect(jest.getTimerCount()).toBe(0)
	})

	it("ignores a rejection that arrives after the limit", async () => {
		const late = { reject: (_error: Error): void => undefined }
		const write = new Promise<void>((_resolve, reject) => {
			late.reject = reject
		})
		const result = settleWithin(write)
		await jest.advanceTimersByTimeAsync(WRITE_ACK_MS)
		await expect(result).resolves.toBe("queued")
		late.reject(new Error("denied later"))
		await jest.advanceTimersByTimeAsync(0)
	})
})
