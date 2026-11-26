import { useCallback, useEffect, useMemo, useState } from "react"

import { formatRecoveryKey } from "@/entities/session"
import { strings } from "@/shared/config"
import { useClipboard } from "@/shared/services/clipboard"
import { useFileStorage } from "@/shared/services/file-storage"
import { AppText, Card, ErrorText, PrimaryButton, ScrollScreen, SecondaryButton } from "@/shared/ui"

const CLIPBOARD_CLEAR_MS = 120_000
const FILE_NAME = "recovery-key.txt"

/**
 * Shows the recovery key (docs/CRYPTO.md §2.1): copy (sensitive, cleared after 2 minutes and when
 * this screen is left) or save to a file. Screenshots are blocked app-wide (`FLAG_SECURE`).
 */
export const ShowKeyStep = ({
	recoveryKey,
	onContinue,
}: {
	readonly recoveryKey: Uint8Array
	readonly onContinue: () => void
}) => {
	const clipboard = useClipboard()
	const files = useFileStorage()
	const [message, setMessage] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)

	const view = useMemo(() => {
		const text = formatRecoveryKey(recoveryKey)
		const groups = text.split("-")
		const lines = Array.from({ length: Math.ceil(groups.length / 2) }, (_, index) =>
			groups.slice(index * 2, index * 2 + 2).join("  "),
		)
		return { text, display: lines.join("\n") }
	}, [recoveryKey])

	// Leaving the screen clears what the app copied: the next step asks for the key from storage.
	useEffect(
		() => () => {
			void clipboard.clear()
		},
		[clipboard],
	)

	const onCopy = useCallback(async () => {
		setError(null)
		try {
			await clipboard.copySensitive(view.text, CLIPBOARD_CLEAR_MS)
			setMessage(strings.onboarding.showKey.copied)
		} catch {
			setMessage(null)
			setError(strings.lockErrors.fallback)
		}
	}, [clipboard, view.text])

	const onSave = useCallback(async () => {
		setError(null)
		try {
			const result = await files.saveToFolder(FILE_NAME, "text/plain", `${view.text}\n`)
			setMessage(
				result === "saved"
					? strings.onboarding.showKey.saved
					: strings.onboarding.showKey.saveCanceled,
			)
		} catch {
			setMessage(null)
			setError(strings.lockErrors.fallback)
		}
	}, [files, view.text])

	const onCopyPress = useCallback(() => {
		void onCopy()
	}, [onCopy])
	const onSavePress = useCallback(() => {
		void onSave()
	}, [onSave])

	return (
		<ScrollScreen>
			<AppText variant="title">{strings.onboarding.showKey.title}</AppText>
			<AppText>{strings.onboarding.showKey.warning}</AppText>
			<Card>
				<AppText variant="heading" align="center" selectable={false}>
					{view.display}
				</AppText>
			</Card>
			<AppText variant="caption" tone="muted">
				{strings.onboarding.showKey.storeHint}
			</AppText>
			<SecondaryButton label={strings.onboarding.showKey.copy} onPress={onCopyPress} />
			<SecondaryButton label={strings.onboarding.showKey.saveFile} onPress={onSavePress} />
			{message === null ? (
				<></>
			) : (
				<AppText tone="success" variant="caption">
					{message}
				</AppText>
			)}
			<ErrorText message={error} />
			<PrimaryButton label={strings.onboarding.showKey.next} onPress={onContinue} />
		</ScrollScreen>
	)
}
