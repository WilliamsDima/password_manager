import { useCallback, useMemo, useState } from "react"
import { Alert } from "react-native"
import { useSelector } from "react-redux"

import { type Entry, useDeleteEntryMutation } from "@/entities/entry"
import { selectSessionUser } from "@/entities/session"
import { strings } from "@/shared/config"
import { useHaptics } from "@/shared/services/haptics"
import { ErrorText, SecondaryButton } from "@/shared/ui"

/**
 * Deletes an entry after a confirmation. `onDeleted(synced)` runs when the delete is saved on
 * this phone; `synced: false` means it still waits for the network (the page tells the user).
 */
export const DeleteEntryButton = ({
	entry,
	onDeleted,
}: {
	readonly entry: Entry
	readonly onDeleted: (synced: boolean) => void
}) => {
	const user = useSelector(selectSessionUser)
	const haptics = useHaptics()
	const [deleteEntry, { isLoading }] = useDeleteEntryMutation()
	const [failed, setFailed] = useState(false)

	const remove = useCallback(async () => {
		if (user === null) return
		setFailed(false)
		try {
			const { synced } = await deleteEntry({ uid: user.uid, entryId: entry.id }).unwrap()
			haptics.notify("success")
			onDeleted(synced)
		} catch {
			haptics.notify("error")
			setFailed(true)
		}
	}, [user, deleteEntry, entry.id, haptics, onDeleted])

	const onPress = useCallback(() => {
		Alert.alert(
			strings.entry.deleteTitle,
			strings.entry.deleteBody.replace("{title}", entry.title),
			[
				{ text: strings.entry.cancel, style: "cancel" },
				{ text: strings.entry.delete, style: "destructive", onPress: () => void remove() },
			],
		)
	}, [entry.title, remove])

	const message = useMemo(() => (failed ? strings.entry.deleteFailed : null), [failed])

	return (
		<>
			<SecondaryButton
				label={strings.entry.delete}
				tone="danger"
				onPress={onPress}
				loading={isLoading}
			/>
			<ErrorText message={message} />
		</>
	)
}
