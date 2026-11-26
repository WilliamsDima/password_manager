import { useNavigation } from "@react-navigation/native"
import { useCallback } from "react"
import { View } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import { useVaultLock, useVaultLockState } from "@/entities/session"
import { strings } from "@/shared/config"
import { LinkButton, Page, SwipeArea } from "@/shared/ui"
import { EntryList } from "@/widgets/entry-list"

/** Main screen: the entry list with the lock and settings shortcuts. */
export const VaultPage = () => {
	const navigation = useNavigation<{ navigate: (route: "Settings") => void }>()
	const lock = useVaultLock()
	const { mode } = useVaultLockState()

	const onOpenSettings = useCallback(() => {
		navigation.navigate("Settings")
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
				<EntryList />
			</Page>
		</SwipeArea>
	)
}

const styles = StyleSheet.create({
	toolbar: { flexDirection: "row", justifyContent: "space-between" },
})
