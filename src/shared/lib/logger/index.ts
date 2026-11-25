export type LogLevel = "debug" | "info" | "warn" | "error"

export type ILogger = {
	readonly debug: (message: string, details?: unknown) => void
	readonly info: (message: string, details?: unknown) => void
	readonly warn: (message: string, details?: unknown) => void
	readonly error: (message: string, details?: unknown) => void
}

type LoggerOptions = {
	readonly enabled: boolean
	readonly sink?: (level: LogLevel, message: string, details?: unknown) => void
}

const consoleSink = (level: LogLevel, message: string, details?: unknown): void => {
	if (details === undefined) {
		console[level](message)
	} else {
		console[level](message, details)
	}
}

/**
 * Creates a logger. In release builds it must be disabled: logs can leak secrets via logcat
 * (SECURITY_AUDIT O1). Never pass decrypted data, keys or passwords as `details`.
 */
export const createLogger = ({ enabled, sink = consoleSink }: LoggerOptions): ILogger => {
	const log =
		(level: LogLevel) =>
		(message: string, details?: unknown): void => {
			if (enabled) {
				sink(level, message, details)
			}
		}

	return {
		debug: log("debug"),
		info: log("info"),
		warn: log("warn"),
		error: log("error"),
	}
}

export const logger: ILogger = createLogger({ enabled: __DEV__ })
