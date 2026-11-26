import { useNavigation } from "@react-navigation/native"
import { useCallback } from "react"
import { View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import { useVaultLock, useVaultLockState } from "@/entities/session"
import { strings } from "@/shared/config"
import { FloatingButton, LinkButton, Page, SwipeArea } from "@/shared/ui"
import { EntryList } from "@/widgets/entry-list"

type Navigation = {
	readonly navigate: {
		(route: "Settings"): void
		(route: "EntryDetails", params: { entryId: string }): void
		(route: "EntryEdit", params: { entryId?: string }): void
	}
}

/** Main screen: the entry list, shortcuts to settings and lock, and a button for a new entry. */
export const VaultPage = () => {
	const navigation = useNavigation<Navigation>()
	const lock = useVaultLock()
	const { mode } = useVaultLockState()

	const onOpenSettings = useCallback(() => {
		navigation.navigate("Settings")
	}, [navigation])

	const onOpenEntry = useCallback(
		(entryId: string) => {
			navigation.navigate("EntryDetails", { entryId })
		},
		[navigation],
	)

	const onAddEntry = useCallback(() => {
		navigation.navigate("EntryEdit", {})
	}, [navigation])

	return (
		<SwipeArea onSwipeRight={onOpenSettings}>
			<Page>
				<View style={styles.toolbar}>
					<LinkButton label={strings.vault.settings} onPress={onOpenSettings} />
					{mode === "none" ? (
						<></>
					) : (
						<LinkButton label={strings.vault.lockNow} onPress={lock.lock} />
					)}
				</View>
				<EntryList onOpenEntry={onOpenEntry} />
			</Page>
			<FloatingButton label={strings.entry.add} glyph="+" onPress={onAddEntry} />
		</SwipeArea>
	)
}

const styles = StyleSheet.create({
	toolbar: { flexDirection: "row", justifyContent: "space-between" },
})
