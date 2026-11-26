import { Directory, File, Paths } from "expo-file-system"
import { isAvailableAsync, shareAsync } from "expo-sharing"

import { AppError } from "@/shared/lib/errors"

import type { IFileStorage, SaveResult } from "./file-storage"

/** Shared copies are named like this (see the backup file name). */
const SHARED_PREFIX = "password-manager-backup-"

/** `IFileStorage` on `expo-file-system` (SAF folder picker, file picker) and `expo-sharing`. */
export class ExpoFileStorage implements IFileStorage {
	public readonly saveToFolder = async (
		fileName: string,
		mimeType: string,
		content: string,
	): Promise<SaveResult> => {
		const folder = await Directory.pickDirectoryAsync().catch(() => null)
		// Dismissing the system dialog rejects: that is a cancel, not a failure.
		if (folder === null) return "canceled"
		try {
			await folder.createFile(fileName, mimeType).write(content)
			return "saved"
		} catch (error) {
			throw new AppError("file-io", "Could not save the file", { cause: error })
		}
	}

	public readonly share = async (
		fileName: string,
		mimeType: string,
		content: string,
	): Promise<void> => {
		const file = new File(Paths.cache, fileName)
		this.deleteSharedCopies()
		try {
			if (!(await isAvailableAsync())) throw new AppError("file-io", "Sharing is not available")
			file.create({ overwrite: true })
			await file.write(content)
			// `shareAsync` resolves when the chooser closes, but the chosen app may read the URI later:
			// the copy stays until the next share (ciphertext only, and `allowBackup` is off).
			await shareAsync(file.uri, { mimeType, dialogTitle: fileName })
		} catch (error) {
			this.deleteSharedCopies()
			throw error instanceof AppError
				? error
				: new AppError("file-io", "Could not share the file", { cause: error })
		}
	}

	/** Removes earlier shared backup copies from the cache. Failures are ignored on purpose. */
	private readonly deleteSharedCopies = (): void => {
		try {
			Paths.cache.list().forEach(item => {
				if (item instanceof File && item.name.startsWith(SHARED_PREFIX)) item.delete()
			})
		} catch {
			// Nothing sensible to do; the system clears the cache eventually.
		}
	}

	public readonly pickText = async (
		mimeTypes: readonly string[],
		maxBytes: number,
	): Promise<string | null> => {
		const picked = await File.pickFileAsync({ mimeTypes: [...mimeTypes] })
		if (picked.canceled) return null
		try {
			const size = picked.result.info().size
			if (typeof size === "number" && size > maxBytes) {
				throw new AppError("file-too-large", "File is too large")
			}
			const text = await picked.result.text()
			// `info().size` can be missing: check what was actually read as well.
			if (text.length > maxBytes) throw new AppError("file-too-large", "File is too large")
			return text
		} catch (error) {
			throw error instanceof AppError
				? error
				: new AppError("file-io", "Could not read the file", { cause: error })
		}
	}
}
