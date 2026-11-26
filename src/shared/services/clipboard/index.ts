/**
 * Clipboard for secrets (SECURITY_AUDIT L2, task 5.3): the value is marked
 * `EXTRA_IS_SENSITIVE` (Android hides the preview) and is cleared automatically.
 */
export type IClipboard = {
	/** Copies a secret and schedules clearing after `clearAfterMs`. */
	readonly copySensitive: (value: string, clearAfterMs: number) => Promise<void>
	/** Clears the clipboard if it still holds the value copied by the app. */
	readonly clear: () => Promise<void>
}
