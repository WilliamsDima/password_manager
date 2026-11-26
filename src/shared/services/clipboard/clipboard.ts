/**
 * Clipboard for secrets (SECURITY_AUDIT L2, docs/CRYPTO.md §2.1): the value is marked
 * `EXTRA_IS_SENSITIVE` (Android hides the preview) and is cleared automatically.
 */
export type IClipboard = {
	/**
	 * Copies a secret and schedules clearing after `clearAfterMs`. A new copy replaces the
	 * previous schedule. Timers only run while the app process is alive.
	 */
	readonly copySensitive: (value: string, clearAfterMs: number) => Promise<void>
	/** Clears the clipboard if it still holds the value copied by the app. Safe to call any time. */
	readonly clear: () => Promise<void>
}
