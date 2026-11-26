import * as SecureStore from "expo-secure-store"

import { AppError } from "@/shared/lib/errors"

import { ExpoSecureStorage } from "./expo-secure-storage"

jest.mock("expo-secure-store", () => ({
	getItemAsync: jest.fn(),
	setItemAsync: jest.fn(),
	deleteItemAsync: jest.fn(),
	canUseBiometricAuthentication: jest.fn(),
}))

const native = jest.mocked(SecureStore)

const nativeError = (message: string): Error => new Error(message)

describe("ExpoSecureStorage", () => {
	const storage = new ExpoSecureStorage()

	beforeEach(() => {
		jest.resetAllMocks()
	})

	it("stores plain values under the plain keychain service", async () => {
		native.setItemAsync.mockResolvedValue(undefined)

		await storage.set("lock.mode", "password")

		expect(native.setItemAsync).toHaveBeenCalledWith("lock.mode", "password", {
			keychainService: "pm.plain",
		})
	})

	it("stores biometric values under a separate service with authentication", async () => {
		native.getItemAsync.mockResolvedValue("value")

		const value = await storage.get("vault.dek", {
			requireAuthentication: true,
			authenticationPrompt: "Разблокировка",
		})

		expect(value).toBe("value")
		expect(native.getItemAsync).toHaveBeenCalledWith("vault.dek", {
			keychainService: "pm.auth.vault.dek",
			requireAuthentication: true,
			authenticationPrompt: "Разблокировка",
		})
	})

	it("uses the same service for remove as for set", async () => {
		native.deleteItemAsync.mockResolvedValue(undefined)

		await storage.remove("vault.dek", { requireAuthentication: true })

		expect(native.deleteItemAsync).toHaveBeenCalledWith("vault.dek", {
			keychainService: "pm.auth.vault.dek",
			requireAuthentication: true,
		})
	})

	it("returns null for a missing or invalidated value", async () => {
		native.getItemAsync.mockResolvedValue(null)

		await expect(storage.get("vault.dek", { requireAuthentication: true })).resolves.toBeNull()
	})

	it("maps a canceled prompt to auth-canceled", async () => {
		native.getItemAsync.mockRejectedValue(
			nativeError("Could not authenticate the user: User canceled the authentication. Отмена"),
		)

		await expect(storage.get("vault.dek", { requireAuthentication: true })).rejects.toMatchObject({
			code: "auth-canceled",
		})
	})

	it.each([
		"Could not authenticate the user: Unknown error (code: 5). Canceled",
		"Could not authenticate the user: Authentication is already in progress",
	])("treats a system-closed or duplicate prompt as auth-canceled: %s", async message => {
		native.getItemAsync.mockRejectedValue(nativeError(message))

		await expect(storage.get("vault.dek", { requireAuthentication: true })).rejects.toMatchObject({
			code: "auth-canceled",
		})
	})

	it("gives each authenticated key its own keychain service", async () => {
		native.setItemAsync.mockResolvedValue(undefined)

		await storage.set("a", "1", { requireAuthentication: true })
		await storage.set("b", "2", { requireAuthentication: true })

		expect(native.setItemAsync).toHaveBeenNthCalledWith(1, "a", "1", {
			keychainService: "pm.auth.a",
			requireAuthentication: true,
		})
		expect(native.setItemAsync).toHaveBeenNthCalledWith(2, "b", "2", {
			keychainService: "pm.auth.b",
			requireAuthentication: true,
		})
	})

	it("maps other authentication failures to auth-unavailable", async () => {
		native.setItemAsync.mockRejectedValue(
			nativeError("Could not authenticate the user: No biometrics are currently enrolled"),
		)

		await expect(
			storage.set("vault.dek", "secret", { requireAuthentication: true }),
		).rejects.toMatchObject({ code: "auth-unavailable" })
	})

	it("maps other native failures to secure-storage without copying the native message", async () => {
		native.getItemAsync.mockRejectedValue(nativeError("Could not decrypt the value for key"))

		const error: unknown = await storage.get("vault.dek").catch((caught: unknown) => caught)

		expect(error).toBeInstanceOf(AppError)
		expect(error).toMatchObject({ code: "secure-storage", message: "Secure storage read failed" })
	})

	it("reports biometric availability", () => {
		native.canUseBiometricAuthentication.mockReturnValue(true)

		expect(storage.canUseBiometricAuthentication()).toBe(true)
	})
})
