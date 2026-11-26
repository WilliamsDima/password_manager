import { createLogger, type LogLevel } from "./index"

type Entry = readonly [LogLevel, string, unknown]

const createRecorder = () => {
	const entries: Entry[] = []
	const sink = (level: LogLevel, message: string, details?: unknown): void => {
		entries.push([level, message, details])
	}
	return { entries, sink }
}

describe("createLogger", () => {
	it("writes nothing when disabled (release builds)", () => {
		const { entries, sink } = createRecorder()
		const logger = createLogger({ enabled: false, sink })

		logger.debug("a")
		logger.info("b")
		logger.warn("c")
		logger.error("d", { code: 1 })

		expect(entries).toHaveLength(0)
	})

	it("forwards level, message and details when enabled", () => {
		const { entries, sink } = createRecorder()
		const logger = createLogger({ enabled: true, sink })

		logger.warn("sync failed", { code: 503 })

		expect(entries).toEqual([["warn", "sync failed", { code: 503 }]])
	})
})
