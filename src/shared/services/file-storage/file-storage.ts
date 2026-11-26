/**
 * User-visible files for the backup (docs/CRYPTO.md §7): save into a folder chosen in the system
 * dialog (Storage Access Framework), hand over to the share sheet, or pick a file to read.
 * The content is always ciphertext-only JSON; it is never logged. Errors: `AppError("file-io")`,
 * `AppError("file-too-large")`.
 */
export type SaveResult = "saved" | "canceled"

export type IFileStorage = {
	/** Asks for a folder in the system dialog and creates `fileName` there. */
	readonly saveToFolder: (
		fileName: string,
		mimeType: string,
		content: string,
	) => Promise<SaveResult>
	/** Opens the share sheet with a temporary file, which is deleted afterwards. */
	readonly share: (fileName: string, mimeType: string, content: string) => Promise<void>
	/** Asks for a file and returns its text, or `null` if the user canceled. */
	readonly pickText: (mimeTypes: readonly string[], maxBytes: number) => Promise<string | null>
}
