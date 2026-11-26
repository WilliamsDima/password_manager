import { type RouteProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native"
import { skipToken } from "@reduxjs/toolkit/query/react"
import { useCallback, useMemo, useState } from "react"
import { Alert } from "react-native"
import { useSelector } from "react-redux"

import { useGetEntriesQuery } from "@/entities/entry"
import { selectSessionUser } from "@/entities/session"
import { CopySecretButton } from "@/features/copy-secret"
import { DeleteEntryButton } from "@/features/delete-entry"
import { UrlLink } from "@/features/open-url"
import { strings } from "@/shared/config"
import { useClipboard } from "@/shared/services/clipboard"
import { AppText, Card, LinkButton, PrimaryButton, ScrollScreen } from "@/shared/ui"

type Params = { EntryDetails: { entryId: string }; EntryEdit: { entryId?: string } }
type Navigation = {
	readonly navigate: (route: "EntryEdit", params: { entryId: string }) => void
	readonly goBack: () => void
}

const formatDate = (ms: number): string => new Date(ms).toLocaleString("ru-RU")

/** One entry: copy the login or the password separately, show the password on request. */
export const EntryDetailsPage = () => {
	const navigation = useNavigation<Navigation>()
	const { entryId } = useRoute<RouteProp<Params, "EntryDetails">>().params
	const user = useSelector(selectSessionUser)
	const clipboard = useClipboard()
	const { data, isLoading, isError } = useGetEntriesQuery(user === null ? skipToken : user.uid)
	const [showPassword, setShowPassword] = useState(false)

	const entry = useMemo(() => data?.entries.find(item => item.id === entryId), [data, entryId])

	// Leaving the card (also for the edit screen, which keeps the card mounted underneath) clears
	// what the app copied from it and hides the password again.
	useFocusEffect(
		useCallback(
			() => () => {
				void clipboard.clear()
				setShowPassword(false)
			},
			[clipboard],
		),
	)

	const onToggleShow = useCallback(() => {
		setShowPassword(current => !current)
	}, [])

	const onEdit = useCallback(() => {
		navigation.navigate("EntryEdit", { entryId })
	}, [navigation, entryId])

	const onDeleted = useCallback(
		(synced: boolean) => {
			if (!synced) Alert.alert(strings.entry.notSyncedTitle, strings.entry.notSyncedBody)
			navigation.goBack()
		},
		[navigation],
	)

	const view = useMemo(
		() => ({
			title: entry?.title ?? "",
			login: entry?.login ?? "",
			password: entry?.password ?? "",
			shownPassword: showPassword ? (entry?.password ?? "") : "••••••••",
			toggleLabel: showPassword ? strings.entry.hide : strings.entry.show,
			hasLogin: (entry?.login ?? "") !== "",
			hasPassword: (entry?.password ?? "") !== "",
			url: entry?.url ?? "",
			notes: entry?.notes ?? "",
			hasUrl: (entry?.url ?? "") !== "",
			hasNotes: (entry?.notes ?? "") !== "",
			hasSecrets: (entry?.login ?? "") !== "" || (entry?.password ?? "") !== "",
			emptyTone: isError ? ("danger" as const) : ("muted" as const),
			emptyText: isLoading
				? strings.common.loading
				: isError
					? strings.vault.loadFailed
					: strings.entry.notFound,
			dates:
				entry === undefined
					? ""
					: `${strings.entry.created}: ${formatDate(entry.createdAt)}\n${strings.entry.updated}: ${formatDate(entry.updatedAt)}`,
		}),
		[entry, showPassword, isLoading, isError],
	)

	if (entry === undefined) {
		return (
			<ScrollScreen underHeader>
				<AppText tone={view.emptyTone} align="center">
					{view.emptyText}
				</AppText>
			</ScrollScreen>
		)
	}

	return (
		<ScrollScreen underHeader>
			<Card>
				<AppText variant="heading">{view.title}</AppText>
				{view.hasLogin ? (
					<>
						<AppText variant="caption" tone="muted">
							{strings.entry.fields.login}
						</AppText>
						<AppText selectable={false}>{view.login}</AppText>
						<CopySecretButton label={strings.entry.copyLogin} value={view.login} />
					</>
				) : (
					<></>
				)}
				{view.hasPassword ? (
					<>
						<AppText variant="caption" tone="muted">
							{strings.entry.fields.password}
						</AppText>
						<AppText selectable={false}>{view.shownPassword}</AppText>
						<LinkButton label={view.toggleLabel} onPress={onToggleShow} />
						<CopySecretButton label={strings.entry.copyPassword} value={view.password} />
					</>
				) : (
					<></>
				)}
				{view.hasUrl ? (
					<>
						<AppText variant="caption" tone="muted">
							{strings.entry.fields.url}
						</AppText>
						<UrlLink url={view.url} />
					</>
				) : (
					<></>
				)}
				{view.hasNotes ? (
					<>
						<AppText variant="caption" tone="muted">
							{strings.entry.fields.notes}
						</AppText>
						<AppText>{view.notes}</AppText>
					</>
				) : (
					<></>
				)}
				{view.hasSecrets ? (
					<AppText variant="caption" tone="muted">
						{strings.entry.copyHint}
					</AppText>
				) : (
					<></>
				)}
			</Card>
			<PrimaryButton label={strings.entry.edit} onPress={onEdit} />
			<DeleteEntryButton entry={entry} onDeleted={onDeleted} />
			<AppText variant="caption" tone="muted">
				{view.dates}
			</AppText>
		</ScrollScreen>
	)
}
