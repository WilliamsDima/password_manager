import { Directory, File } from "expo-file-system"
import { isAvailableAsync, shareAsync } from "expo-sharing"

import { ExpoFileStorage } from "./expo-file-storage"

const mockWrite = jest.fn()
const mockCreate = jest.fn()
const mockDelete = jest.fn()
const mockCacheItems: unknown[] = []

jest.mock("expo-file-system", () => {
	class MockFile {
		public static pickFileAsync = jest.fn()
		public readonly name: string
		public readonly uri: string
		constructor(...parts: unknown[]) {
			// `Paths.cache` is an object in the real API; only the string parts make up the name.
			const name = parts.filter((part): part is string => typeof part === "string").join("")
			this.name = name
			this.uri = name
		}
		public create = mockCreate
		public write = mockWrite
		public delete = mockDelete
	}
	return {
		Paths: { cache: { list: () => mockCacheItems } },
		Directory: { pickDirectoryAsync: jest.fn() },
		File: MockFile,
	}
})
jest.mock("expo-sharing", () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }))

// Typed handles to the jest mocks above (the real overloads are deprecated / unbound).
const pickDirectory = (Directory as unknown as { pickDirectoryAsync: jest.Mock }).pickDirectoryAsync
const pickFile = (File as unknown as { pickFileAsync: jest.Mock }).pickFileAsync
const sharingAvailable = jest.mocked(isAvailableAsync)
const share = jest.mocked(shareAsync)

describe("ExpoFileStorage", () => {
	const storage = new ExpoFileStorage()

	beforeEach(() => {
		jest.clearAllMocks()
		mockCacheItems.length = 0
		mockWrite.mockResolvedValue(undefined)
		sharingAvailable.mockResolvedValue(true)
		share.mockResolvedValue(undefined)
	})

	it("saves into the folder the user picked", async () => {
		const createFile = jest.fn().mockReturnValue({ write: mockWrite })
		pickDirectory.mockResolvedValue({ createFile })

		expect(await storage.saveToFolder("b.json", "application/json", "{}")).toBe("saved")

		expect(createFile).toHaveBeenCalledWith("b.json", "application/json")
		expect(mockWrite).toHaveBeenCalledWith("{}")
	})

	it("dismissing the folder dialog is a cancel, not an error", async () => {
		pickDirectory.mockRejectedValue(new Error("cancelled"))

		expect(await storage.saveToFolder("b.json", "application/json", "{}")).toBe("canceled")
	})

	it("a failed write is reported without the content", async () => {
		pickDirectory.mockResolvedValue({
			createFile: () => ({ write: () => Promise.reject(new Error("disk full {secret}")) }),
		})

		const error = await storage
			.saveToFolder("b.json", "application/json", "{secret}")
			.catch((e: unknown) => e)

		expect(error).toMatchObject({ code: "file-io", message: "Could not save the file" })
	})

	it("shares the file, keeps it for the receiving app and drops older copies on the next share", async () => {
		mockCacheItems.push(new File("password-manager-backup-old.json"), new File("unrelated.txt"))

		await storage.share("password-manager-backup-new.json", "application/json", "{}")

		expect(mockCreate).toHaveBeenCalledWith({ overwrite: true })
		expect(mockWrite).toHaveBeenCalledWith("{}")
		expect(share).toHaveBeenCalledWith("password-manager-backup-new.json", {
			mimeType: "application/json",
			dialogTitle: "password-manager-backup-new.json",
		})
		// Only the earlier backup copy is deleted; the new one stays until the next share.
		expect(mockDelete).toHaveBeenCalledTimes(1)
	})

	it("a failed share does not leave the copy behind", async () => {
		share.mockRejectedValueOnce(new Error("boom"))
		mockCacheItems.push(new File("password-manager-backup-new.json"))

		await expect(
			storage.share("password-manager-backup-new.json", "application/json", "{}"),
		).rejects.toMatchObject({ code: "file-io" })

		// Once before the attempt and once after the failure.
		expect(mockDelete).toHaveBeenCalledTimes(2)
	})

	it("reports when sharing is unavailable", async () => {
		sharingAvailable.mockResolvedValue(false)

		await expect(storage.share("b.json", "application/json", "{}")).rejects.toMatchObject({
			code: "file-io",
		})
		expect(share).not.toHaveBeenCalled()
	})

	it("reads the picked file; a canceled pick is null", async () => {
		pickFile.mockResolvedValueOnce({ canceled: true, result: null })
		expect(await storage.pickText(["application/json"], 1000)).toBeNull()

		pickFile.mockResolvedValueOnce({
			canceled: false,
			result: { info: () => ({ size: 5 }), text: () => Promise.resolve("hello") },
		})
		expect(await storage.pickText(["application/json"], 1000)).toBe("hello")
	})

	it("also refuses a file whose size is unknown but whose text is too long", async () => {
		pickFile.mockResolvedValueOnce({
			canceled: false,
			result: { info: () => ({}), text: () => Promise.resolve("x".repeat(2000)) },
		})

		await expect(storage.pickText(["application/json"], 1000)).rejects.toMatchObject({
			code: "file-too-large",
		})
	})

	it("refuses a file that is too large for a backup", async () => {
		const text = jest.fn()
		pickFile.mockResolvedValueOnce({
			canceled: false,
			result: { info: () => ({ size: 5_000_000 }), text },
		})

		await expect(storage.pickText(["application/json"], 1000)).rejects.toMatchObject({
			code: "file-too-large",
		})
		expect(text).not.toHaveBeenCalled()
	})
})
