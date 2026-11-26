import { Linking } from "react-native"

import { LinkingUrlOpener } from "./linking-url-opener"

describe("LinkingUrlOpener", () => {
	afterEach(() => {
		jest.restoreAllMocks()
	})

	it("opens the address through Linking", async () => {
		const open = jest.spyOn(Linking, "openURL").mockResolvedValue()
		await new LinkingUrlOpener().open("https://example.com")
		expect(open).toHaveBeenCalledWith("https://example.com")
	})

	it("turns a failure into an AppError without the address", async () => {
		jest.spyOn(Linking, "openURL").mockRejectedValue(new Error("no app"))
		const error = await new LinkingUrlOpener()
			.open("https://secret.example")
			.catch((e: unknown) => e)
		expect(error).toMatchObject({ name: "AppError", code: "unknown" })
		expect((error as Error).message).not.toContain("secret.example")
	})
})
