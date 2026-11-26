import * as ExpoClip from "expo-clipboard"

import { ExpoClipboard } from "./expo-clipboard"

jest.mock("expo-clipboard", () => ({ getStringAsync: jest.fn(), setStringAsync: jest.fn() }))

const native = jest.mocked(ExpoClip)

describe("ExpoClipboard", () => {
	beforeEach(() => {
		jest.resetAllMocks()
		jest.useFakeTimers()
		native.setStringAsync.mockResolvedValue(true)
	})
	afterEach(() => {
		jest.useRealTimers()
	})

	it("copies marked as sensitive", async () => {
		await new ExpoClipboard().copySensitive("s3cret", 1000)

		expect(native.setStringAsync).toHaveBeenCalledWith("s3cret", {
			android: { isSensitive: true },
		})
	})

	it("clears after the delay if the clipboard still holds the value", async () => {
		native.getStringAsync.mockResolvedValue("s3cret")
		await new ExpoClipboard().copySensitive("s3cret", 1000)

		await jest.advanceTimersByTimeAsync(1000)

		expect(native.setStringAsync).toHaveBeenLastCalledWith("")
	})

	it("does not wipe something else the user copied in the meantime", async () => {
		native.getStringAsync.mockResolvedValue("another thing")
		await new ExpoClipboard().copySensitive("s3cret", 1000)

		await jest.advanceTimersByTimeAsync(1000)

		expect(native.setStringAsync).toHaveBeenCalledTimes(1)
	})

	it("a second copy replaces the first schedule", async () => {
		native.getStringAsync.mockResolvedValue("two")
		const clipboard = new ExpoClipboard()
		await clipboard.copySensitive("one", 1000)
		await jest.advanceTimersByTimeAsync(600)
		await clipboard.copySensitive("two", 1000)

		await jest.advanceTimersByTimeAsync(600)
		expect(native.setStringAsync).toHaveBeenCalledTimes(2)
		await jest.advanceTimersByTimeAsync(400)

		expect(native.setStringAsync).toHaveBeenLastCalledWith("")
	})

	it("clear() is immediate, cancels the timer and is safe when nothing was copied", async () => {
		const clipboard = new ExpoClipboard()
		await clipboard.clear()
		expect(native.setStringAsync).not.toHaveBeenCalled()

		native.getStringAsync.mockResolvedValue("s3cret")
		await clipboard.copySensitive("s3cret", 1000)
		await clipboard.clear()
		await jest.advanceTimersByTimeAsync(2000)

		expect(native.setStringAsync).toHaveBeenCalledTimes(2)
	})

	it("an unreadable clipboard (background app) is still cleared", async () => {
		native.getStringAsync.mockResolvedValue("")
		const clipboard = new ExpoClipboard()
		await clipboard.copySensitive("s3cret", 1000)

		await clipboard.clear()

		expect(native.setStringAsync).toHaveBeenLastCalledWith("")
	})

	it("reports a failed copy without the value in the message", async () => {
		native.setStringAsync.mockRejectedValue(new Error("boom s3cret"))

		await expect(new ExpoClipboard().copySensitive("s3cret", 1000)).rejects.toMatchObject({
			message: "Clipboard failed",
		})
	})
})
