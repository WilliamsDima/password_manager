import { useTheme } from "@react-navigation/native"
import { useState } from "react"
import { Alert, StyleSheet, Text, View } from "react-native"
import { useSelector } from "react-redux"

import { LegacyDataError } from "@/entities/entry"
import { parseRecoveryKey, selectSessionUser, useVaultLock } from "@/entities/session"
import { strings } from "@/shared/config"
import { backupErrorMessage } from "@/shared/lib/backup-error-message"
import { AppError } from "@/shared/lib/errors"
import { lockErrorMessage } from "@/shared/lib/lock-error-message"
import { ErrorText, FormInput, LinkButton, PrimaryButton } from "@/shared/ui"

import type { ParsedBackup } from "../lib/backup-format"
import type { BackupInspection, ImportPlan } from "../model/types"
import { BackupVerificationError } from "../model/vault-backup-service"
import { useBackupServices } from "./backup-services"

const MAX_BACKUP_BYTES = 8 * 1024 * 1024
const MIME = "application/json"

type Step =
	| { readonly name: "idle" }
	/** A file was read; it may need a key before it can be checked. */
	| { readonly name: "key"; readonly parsed: ParsedBackup; readonly info: BackupInspection }
	/** The file is verified: waiting for the explicit confirmation. */
	| { readonly name: "confirm"; readonly plan: ImportPlan; readonly info: BackupInspection }
	/** The replacement went through but the check against the server did not finish. */
	| { readonly name: "verify"; readonly plan: ImportPlan }

const entriesFailedMessage = (error: unknown): string | null => {
	if (error instanceof LegacyDataError) {
		return `${strings.backup.legacyFailed} ${String(error.failedIds.length)}`
	}
	return error instanceof BackupVerificationError
		? `${strings.backup.entriesFailed} ${String(error.failedIds.length)}`
		: null
}

/** Russian plural: 1 запись, 2–4 записи, 5–20 записей, 21 запись… */
const records = (count: number): string => {
	const n = Math.abs(count) % 100
	const last = n % 10
	const word =
		n > 10 && n < 20
			? strings.backup.recordsMany
			: last === 1
				? strings.backup.recordsOne
				: last >= 2 && last <= 4
					? strings.backup.recordsFew
					: strings.backup.recordsMany
	return `${String(count)} ${word}`
}

const formatDate = (iso: string): string => {
	const date = new Date(iso)
	return Number.isNaN(date.getTime()) ? strings.backup.unknownDate : date.toLocaleString("ru-RU")
}

/**
 * Settings section: save the encrypted backup to a file or share it, load one back as a full
 * replacement (docs/CRYPTO.md §7). The replacement needs an explicit confirmation, offers to save
 * the current backup first, is checked against the server afterwards and is rolled back from the
 * old ciphertexts held in memory if the check does not match.
 */
