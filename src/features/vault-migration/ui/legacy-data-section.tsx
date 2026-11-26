import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Alert } from "react-native"
import { useSelector } from "react-redux"

import { selectSessionUser } from "@/entities/session"
import { strings } from "@/shared/config"
import { useHaptics } from "@/shared/services/haptics"
import { AppText, Card, ErrorText, SecondaryButton } from "@/shared/ui"

import { useVaultMigration } from "./migration-services"

type Status = "checking" | "none" | "present" | "deleting" | "done" | "failed"

/**
 * Settings section: deletes the old v1 copy of the passwords from the account (docs/CRYPTO.md
 * §6.7, task 7.5). Shown only while that copy exists. The user triggers it and confirms; nothing
 * is deleted automatically, and the new entries are never touched.
 */
export const LegacyDataSection = () => {
	const migration = useVaultMigration()
	const user = useSelector(selectSessionUser)
	const haptics = useHaptics()
	const uid = user?.uid
	const [status, setStatus] = useState<Status>("checking")
	// Two dialogs from a double tap must not run two deletions (the second could report a failure
	// after the first one succeeded).
	const running = useRef(false)

	// The first check runs in a promise callback, not in the effect body (no setState in effects).
	useEffect(() => {
		if (uid === undefined) return undefined
		const token = { cancelled: false }
		void migration.hasLegacyData(uid).then(
			present => {
				if (!token.cancelled) setStatus(present ? "present" : "none")
			},
			() => {
				// Offline or unreadable: stay hidden; the section appears at the next visit.
				if (!token.cancelled) setStatus("none")
			},
		)
		return () => {
			token.cancelled = true
		}
	}, [migration, uid])

	const remove = useCallback(async () => {
		if (uid === undefined || running.current) return
		running.current = true
		setStatus("deleting")
		try {
			await migration.deleteLegacyData(uid)
			haptics.notify("success")
			setStatus("done")
		} catch {
			haptics.notify("error")
			setStatus("failed")
			running.current = false
		}
	}, [migration, uid, haptics])

	const onPress = useCallback(() => {
		Alert.alert(strings.legacyData.confirmTitle, strings.legacyData.confirmBody, [
			{ text: strings.legacyData.cancel, style: "cancel" },
			{ text: strings.legacyData.confirm, style: "destructive", onPress: () => void remove() },
		])
	}, [remove])

	const view = useMemo(
		() => ({
			visible: status === "present" || status === "deleting" || status === "failed",
			done: status === "done",
			deleting: status === "deleting",
			error: status === "failed" ? strings.legacyData.failed : null,
		}),
		[status],
	)

	if (view.done) {
		return (
			<Card>
				<AppText tone="success">{strings.legacyData.done}</AppText>
			</Card>
		)
	}
	if (!view.visible) return <></>

	return (
		<Card>
			<AppText variant="heading">{strings.legacyData.title}</AppText>
			<AppText variant="caption" tone="muted">
				{strings.legacyData.hint}
			</AppText>
			<AppText variant="caption" tone="danger">
				{strings.legacyData.warning}
			</AppText>
			<SecondaryButton
				label={strings.legacyData.delete}
				tone="danger"
				onPress={onPress}
				loading={view.deleting}
			/>
			<ErrorText message={view.error} />
		</Card>
	)
}
