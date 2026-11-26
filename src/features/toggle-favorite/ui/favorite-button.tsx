import { useCallback, useMemo, useState } from "react"
import { Pressable } from "react-native"
import { StyleSheet } from "react-native-unistyles"
import { useSelector } from "react-redux"

import { type Entry, useSetEntryFavoriteMutation } from "@/entities/entry"
import { selectSessionUser } from "@/entities/session"
import { strings } from "@/shared/config"
import { useHaptics } from "@/shared/services/haptics"
import { AppText } from "@/shared/ui"

/**
 * The star of an entry. A tap flips `favorite` on the current version of the document (the
 * repository reads it fresh). `onNotice` gets a short message when the change failed or is still
 * waiting for the network, and `null` when a new tap starts.
 */
export const FavoriteButton = ({
	entry,
	onNotice,
}: {
	readonly entry: Entry
	readonly onNotice: (notice: string | null) => void
}) => {
	const user = useSelector(selectSessionUser)
	const haptics = useHaptics()
	const [setFavorite, { isLoading }] = useSetEntryFavoriteMutation()
	// The value we asked for: the star stays locked until the refreshed list shows it, so a quick
	// second tap cannot send the same value again.
	const [requested, setRequested] = useState<boolean | null>(null)
	const favorite = entry.favorite === true
	const waiting = isLoading || (requested !== null && requested !== favorite)

	const onPress = useCallback(async () => {
		if (user === null) return
		haptics.selection()
		onNotice(null)
		setRequested(!favorite)
		try {
			const { synced } = await setFavorite({
				uid: user.uid,
				entryId: entry.id,
				favorite: !favorite,
			}).unwrap()
			if (!synced) onNotice(strings.vault.notSynced)
		} catch {
			setRequested(null)
			haptics.notify("error")
			onNotice(strings.vault.saveFailed)
		}
	}, [user, haptics, onNotice, setFavorite, entry.id, favorite])

	const onPressStar = useCallback(() => {
		void onPress()
	}, [onPress])

	const view = useMemo(
		() => ({
			label: `${favorite ? strings.vault.favoriteRemove : strings.vault.favoriteAdd}: ${entry.title}`,
			state: { checked: favorite, disabled: waiting },
			star: favorite ? "★" : "☆",
			tone: favorite ? ("primary" as const) : ("muted" as const),
		}),
		[favorite, waiting, entry.title],
	)

	return (
		<Pressable
			accessibilityRole="switch"
			accessibilityLabel={view.label}
			accessibilityState={view.state}
			disabled={waiting}
			onPress={onPressStar}
			style={styles.button}
		>
			<AppText variant="heading" tone={view.tone}>
				{view.star}
			</AppText>
		</Pressable>
	)
}

// The star itself stays small; the button is a 48 dp touch target (Android minimum). The negative
// margin keeps the star aligned with the right edge of the row.
const styles = StyleSheet.create(theme => ({
	button: {
		minWidth: 48,
		minHeight: 48,
		alignItems: "center",
		justifyContent: "center",
		marginRight: -theme.spacing.sm,
	},
}))