export const BackupSection = () => {
	const { colors } = useTheme()
	const { backup, files } = useBackupServices()
	const lock = useVaultLock()
	const user = useSelector(selectSessionUser)
	const [step, setStep] = useState<Step>({ name: "idle" })
	const [keyText, setKeyText] = useState("")
	const [busy, setBusy] = useState(false)
	const [message, setMessage] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)

	const run = async (action: () => Promise<void>) => {
		setBusy(true)
		setError(null)
		setMessage(null)
		try {
			await action()
		} catch (caught) {
			setError(entriesFailedMessage(caught) ?? backupErrorMessage(caught))
		} finally {
			setBusy(false)
		}
	}

	/** Works on a copy of the vault key: a lock during a slow request zeroes the original in place. */
	const withDek = async <T,>(operation: (dek: Uint8Array) => Promise<T>): Promise<T> => {
		const dek = Uint8Array.from(lock.getDek())
		try {
			return await operation(dek)
		} finally {
			dek.fill(0)
		}
	}

	/** Exports the current data; `how` decides between the folder dialog and the share sheet. */
	const exportBackup = (how: "file" | "share") =>
		run(async () => {
			if (user === null) return
			const result = await withDek(dek => backup.createBackup(user.uid, user.email, dek))
			if (how === "share") {
				await files.share(result.fileName, MIME, result.json)
				setMessage(`${strings.backup.sharedDone}: ${records(result.count)}`)
				return
			}
			const saved = await files.saveToFolder(result.fileName, MIME, result.json)
			setMessage(
				saved === "saved"
					? `${strings.backup.saved}: ${records(result.count)}`
					: strings.backup.canceled,
			)
		})

	const pickFile = () =>
		run(async () => {
			if (user === null) return
			const text = await files.pickText([MIME, "text/plain"], MAX_BACKUP_BYTES)
			if (text === null) return
			const parsed = backup.parse(text)
			const info = await backup.inspect(user.uid, parsed)
			setKeyText("")
			if (info.keySource === "current") {
				const plan = await withDek(dek => backup.prepareImport(user.uid, dek, parsed))
				setStep({ name: "confirm", plan, info })
			} else {
				setStep({ name: "key", parsed, info })
			}
		})

	const checkWithKey = (current: Extract<Step, { name: "key" }>) =>
		run(async () => {
			if (user === null) return
			try {
				if (current.info.keySource === "legacy-key") {
					const plan = await withDek(dek =>
						backup.prepareImport(user.uid, dek, current.parsed, { legacyKey: keyText }),
					)
					setStep({ name: "confirm", plan, info: current.info })
					return
				}
				const parsedKey = parseRecoveryKey(keyText)
				if (!parsedKey.ok) {
					setError(
						lockErrorMessage(new AppError("invalid-recovery-key", `Invalid ${parsedKey.reason}`)),
					)
					return
				}
				try {
					const plan = await withDek(dek =>
						backup.prepareImport(user.uid, dek, current.parsed, { recoveryKey: parsedKey.key }),
					)
					setStep({ name: "confirm", plan, info: current.info })
				} finally {
					parsedKey.key.fill(0)
				}
			} finally {
				// The typed key must not stay in state after it has been used, success or not.
				setKeyText("")
			}
		})

	/** After the replacement: check the server; on a definite mismatch put the old data back. */
	const finishImport = async (plan: ImportPlan, dek: Uint8Array) => {
		const ok = await backup.verifyImport(plan, dek).catch(() => null)
		if (ok === null) {
			setStep({ name: "verify", plan })
			setError(strings.backup.verifyUnknown)
			return
		}
		setStep({ name: "idle" })
		if (ok) {
			setMessage(strings.backup.imported)
			return
		}
		const restored = await backup.rollbackImport(plan).then(
			() => true,
			() => false,
		)
		setError(restored ? strings.backup.rolledBack : strings.backup.verifyFailed)
	}

	const replace = (plan: ImportPlan) =>
		run(async () => {
			await withDek(async dek => {
				try {
					await backup.commitImport(plan)
				} catch (caught) {
					// A conflict means nothing changed: stay on the confirmation. Any other error (a lost
					// connection) can arrive after the server already committed, so do not pretend nothing happened.
					if (caught instanceof AppError && caught.code === "conflict") throw caught
					setStep({ name: "idle" })
					setError(strings.backup.commitUncertain)
					return
				}
				await finishImport(plan, dek)
			})
		})

	const retryVerify = (plan: ImportPlan) =>
		run(async () => {
			await withDek(dek => finishImport(plan, dek))
		})

	const confirmReplace = (plan: ImportPlan) => {
		Alert.alert(strings.backup.replaceConfirmTitle, strings.backup.replaceConfirmBody, [
			{ text: strings.backup.cancel, style: "cancel" },
			{ text: strings.backup.replace, style: "destructive", onPress: () => void replace(plan) },
		])
	}

	const cancel = () => {
		setStep({ name: "idle" })
		setKeyText("")
		setError(null)
	}

	return (
		<View style={styles.section}>
			<Text style={[styles.title, { color: colors.text }]}>{strings.backup.title}</Text>
			<Text style={[styles.hint, { color: colors.text }]}>{strings.backup.hint}</Text>
			{step.name === "idle" ? (
				<>
					<PrimaryButton
						label={strings.backup.saveFile}
						onPress={() => void exportBackup("file")}
						loading={busy}
					/>
					<LinkButton
						label={strings.backup.share}
						onPress={() => void exportBackup("share")}
						disabled={busy}
					/>
					<LinkButton label={strings.backup.load} onPress={() => void pickFile()} disabled={busy} />
				</>
			) : null}
			{step.name === "key" ? (
				<>
					<Text style={[styles.hint, { color: colors.text }]}>
						{step.info.keySource === "legacy-key"
							? strings.backup.needLegacyKey
							: strings.backup.needRecoveryKey}
					</Text>
					<FormInput
						placeholder={
							step.info.keySource === "legacy-key"
								? strings.backup.legacyKeyPlaceholder
								: strings.setup.recoveryPlaceholder
						}
						value={keyText}
						onChangeText={setKeyText}
						autoCapitalize={step.info.keySource === "legacy-key" ? "none" : "characters"}
						secureTextEntry={step.info.keySource === "legacy-key"}
						multiline={step.info.keySource !== "legacy-key"}
						editable={!busy}
					/>
					<PrimaryButton
						label={strings.backup.check}
						onPress={() => void checkWithKey(step)}
						disabled={keyText.trim().length === 0}
						loading={busy}
					/>
					<LinkButton label={strings.backup.cancel} onPress={cancel} disabled={busy} />
				</>
			) : null}
			{step.name === "confirm" ? (
				<>
					<Text style={[styles.warningTitle, { color: colors.notification }]}>
						{strings.backup.warningTitle}
					</Text>
					<Text style={[styles.hint, { color: colors.text }]}>
						{strings.backup.warning
							.replace("{current}", records(step.plan.current.length))
							.replace("{file}", records(step.plan.writes.length))
							.replace("{date}", formatDate(step.plan.exportedAt))}
					</Text>
					{step.plan.writes.length === 0 && step.plan.current.length > 0 ? (
						<Text style={[styles.warningTitle, { color: colors.notification }]}>
							{strings.backup.emptyFile}
						</Text>
					) : null}
					<PrimaryButton
						label={strings.backup.saveCurrentFirst}
						onPress={() => void exportBackup("file")}
						loading={busy}
					/>
					<LinkButton
						label={strings.backup.replace}
						onPress={() => {
							confirmReplace(step.plan)
						}}
						disabled={busy}
					/>
					<LinkButton label={strings.backup.cancel} onPress={cancel} disabled={busy} />
				</>
			) : null}
			{step.name === "verify" ? (
				<PrimaryButton
					label={strings.backup.retryVerify}
					onPress={() => void retryVerify(step.plan)}
					loading={busy}
				/>
			) : null}
			{message === null ? null : (
				<Text style={[styles.hint, { color: colors.primary }]}>{message}</Text>
			)}
			<ErrorText message={error} />
		</View>
	)
}

const styles = StyleSheet.create({
	section: { gap: 12, paddingTop: 24 },
	title: { fontSize: 20, fontWeight: "700" },
	hint: { fontSize: 14 },
	warningTitle: { fontSize: 16, fontWeight: "700" },
})
