import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import { skipToken } from "@reduxjs/toolkit/query/react"
import { useCallback, useMemo, useRef, useState } from "react"
import { Alert } from "react-native"
import { useSelector } from "react-redux"

import {
	type Entry,
	type EntryInput,
	useCreateEntryMutation,
	useGetEntriesQuery,
	useUpdateEntryMutation,
} from "@/entities/entry"
import { selectSessionUser } from "@/entities/session"
import { EntryForm } from "@/features/edit-entry"
import { strings } from "@/shared/config"
import { useHaptics } from "@/shared/services/haptics"
import { AppText, ScrollScreen } from "@/shared/ui"

type Params = { EntryEdit: { entryId?: string } }
type Navigation = {
	readonly goBack: () => void
}

/** Creates a new entry, or edits the one named by the route. */
export const EntryEditPage = () => {
	const navigation = useNavigation<Navigation>()
	const { entryId } = useRoute<RouteProp<Params, "EntryEdit">>().params
	const user = useSelector(selectSessionUser)
	const haptics = useHaptics()
	const { data, isLoading, isError } = useGetEntriesQuery(user === null ? skipToken : user.uid)
	const [createEntry, createState] = useCreateEntryMutation()
	const [updateEntry, updateState] = useUpdateEntryMutation()
	const [failed, setFailed] = useState(false)
	// Synchronous guard: state would reach the button only after a render, and after a successful
	// save the form stays on screen for a moment (back animation, "not synced" notice).
	const submitting = useRef(false)
	const [locked, setLocked] = useState(false)

	const existing = useMemo(
		() =>
			entryId === undefined ? null : (data?.entries.find(item => item.id === entryId) ?? null),
		[data, entryId],
	)
	const creating = entryId === undefined

	const finish = useCallback(
		(synced: boolean) => {
			haptics.notify("success")
			// A write that waits for the network is saved here: say so, and never ask to save again.
			if (!synced) Alert.alert(strings.entry.notSyncedTitle, strings.entry.notSyncedBody)
			navigation.goBack()
		},
		[haptics, navigation],
	)

	const onSubmit = useCallback(
		async (input: EntryInput) => {
			if (user === null || submitting.current) return
			if (!creating && existing === null) return
			submitting.current = true
			setLocked(true)
			setFailed(false)
			try {
				if (existing === null) {
					finish((await createEntry({ uid: user.uid, input }).unwrap()).synced)
					return
				}
				const next: Entry = {
					...input,
					id: existing.id,
					createdAt: existing.createdAt,
					updatedAt: existing.updatedAt,
					...(existing.favorite === undefined ? {} : { favorite: existing.favorite }),
				}
				finish((await updateEntry({ uid: user.uid, entry: next }).unwrap()).synced)
			} catch {
				// Only a failed save may be tried again; a saved one is never submitted twice.
				submitting.current = false
				setLocked(false)
				haptics.notify("error")
				setFailed(true)
			}
		},
		[user, creating, existing, createEntry, updateEntry, finish, haptics],
	)

	const onSubmitForm = useCallback(
		(input: EntryInput) => {
			void onSubmit(input)
		},
		[onSubmit],
	)

	const view = useMemo(
		() => ({
			busy: locked || createState.isLoading || updateState.isLoading,
			error: failed ? strings.entry.saveFailed : null,
			missing: !creating && !isLoading && !isError && existing === null,
			loadFailed: !creating && isError && existing === null,
			// The form takes its start values once: show it only when the entry is loaded.
			ready: creating || existing !== null,
			formKey: existing?.id ?? "new",
		}),
		[
			locked,
			createState.isLoading,
			updateState.isLoading,
			failed,
			creating,
			isLoading,
			isError,
			existing,
		],
	)

	if (view.missing) {
		return (
			<ScrollScreen underHeader>
				<AppText tone="muted" align="center">
					{strings.entry.notFound}
				</AppText>
			</ScrollScreen>
		)
	}

	if (view.loadFailed) {
		return (
			<ScrollScreen underHeader>
				<AppText tone="danger" align="center">
					{strings.vault.loadFailed}
				</AppText>
			</ScrollScreen>
		)
	}

	return (
		<ScrollScreen underHeader>
			{view.ready ? (
				<EntryForm
					key={view.formKey}
					initial={existing}
					busy={view.busy}
					error={view.error}
					onSubmit={onSubmitForm}
				/>
			) : (
				<AppText tone="muted" align="center">
					{strings.common.loading}
				</AppText>
			)}
		</ScrollScreen>
	)
}
