import { parseThemeMode, resolveColorScheme } from "./theme-mode"
import { SecureStorageThemeStore } from "./theme-store"
import { createTheme, darkColors, lightColors } from "./tokens"
import { FakeSecureStorage } from "@/shared/testing"

describe("theme mode", () => {
	it("parses stored values and falls back to system", () => {
		expect(parseThemeMode("dark")).toBe("dark")
		expect(parseThemeMode("light")).toBe("light")
		expect(parseThemeMode("system")).toBe("system")
		expect(parseThemeMode("purple")).toBe("system")
		expect(parseThemeMode(null)).toBe("system")
	})

	it("resolves the scheme: explicit choice wins, system follows the phone", () => {
		expect(resolveColorScheme("dark", "light")).toBe("dark")
		expect(resolveColorScheme("light", "dark")).toBe("light")
		expect(resolveColorScheme("system", "dark")).toBe("dark")
		expect(resolveColorScheme("system", "light")).toBe("light")
		expect(resolveColorScheme("system", null)).toBe("light")
	})

	it("builds the palette for the scheme", () => {
		expect(createTheme("dark").colors).toBe(darkColors)
		expect(createTheme("light").colors).toBe(lightColors)
	})
})

describe("SecureStorageThemeStore", () => {
	it("round-trips the mode and defaults to system", async () => {
		const store = new SecureStorageThemeStore(new FakeSecureStorage())
		expect(await store.load()).toBe("system")
		await store.save("dark")
		expect(await store.load()).toBe("dark")
	})

	it("reads system when storage fails", async () => {
		const storage = new FakeSecureStorage()
		storage.failGets = true
		expect(await new SecureStorageThemeStore(storage).load()).toBe("system")
	})
})
