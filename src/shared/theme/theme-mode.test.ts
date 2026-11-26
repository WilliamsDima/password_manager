import { UnistylesRuntime } from "react-native-unistyles"

import { FakeSecureStorage } from "@/shared/testing"

import { applyThemeMode, parseThemeMode } from "./theme-mode"
import { SecureStorageThemeStore } from "./theme-store"
import { darkColors, lightColors, themes } from "./tokens"

describe("theme mode", () => {
	it("parses stored values and falls back to system", () => {
		expect(parseThemeMode("dark")).toBe("dark")
		expect(parseThemeMode("light")).toBe("light")
		expect(parseThemeMode("system")).toBe("system")
		expect(parseThemeMode("purple")).toBe("system")
		expect(parseThemeMode(null)).toBe("system")
	})

	it("applies system as adaptive themes, other modes as a fixed theme", () => {
		const calls: string[] = []
		jest.spyOn(UnistylesRuntime, "setAdaptiveThemes").mockImplementation(enabled => {
			calls.push(`adaptive:${String(enabled)}`)
		})
		jest.spyOn(UnistylesRuntime, "setTheme").mockImplementation(name => {
			calls.push(`theme:${name}`)
		})
		applyThemeMode("system")
		applyThemeMode("dark")
		expect(calls).toEqual(["adaptive:true", "adaptive:false", "theme:dark"])
	})

	it("has a palette per scheme", () => {
		expect(themes.dark.colors).toBe(darkColors)
		expect(themes.light.colors).toBe(lightColors)
		expect(themes.dark.scheme).toBe("dark")
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
