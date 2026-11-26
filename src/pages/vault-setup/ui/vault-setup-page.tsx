import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSelector } from "react-redux"

import { LockModeForm, type LockModeSubmit } from "@/features/lock-mode"
import {
	selectSessionUser,
	useSignOutMutation,
	useVaultLock,
	useVaultRecovery,
} from "@/entities/session"
import { strings } from "@/shared/config"
import { lockErrorMessage } from "@/shared/lib/lock-error-message"
import { AppText, ErrorText, FormInput, LinkButton, PrimaryButton, Screen } from "@/shared/ui"

/**
 * First start on this phone: the recovery key opens the account's DEK (checked against the
 * server), then the user picks how the app is protected. The DEK is held only in this component's
 * closure until `enroll` stores it, and is zeroed afterwards.
 */
export const VaultSetupPage = () => {
	const user = useSelector(selectSessionUser)
	const lock = useVaultLock()
	const recovery = useVaultRecovery()
	const [signOut] = useSignOutMutation()
	const [keyText, setKeyText] = useState("")
	const [dek, setDek] = useState<Uint8Array | null>(null)
	const dekRef = useRef<Uint8Array | null>(null)

	// The key must not outlive the page if the user leaves before choosing a mode.
	useEffect(
		() => () => {
			dekRef.current?.fill(0)
		},
		[],
	)
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const checkKey = useCallback(async () => {
		if (user === null) return
		setBusy(true)
		setError(null)
		try {
			const recovered = await recovery.recover(user.uid, keyText)
			dekRef.current = recovered
			setDek(recovered)
			setKeyText("")
		} catch (caught) {
			setError(lockErrorMessage(caught))
		} finally {
			setBusy(false)
		}
	}, [user, recovery, keyText])

	const view = useMemo(
		() => ({
			canCheckKey: keyText.trim().length > 0,
			biometricAvailable: lock.canUseBiometrics(),
		}),
		[keyText, lock],
	)

	const onCheckKey = useCallback(() => {
		void checkKey()
	}, [checkKey])

	const onSignOut = useCallback(() => {
		void signOut()
	}, [signOut])

	const onSubmitMode = useCallback(
		async ({ mode, password }: LockModeSubmit) => {
			if (dek === null) return
			await lock.enroll({ dek, mode, ...(password === undefined ? {} : { password }) })
			dek.fill(0)
			setDek(null)
		},
		[dek, lock],
	)

	if (dek === null) {
		return (
			<Screen>
				<AppText variant="title">{strings.setup.title}</AppText>
				<AppText>{strings.setup.recoveryHint}</AppText>
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
					onPress={onCheckKey}
					disabled={!view.canCheckKey}
					loading={busy}
				/>
				<LinkButton label={strings.lock.signOut} onPress={onSignOut} />
			</Screen>
		)
	}

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
