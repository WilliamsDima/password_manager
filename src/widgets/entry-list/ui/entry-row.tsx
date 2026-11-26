import { useCallback, useState } from "react"
import { Pressable, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import type { Entry } from "@/entities/entry"
import { FavoriteButton } from "@/features/toggle-favorite"
import { AnimatedListItem, AppText } from "@/shared/ui"

/** One row of the list: title, login, the favorite star and a short notice about its last change. */
export const EntryRow = ({
	entry,
	onOpen,
}: {
	readonly entry: Entry
	readonly onOpen: (entryId: string) => void
}) => {
	const [notice, setNotice] = useState<string | null>(null)
	const onPress = useCallback(() => {
		onOpen(entry.id)
	}, [onOpen, entry.id])
	return (
		<AnimatedListItem>
			<View style={styles.row}>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={entry.title}
					onPress={onPress}
					style={styles.texts}
				>
					<AppText variant="label" numberOfLines={1}>
						{entry.title}
					</AppText>
					<AppText variant="caption" tone="muted" numberOfLines={1}>
						{entry.login}
					</AppText>
					{notice === null ? (
						<></>
					) : (
						<AppText variant="caption" tone="danger">
							{notice}
						</AppText>
					)}
				</Pressable>
				<FavoriteButton entry={entry} onNotice={setNotice} />
			</View>
		</AnimatedListItem>
	)
}

const styles = StyleSheet.create(theme => ({
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.spacing.md,
		backgroundColor: theme.colors.surface,
		borderColor: theme.colors.border,
		borderWidth: 1,
		borderRadius: theme.radius.md,
		paddingVertical: theme.spacing.md,
		paddingHorizontal: theme.spacing.lg,
	},
	texts: { flex: 1, gap: 2 },
}))
