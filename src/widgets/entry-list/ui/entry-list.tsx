import { skipToken } from "@reduxjs/toolkit/query/react"
import { useCallback, useMemo, useState } from "react"
import { ActivityIndicator, FlatList, type ListRenderItemInfo, View } from "react-native"
import { useSelector } from "react-redux"
import { StyleSheet } from "react-native-unistyles"

import {
	DEFAULT_ENTRY_SORT_ORDER,
	ENTRY_SORT_ORDERS,
	type Entry,
	type EntrySortOrder,
	useGetEntriesQuery,
	visibleEntries,
} from "@/entities/entry"
import { selectSessionUser, useVaultLock } from "@/entities/session"
import { strings } from "@/shared/config"
import { useAppTheme } from "@/shared/theme"
import { AppText, ChipToggle, FormInput, LinkButton, SegmentedControl } from "@/shared/ui"

import { EntryRow } from "./entry-row"

const SORT_OPTIONS = ENTRY_SORT_ORDERS.map(value => ({
	value,
	label: strings.vault.sortNames[value],
}))

const keyOf = (entry: Entry): string => entry.id

/** Entries of the open vault with search, sorting and the favorites filter. */
export const EntryList = ({ onOpenEntry }: { readonly onOpenEntry: (entryId: string) => void }) => {
	const { colors } = useAppTheme()
	const user = useSelector(selectSessionUser)
	const lock = useVaultLock()
	const { data, isLoading, isError, refetch } = useGetEntriesQuery(
		user === null ? skipToken : user.uid,
	)
	const [query, setQuery] = useState("")
	const [order, setOrder] = useState<EntrySortOrder>(DEFAULT_ENTRY_SORT_ORDER)
	const [favoritesOnly, setFavoritesOnly] = useState(false)
	// Only a pull by the user shows the refresh spinner, not every background refetch.
	const [pulling, setPulling] = useState(false)

	const view = useMemo(() => {
		const all = data?.entries ?? []
		const entries = visibleEntries(all, { query, order, favoritesOnly })
		const searching = query.trim().length > 0
		const emptyText =
			all.length === 0
				? strings.vault.empty
				: searching
					? strings.vault.emptySearch
					: favoritesOnly
						? strings.vault.emptyFavorites
						: strings.vault.empty
		const unreadable = data?.unreadable.length ?? 0
		return {
			entries,
			emptyText,
			unreadableText: unreadable > 0 ? `${strings.vault.unreadable}: ${String(unreadable)}` : "",
			hasUnreadable: unreadable > 0,
			// With data already loaded a failed refetch keeps the list and shows the error above it.
			showList: !isLoading && (!isError || data !== undefined),
		}
	}, [data, query, order, favoritesOnly, isLoading, isError])

	// Typing is activity too: without it a long search with no touches would auto-lock the vault.
	const onChangeQuery = useCallback(
		(text: string) => {
			lock.noteActivity()
			setQuery(text)
		},
		[lock],
	)
	const onRefresh = useCallback(() => {
		void refetch()
	}, [refetch])
	const onPull = useCallback(async () => {
		setPulling(true)
		try {
			await refetch()
		} finally {
			setPulling(false)
		}
	}, [refetch])
	const onPullList = useCallback(() => {
		void onPull()
	}, [onPull])
	const renderItem = useCallback(
		({ item }: ListRenderItemInfo<Entry>) => <EntryRow entry={item} onOpen={onOpenEntry} />,
		[onOpenEntry],
	)
	const empty = useMemo(
		() => (
			<AppText tone="muted" align="center">
				{view.emptyText}
			</AppText>
		),
		[view.emptyText],
	)

	return (
		<View style={styles.container}>
			<FormInput
				placeholder={strings.vault.search}
				value={query}
				onChangeText={onChangeQuery}
				returnKeyType="search"
				accessibilityLabel={strings.vault.search}
				autoComplete="off"
				importantForAutofill="no"
			/>
			<SegmentedControl options={SORT_OPTIONS} value={order} onChange={setOrder} />
			<ChipToggle
				label={strings.vault.favoritesOnly}
				selected={favoritesOnly}
				onToggle={setFavoritesOnly}
			/>
			{view.hasUnreadable ? (
				<AppText tone="danger" variant="caption">
					{view.unreadableText}
				</AppText>
			) : (
				<></>
			)}
			{isLoading ? (
				<ActivityIndicator color={colors.primary} accessibilityLabel={strings.common.loading} />
			) : (
				<></>
			)}
			{isError ? (
				<View style={styles.failed}>
					<AppText tone="danger" align="center">
						{strings.vault.loadFailed}
					</AppText>
					<LinkButton label={strings.vault.retry} onPress={onRefresh} />
				</View>
			) : (
				<></>
			)}
			{view.showList ? (
				<FlatList
					data={view.entries}
					keyExtractor={keyOf}
					renderItem={renderItem}
					ListEmptyComponent={empty}
					refreshing={pulling}
					onRefresh={onPullList}
					keyboardShouldPersistTaps="handled"
					contentContainerStyle={styles.listContent}
				/>
			) : (
				<></>
			)}
		</View>
	)
}

const styles = StyleSheet.create(theme => ({
	container: { flex: 1, gap: theme.spacing.md },
	// Room under the last row for the floating add button.
	listContent: { gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl * 3 },
	failed: { gap: theme.spacing.sm },
}))
