import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSelector } from "react-redux"

import {
	LockoutError,
	selectSessionUser,
	useSignOutMutation,
	useVaultLock,
	useVaultLockState,
	useVaultRecovery,
} from "@/entities/session"
import { LockModeForm, type LockModeSubmit } from "@/features/lock-mode"
import { strings } from "@/shared/config"
import { isAppError } from "@/shared/lib/errors"
import { formatWait, lockErrorMessage } from "@/shared/lib/lock-error-message"
import { useHaptics } from "@/shared/services/haptics"
import {
	AppText,
	ErrorText,
	FormInput,
	LinkButton,
	PrimaryButton,
	Screen,
	ShakeView,
	useShake,
} from "@/shared/ui"

/** Lock screen: password / fingerprint, with the recovery key as the way back in (docs/CRYPTO.md §4). */
export const UnlockPage = () => {
	const lock = useVaultLock()
	const haptics = useHaptics()
	const shake = useShake()
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

	/** A canceled fingerprint prompt is the user's own choice, not a failure: no vibration, no shake. */
	const signalFailure = useCallback(
		(caught: unknown) => {
			if (isAppError(caught) && caught.code === "auth-canceled") return
			haptics.notify("error")
			shake.shake()
		},
		[haptics, shake],
	)

	const run = useCallback(
		async (action: () => Promise<void>) => {
			setBusy(true)
			setError(null)
			try {
				await action()
				haptics.notify("success")
			} catch (caught) {
				signalFailure(caught)
				if (caught instanceof LockoutError) setWaitMs(caught.retryAfterMs)
				else setError(lockErrorMessage(caught))
				await refreshWait()
			} finally {
				setBusy(false)
			}
		},
		[refreshWait, haptics, signalFailure],
	)

	const unlockBiometric = useCallback(
		() =>
			run(async () => {
				await lock.unlockWithBiometrics()
			}),
		[run, lock],
	)

	const submitPassword = useCallback(
		() =>
			run(async () => {
				await lock.unlockWithPassword(password)
				setPassword("")
			}),
		[run, lock, password],
	)

	const recoverKey = useCallback(
		() =>
			run(async () => {
				if (user === null) return
				const recovered = await recovery.recover(user.uid, keyText)
				dekRef.current = recovered
				setRecoveredDek(recovered)
				setKeyText("")
			}),
		[run, user, recovery, keyText],
	)

	const onRetryInit = useCallback(() => {
		if (user !== null) void lock.initialize(user.uid)
	}, [user, lock])

	const onSignOut = useCallback(() => {
		void signOut()
	}, [signOut])

	const onSubmitMode = useCallback(
		async ({ mode: chosen, password: chosenPassword }: LockModeSubmit) => {
			if (recoveredDek === null) return
			await lock.enroll({
				dek: recoveredDek,
				mode: chosen,
				...(chosenPassword === undefined ? {} : { password: chosenPassword }),
			})
			recoveredDek.fill(0)
			setRecoveredDek(null)
		},
		[lock, recoveredDek],
	)

	const onSubmitPassword = useCallback(() => {
		void submitPassword()
	}, [submitPassword])

	const onRecover = useCallback(() => {
		void recoverKey()
	}, [recoverKey])

	const onBiometric = useCallback(() => {
		void unlockBiometric()
	}, [unlockBiometric])

	const onForgot = useCallback(() => {
		setUseRecovery(true)
	}, [])

	const onBackToPassword = useCallback(() => {
		setUseRecovery(false)
	}, [])

	// Fingerprint prompt right away, unless Android dropped the key.
	useEffect(() => {
		if (mode !== "biometric" || biometricInvalidated) return
		lock.unlockWithBiometrics().then(
			() => {
				haptics.notify("success")
			},
			(caught: unknown) => {
				signalFailure(caught)
				setError(lockErrorMessage(caught))
			},
		)
	}, [mode, biometricInvalidated, lock, haptics, signalFailure])

	const view = useMemo(() => {
		const recoveryOnly = mode === "biometric" && biometricInvalidated
		const waiting = waitMs > 0
		return {
			recoveryOnly,
			showRecovery: useRecovery || recoveryOnly,
			biometricAvailable: lock.canUseBiometrics(),
			canRecover: keyText.trim().length > 0 && user !== null,
			waiting,
			hasError: error !== null,
			passwordEditable: !busy && !waiting,
			canSubmitPassword: password.length > 0 && !waiting,
			retryText: `${strings.lock.retryIn} ${formatWait(waitMs)}`,
		}
	}, [mode, biometricInvalidated, useRecovery, lock, keyText, user, waitMs, busy, password, error])

	if (status === "init-failed") {
		return (
			<Screen>
				<AppText variant="heading">{strings.lock.initFailed}</AppText>
				<PrimaryButton label={strings.lock.retry} onPress={onRetryInit} />
				<LinkButton label={strings.lock.signOut} onPress={onSignOut} />
			</Screen>
		)
	}

	if (recoveredDek !== null) {
		return (
			<Screen>
				<AppText variant="heading">{strings.setup.modeTitle}</AppText>
				<LockModeForm
					biometricAvailable={view.biometricAvailable}
					requireCurrentPassword={false}
					submitLabel={strings.setup.save}
					onSubmit={onSubmitMode}
				/>
			</Screen>
		)
	}

	return (
		<Screen>
			<AppText variant="title">{strings.lock.title}</AppText>
			{view.recoveryOnly ? <AppText>{strings.lock.biometricInvalidated}</AppText> : <></>}
			{view.showRecovery ? (
				<>
					<AppText>{strings.setup.recoveryHint}</AppText>
					<ShakeView style={shake.style}>
						<FormInput
							placeholder={strings.setup.recoveryPlaceholder}
							value={keyText}
							onChangeText={setKeyText}
							autoCapitalize="characters"
							multiline
							editable={!busy}
						/>
						<ErrorText message={error} />
					</ShakeView>
					<PrimaryButton
						label={strings.setup.recoveryNext}
						disabled={!view.canRecover}
						loading={busy}
						onPress={onRecover}
					/>
					{view.recoveryOnly ? (
						<></>
					) : (
						<LinkButton label={strings.lock.backToPassword} onPress={onBackToPassword} />
					)}
				</>
			) : (
				<>
					{mode === "password" ? (
						<>
							<ShakeView style={shake.style}>
								<FormInput
									placeholder={strings.lock.password}
									value={password}
									onChangeText={setPassword}
									secureTextEntry
									editable={view.passwordEditable}
									onSubmitEditing={onSubmitPassword}
								/>
								{view.waiting ? <AppText tone="danger">{view.retryText}</AppText> : <></>}
								<ErrorText message={error} />
							</ShakeView>
							<PrimaryButton
								label={strings.lock.unlock}
								disabled={!view.canSubmitPassword}
								loading={busy}
								onPress={onSubmitPassword}
							/>
						</>
					) : (
						<>
							{view.hasError ? (
								<ShakeView style={shake.style}>
									<ErrorText message={error} />
								</ShakeView>
							) : (
								<></>
							)}
							<PrimaryButton label={strings.lock.biometric} loading={busy} onPress={onBiometric} />
						</>
					)}
					<LinkButton label={strings.lock.forgot} onPress={onForgot} />
				</>
			)}
			<LinkButton label={strings.lock.signOut} onPress={onSignOut} />
		</Screen>
	)
}
