import { useTheme } from "@react-navigation/native"
import { useCallback, useEffect, useRef, useState } from "react"
import { StyleSheet, Text } from "react-native"
import { useSelector } from "react-redux"

import {
	LockoutError,
	selectSessionUser,
	useSignOutMutation,
	useVaultLock,
	useVaultLockState,
	useVaultRecovery,
} from "@/entities/session"
import { LockModeForm } from "@/features/lock-mode"
import { strings } from "@/shared/config"
import { formatWait, lockErrorMessage } from "@/shared/lib/lock-error-message"
import { ErrorText, FormInput, LinkButton, PrimaryButton, Screen } from "@/shared/ui"

/** Lock screen: password / fingerprint, with the recovery key as the way back in (docs/CRYPTO.md §4). */
export const UnlockPage = () => {
	const { colors } = useTheme()
	const lock = useVaultLock()
	const recovery = useVaultRecovery()
	const { status, mode, biometricInvalidated } = useVaultLockState()
	const user = useSelector(selectSessionUser)
	const [signOut] = useSignOutMutation()
	const [password, setPassword] = useState("")
	const [keyText, setKeyText] = useState("")
	const [recoveredDek, setRecoveredDek] = useState<Uint8Array | null>(null)
	const dekRef = useRef<Uint8Array | null>(null)
	const [useRecovery, setUseRecovery] = useState(false)
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [waitMs, setWaitMs] = useState(0)

	// The recovered key must not outlive the page if the user leaves before choosing a mode.
	useEffect(
		() => () => {
			dekRef.current?.fill(0)
		},
		[],
	)

	const refreshWait = useCallback(async () => {
		setWaitMs(await lock.getRetryAfterMs())
	}, [lock])

	// Countdown after failed attempts (the first read happens in a promise callback, not in the effect body).
	useEffect(() => {
		const token = { cancelled: false }
		void lock.getRetryAfterMs().then(ms => {
			if (!token.cancelled) setWaitMs(ms)
		})
		return () => {
			token.cancelled = true
		}
	}, [lock])
	useEffect(() => {
		if (waitMs <= 0) return undefined
		const timer = setTimeout(
			() => {
				void refreshWait()
			},
			Math.min(waitMs, 1000),
		)
		return () => {
			clearTimeout(timer)
		}
	}, [waitMs, refreshWait])

	const run = async (action: () => Promise<void>) => {
		setBusy(true)
		setError(null)
		try {
			await action()
		} catch (caught) {
			if (caught instanceof LockoutError) setWaitMs(caught.retryAfterMs)
			else setError(lockErrorMessage(caught))
			await refreshWait()
		} finally {
			setBusy(false)
		}
	}

	const unlockBiometric = useCallback(
		() =>
			run(async () => {
				await lock.unlockWithBiometrics()
			}),
		// eslint-disable-next-line react-hooks/exhaustive-deps -- `run` only closes over stable setters and `lock`
		[lock],
	)

	// Fingerprint prompt right away, unless Android dropped the key.
	useEffect(() => {
		if (mode !== "biometric" || biometricInvalidated) return
		lock.unlockWithBiometrics().catch((caught: unknown) => {
			setError(lockErrorMessage(caught))
		})
	}, [mode, biometricInvalidated, lock])

	if (status === "init-failed") {
		return (
			<Screen>
				<Text style={[styles.title, { color: colors.text }]}>{strings.lock.initFailed}</Text>
				<PrimaryButton
					label={strings.lock.retry}
					onPress={() => {
						if (user !== null) void lock.initialize(user.uid)
					}}
				/>
				<LinkButton label={strings.lock.signOut} onPress={() => void signOut()} />
			</Screen>
		)
	}

	const recoveryOnly = mode === "biometric" && biometricInvalidated
	const showRecovery = useRecovery || recoveryOnly

	if (recoveredDek !== null) {
		return (
			<Screen>
				<Text style={[styles.title, { color: colors.text }]}>{strings.setup.modeTitle}</Text>
				<LockModeForm
					biometricAvailable={lock.canUseBiometrics()}
					requireCurrentPassword={false}
					submitLabel={strings.setup.save}
					onSubmit={async ({ mode: chosen, password: chosenPassword }) => {
						await lock.enroll({
							dek: recoveredDek,
							mode: chosen,
							...(chosenPassword === undefined ? {} : { password: chosenPassword }),
						})
						recoveredDek.fill(0)
						setRecoveredDek(null)
					}}
				/>
			</Screen>
		)
	}

	return (
		<Screen>
			<Text style={[styles.title, { color: colors.text }]}>{strings.lock.title}</Text>
			{recoveryOnly ? (
				<Text style={[styles.text, { color: colors.text }]}>
					{strings.lock.biometricInvalidated}
				</Text>
			) : null}
			{showRecovery ? (
				<>
					<Text style={[styles.text, { color: colors.text }]}>{strings.setup.recoveryHint}</Text>
					<FormInput
						placeholder={strings.setup.recoveryPlaceholder}
						value={keyText}
						onChangeText={setKeyText}
						autoCapitalize="characters"
						multiline
						editable={!busy}
					/>
					<ErrorText message={error} />
					<PrimaryButton
						label={strings.setup.recoveryNext}
						disabled={keyText.trim().length === 0 || user === null}
						loading={busy}
						onPress={() =>
							void run(async () => {
								if (user === null) return
								const recovered = await recovery.recover(user.uid, keyText)
								dekRef.current = recovered
								setRecoveredDek(recovered)
								setKeyText("")
							})
						}
					/>
					{recoveryOnly ? null : (
						<LinkButton
							label={strings.lock.backToPassword}
							onPress={() => {
								setUseRecovery(false)
							}}
						/>
					)}
				</>
			) : (
				<>
					{mode === "password" ? (
						<>
							<FormInput
								placeholder={strings.lock.password}
								value={password}
								onChangeText={setPassword}
								secureTextEntry
								editable={!busy && waitMs <= 0}
								onSubmitEditing={() =>
									void run(async () => {
										await lock.unlockWithPassword(password)
										setPassword("")
									})
								}
							/>
							{waitMs > 0 ? (
								<Text style={[styles.text, { color: colors.notification }]}>
									{`${strings.lock.retryIn} ${formatWait(waitMs)}`}
								</Text>
							) : null}
							<ErrorText message={error} />
							<PrimaryButton
								label={strings.lock.unlock}
								disabled={password.length === 0 || waitMs > 0}
								loading={busy}
								onPress={() =>
									void run(async () => {
										await lock.unlockWithPassword(password)
										setPassword("")
									})
								}
							/>
						</>
					) : (
						<>
							<ErrorText message={error} />
							<PrimaryButton
								label={strings.lock.biometric}
								loading={busy}
								onPress={() => void unlockBiometric()}
							/>
						</>
					)}
					<LinkButton
						label={strings.lock.forgot}
						onPress={() => {
							setUseRecovery(true)
						}}
					/>
				</>
			)}
			<LinkButton label={strings.lock.signOut} onPress={() => void signOut()} />
		</Screen>
	)
}

const styles = StyleSheet.create({
	title: { fontSize: 24, fontWeight: "700" },
	text: { fontSize: 15 },
})
