import { useCallback, useMemo, useState } from "react"
import { Alert } from "react-native"
import { useSelector } from "react-redux"

import { LegacyDataError } from "@/entities/entry"
import { parseRecoveryKey, selectSessionUser, useVaultLock } from "@/entities/session"
import { strings } from "@/shared/config"
import { backupErrorMessage } from "@/shared/lib/backup-error-message"
import { AppError } from "@/shared/lib/errors"
import { lockErrorMessage } from "@/shared/lib/lock-error-message"
import { AppText, Card, ErrorText, FormInput, LinkButton, PrimaryButton } from "@/shared/ui"

import type { ParsedBackup } from "../lib/backup-format"
import type { BackupInspection, ImportPlan } from "../model/types"
import { BackupVerificationError } from "../model/vault-backup-service"
import { useBackupServices } from "./backup-services"

const MAX_BACKUP_BYTES = 8 * 1024 * 1024
const MIME = "application/json"

/** Props of the key field per key source: a pasted multi-line recovery key or a hidden v1 key. */
const RECOVERY_KEY_FIELD = {
	placeholder: strings.setup.recoveryPlaceholder,
	autoCapitalize: "characters",
	secureTextEntry: false,
	multiline: true,
} as const

const LEGACY_KEY_FIELD = {
	placeholder: strings.backup.legacyKeyPlaceholder,
	autoCapitalize: "none",
	secureTextEntry: true,
	multiline: false,
} as const

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
	const { backup, files } = useBackupServices()
	const lock = useVaultLock()
	const user = useSelector(selectSessionUser)
	const [step, setStep] = useState<Step>({ name: "idle" })
	const [keyText, setKeyText] = useState("")
	const [busy, setBusy] = useState(false)
	const [message, setMessage] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)

	const run = useCallback(async (action: () => Promise<void>) => {
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
	}, [])

	/** Works on a copy of the vault key: a lock during a slow request zeroes the original in place. */
	const withDek = useCallback(
		async <T,>(operation: (dek: Uint8Array) => Promise<T>): Promise<T> => {
			const dek = Uint8Array.from(lock.getDek())
			try {
				return await operation(dek)
			} finally {
				dek.fill(0)
			}
		},
		[lock],
	)

	/** Exports the current data; `how` decides between the folder dialog and the share sheet. */
	const exportBackup = useCallback(
		(how: "file" | "share") =>
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
			}),
		[run, user, withDek, backup, files],
	)

	const pickFile = useCallback(
		() =>
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
			}),
		[run, user, files, backup, withDek],
	)

	const checkWithKey = useCallback(
		(current: Extract<Step, { name: "key" }>) =>
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
			}),
		[run, user, withDek, backup, keyText],
	)

	/** After the replacement: check the server; on a definite mismatch put the old data back. */
	const finishImport = useCallback(
		async (plan: ImportPlan, dek: Uint8Array) => {
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
		},
		[backup],
	)

	const replace = useCallback(
		(plan: ImportPlan) =>
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
			}),
		[run, withDek, backup, finishImport],
	)

	const retryVerify = useCallback(
		(plan: ImportPlan) =>
			run(async () => {
				await withDek(dek => finishImport(plan, dek))
			}),
		[run, withDek, finishImport],
	)

	const confirmReplace = useCallback(
		(plan: ImportPlan) => {
			Alert.alert(strings.backup.replaceConfirmTitle, strings.backup.replaceConfirmBody, [
				{ text: strings.backup.cancel, style: "cancel" },
				{ text: strings.backup.replace, style: "destructive", onPress: () => void replace(plan) },
			])
		},
		[replace],
	)

	const cancel = useCallback(() => {
		setStep({ name: "idle" })
		setKeyText("")
		setError(null)
	}, [])

	const onSaveFile = useCallback(() => {
		void exportBackup("file")
	}, [exportBackup])

	const onShare = useCallback(() => {
		void exportBackup("share")
	}, [exportBackup])

	const onPickFile = useCallback(() => {
		void pickFile()
	}, [pickFile])

	const onCheckKey = useCallback(() => {
		if (step.name === "key") void checkWithKey(step)
	}, [step, checkWithKey])

	const onReplace = useCallback(() => {
		if (step.name === "confirm") confirmReplace(step.plan)
	}, [step, confirmReplace])

	const onRetryVerify = useCallback(() => {
		if (step.name === "verify") void retryVerify(step.plan)
	}, [step, retryVerify])

	const view = useMemo(() => {
		const legacy = step.name === "key" && step.info.keySource === "legacy-key"
		const plan = step.name === "confirm" ? step.plan : null
		return {
			isIdle: step.name === "idle",
			isKey: step.name === "key",
			isConfirm: step.name === "confirm",
			isVerify: step.name === "verify",
			keyHint: legacy ? strings.backup.needLegacyKey : strings.backup.needRecoveryKey,
			keyField: legacy ? LEGACY_KEY_FIELD : RECOVERY_KEY_FIELD,
			canCheckKey: keyText.trim().length > 0,
			warningText:
				plan === null
					? ""
					: strings.backup.warning
							.replace("{current}", records(plan.current.length))
							.replace("{file}", records(plan.writes.length))
							.replace("{date}", formatDate(plan.exportedAt)),
			showEmptyFileWarning: plan !== null && plan.writes.length === 0 && plan.current.length > 0,
		}
	}, [step, keyText])

	return (
		<Card>
			<AppText variant="heading">{strings.backup.title}</AppText>
			<AppText tone="muted" variant="caption">
				{strings.backup.hint}
			</AppText>
			{view.isIdle ? (
				<>
					<PrimaryButton label={strings.backup.saveFile} onPress={onSaveFile} loading={busy} />
					<LinkButton label={strings.backup.share} onPress={onShare} disabled={busy} />
					<LinkButton label={strings.backup.load} onPress={onPickFile} disabled={busy} />
				</>
			) : (
				<></>
			)}
			{view.isKey ? (
				<>
					<AppText tone="muted" variant="caption">
						{view.keyHint}
					</AppText>
					<FormInput
						{...view.keyField}
						value={keyText}
						onChangeText={setKeyText}
						editable={!busy}
					/>
					<PrimaryButton
						label={strings.backup.check}
						onPress={onCheckKey}
						disabled={!view.canCheckKey}
						loading={busy}
					/>
					<LinkButton label={strings.backup.cancel} onPress={cancel} disabled={busy} />
				</>
			) : (
				<></>
			)}
			{view.isConfirm ? (
				<>
					<AppText variant="label" tone="danger">
						{strings.backup.warningTitle}
					</AppText>
					<AppText tone="muted" variant="caption">
						{view.warningText}
					</AppText>
					{view.showEmptyFileWarning ? (
						<AppText variant="label" tone="danger">
							{strings.backup.emptyFile}
						</AppText>
					) : (
						<></>
					)}
					<PrimaryButton
						label={strings.backup.saveCurrentFirst}
						onPress={onSaveFile}
						loading={busy}
					/>
					<LinkButton label={strings.backup.replace} onPress={onReplace} disabled={busy} />
					<LinkButton label={strings.backup.cancel} onPress={cancel} disabled={busy} />
				</>
			) : (
				<></>
			)}
			{view.isVerify ? (
				<PrimaryButton label={strings.backup.retryVerify} onPress={onRetryVerify} loading={busy} />
			) : (
				<></>
			)}
			{message === null ? (
				<></>
			) : (
				<AppText tone="primary" variant="caption">
					{message}
				</AppText>
			)}
			<ErrorText message={error} />
		</Card>
	)
}
