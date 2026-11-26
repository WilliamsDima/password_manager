import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { strings } from "@/shared/config"
import { useClipboard } from "@/shared/services/clipboard"
import { SecondaryButton } from "@/shared/ui"

/** The app copies a secret for this long; then (or when the screen is left) the clipboard is cleared. */
const CLIPBOARD_CLEAR_MS = 120_000
const FEEDBACK_MS = 2000

type Status = "idle" | "copied" | "failed"

/**
 * Copies one secret value (login or password) to the clipboard as a sensitive item (hidden from
 * the Android preview, cleared automatically; docs/CRYPTO.md §2.1, SECURITY_AUDIT L2). The value
 * is only held in the clipboard call, never logged or shown by this button.
 */
export const CopySecretButton = ({
	label,
	value,
}: {
	readonly label: string
	readonly value: string
}) => {
	const clipboard = useClipboard()
	const [status, setStatus] = useState<Status>("idle")
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const mounted = useRef(true)

	useEffect(
		() => () => {
			mounted.current = false
			if (timer.current !== null) clearTimeout(timer.current)
		},
		[],
	)

	const onCopy = useCallback(async () => {
		if (timer.current !== null) clearTimeout(timer.current)
		const ok = await clipboard.copySensitive(value, CLIPBOARD_CLEAR_MS).then(
			() => true,
			() => false,
		)
		if (!mounted.current) return
		setStatus(ok ? "copied" : "failed")
		timer.current = setTimeout(() => {
			setStatus("idle")
		}, FEEDBACK_MS)
	}, [clipboard, value])

	const onPress = useCallback(() => {
		void onCopy()
	}, [onCopy])

	const text = useMemo(() => {
		if (status === "copied") return strings.entry.copied
		return status === "failed" ? strings.entry.copyFailed : label
	}, [status, label])

	return <SecondaryButton label={text} onPress={onPress} />
}
