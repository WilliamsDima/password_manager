import { useCallback, useMemo, useState } from "react"
import { Pressable } from "react-native"
import { StyleSheet } from "react-native-unistyles"

import { strings } from "@/shared/config"
import { toOpenableUrl, useUrlOpener } from "@/shared/services/links"
import { AppText, ErrorText } from "@/shared/ui"

/**
 * An address stored in an entry, as a link: a tap opens it in the browser. Only web addresses
 * open (`toOpenableUrl`); anything else is shown as plain text.
 */
export const UrlLink = ({ url }: { readonly url: string }) => {
	const opener = useUrlOpener()
	const [failed, setFailed] = useState(false)
	const openable = useMemo(() => toOpenableUrl(url), [url])

	const onOpen = useCallback(async () => {
		if (openable === null) return
		setFailed(false)
		try {
			await opener.open(openable)
		} catch {
			setFailed(true)
		}
	}, [opener, openable])

	const onPress = useCallback(() => {
		void onOpen()
	}, [onOpen])

	const view = useMemo(
		() => ({
			message: failed ? strings.entry.openFailed : null,
			label: `${strings.entry.openUrl}: ${url}`,
		}),
		[failed, url],
	)

	if (openable === null) return <AppText>{url}</AppText>

	return (
		<>
			<Pressable
				accessibilityRole="link"
				accessibilityLabel={view.label}
				onPress={onPress}
				hitSlop={8}
				style={styles.link}
			>
				<AppText tone="primary">{url}</AppText>
			</Pressable>
			<ErrorText message={view.message} />
		</>
	)
}

const styles = StyleSheet.create(theme => ({
	link: { minHeight: 44, justifyContent: "center", paddingVertical: theme.spacing.xs },
}))
