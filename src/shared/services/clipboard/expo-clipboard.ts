import { getStringAsync, setStringAsync } from "expo-clipboard"

import { AppError } from "@/shared/lib/errors"

import type { IClipboard } from "./clipboard"

/**
 * `IClipboard` on `expo-clipboard`. Copies with `isSensitive` and clears only if the clipboard
 * still holds what the app put there (the user may have copied something else since). The copied
 * value is kept in memory only until it is cleared.
 */
export class ExpoClipboard implements IClipboard {
	private copied: string | null = null
	private timer: ReturnType<typeof setTimeout> | null = null

	public readonly copySensitive = async (value: string, clearAfterMs: number): Promise<void> => {
		this.cancelTimer()
		try {
			await setStringAsync(value, { android: { isSensitive: true } })
		} catch (error) {
			throw new AppError("unknown", "Clipboard failed", { cause: error })
		}
		this.copied = value
		this.timer = setTimeout(() => {
			void this.clear()
		}, clearAfterMs)
	}

	public readonly clear = async (): Promise<void> => {
		this.cancelTimer()
		const copied = this.copied
		this.copied = null
		if (copied === null) return
		try {
			// Android 10+ hides the clipboard from background apps: an empty read then means
			// "cannot tell", and clearing is still the safe choice.
			const current = await getStringAsync()
			if (current === "" || current === copied) await setStringAsync("")
		} catch {
			// Nothing sensible to do: the value stays until overwritten, never logged.
		}
	}

	private readonly cancelTimer = (): void => {
		if (this.timer !== null) clearTimeout(this.timer)
		this.timer = null
	}
}
