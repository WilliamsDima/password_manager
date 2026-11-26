import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSelector } from "react-redux"

import {
	selectSessionUser,
	useSignOutMutation,
	useVaultLock,
	useVaultRecovery,
} from "@/entities/session"
import type { LockModeSubmit } from "@/features/lock-mode"
import {
	type AccountSetupKind,
	type MigrationPlan,
	type NewAccountPlan,
	useVaultMigration,
} from "@/features/vault-migration"
import { strings } from "@/shared/config"
import { isAppError } from "@/shared/lib/errors"
import { useHaptics } from "@/shared/services/haptics"

import { confirmationProblem, onboardingErrorMessage } from "../lib/onboarding-messages"

/** The keys of one setup run: a v1 migration or a brand-new account. */
export type SetupFlow =
	| { readonly kind: "migrate"; readonly plan: MigrationPlan }
	| { readonly kind: "new"; readonly plan: NewAccountPlan }

export type Step =
	| { readonly name: "detecting" }
	| { readonly name: "recovery-key"; readonly notice: string | null }
	| { readonly name: "legacy-key" }
	| { readonly name: "show-key"; readonly flow: SetupFlow }
	| { readonly name: "confirm-key"; readonly flow: SetupFlow }
	| { readonly name: "saving"; readonly flow: SetupFlow }
	| { readonly name: "save-failed"; readonly flow: SetupFlow; readonly message: string }
	/** Only the key: the decrypted v1 data of the flow is not kept past the check. */
	| { readonly name: "choose-mode"; readonly dek: Uint8Array }
	| { readonly name: "restart"; readonly message: string }
	| { readonly name: "unsupported" }

/** Every secret array a step holds. */
const keysOf = (step: Step): readonly Uint8Array[] => {
	if ("flow" in step) return [step.flow.plan.recoveryKey, step.flow.plan.dek]
	return step.name === "choose-mode" ? [step.dek] : []
}

export type OnboardingState = {
	readonly step: Step
	readonly busy: boolean
	readonly error: string | null
	readonly canEnrollBiometrics: boolean
	readonly onRetryDetect: () => void
	readonly onSubmitLegacyKey: (text: string) => void
	readonly onSubmitRecoveryKey: (text: string) => void
	readonly onKeySaved: () => void
	readonly onBackToKey: () => void
	readonly onConfirmKey: (text: string) => void
	readonly onRetrySave: () => void
	readonly onRestart: () => void
	readonly onSubmitMode: (value: LockModeSubmit) => Promise<void>
	readonly onSignOut: () => void
}

/**
 * First start on this phone (docs/CRYPTO.md §2, §5, §6): the profile on the server decides what
 * happens. Keys live only in this hook's state; every step change zeroes the keys the next step
 * does not carry, and leaving the screen zeroes the rest.
 */
export const useOnboarding = (): OnboardingState => {
	const user = useSelector(selectSessionUser)
	const uid = user?.uid
	const email = user?.email ?? null
	const displayName = user?.displayName ?? null
	const migration = useVaultMigration()
	const recovery = useVaultRecovery()
	const lock = useVaultLock()
	const haptics = useHaptics()
	const [signOut] = useSignOutMutation()
	const [step, setStep] = useState<Step>({ name: "detecting" })
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const stepRef = useRef<Step>(step)
	/** One operation at a time: a second tap while one runs must not start a second one. */
	const runningRef = useRef(false)

	/** Moves to `next` and zeroes the keys of the old step that `next` does not carry. */
	const go = useCallback((next: Step) => {
		const keep = new Set(keysOf(next))
		keysOf(stepRef.current).forEach(key => {
			if (!keep.has(key)) key.fill(0)
		})
		stepRef.current = next
		setStep(next)
	}, [])

	// Whatever happens, no key outlives the screen.
	useEffect(
		() => () => {
			keysOf(stepRef.current).forEach(key => {
				key.fill(0)
			})
		},
		[],
	)

	const guarded = useCallback(
		async (action: () => Promise<void>, onError: (caught: unknown) => void) => {
			if (runningRef.current) return
			runningRef.current = true
			setBusy(true)
			setError(null)
			try {
				await action()
			} catch (caught) {
				haptics.notify("error")
				onError(caught)
			} finally {
				runningRef.current = false
				setBusy(false)
			}
		},
		[haptics],
	)

	const run = useCallback(
		(action: () => Promise<void>) =>
			guarded(action, caught => {
				setError(onboardingErrorMessage(caught))
			}),
		[guarded],
	)

	/** Writes the data and checks it on the server; a retry with the same plan is safe. */
	const save = useCallback(
		async (flow: SetupFlow) => {
			if (uid === undefined) return
			go({ name: "saving", flow })
			try {
				if (flow.kind === "new") {
					await migration.commitNewAccount(flow.plan, { email, displayName })
					await migration.verifyNewAccount(flow.plan)
					go({ name: "choose-mode", dek: flow.plan.dek })
					return
				}
				try {
					await migration.commit(flow.plan)
				} catch (caught) {
					// A retry after a lost answer: the data may be written already; the check decides.
					if (!(isAppError(caught) && caught.code === "conflict")) throw caught
				}
				const outcome = await migration.verify(flow.plan)
				if (outcome.status === "rolled-back") {
					// The saved pair stays: a new attempt shows the same recovery key (§6.3).
					go({ name: "restart", message: strings.onboarding.rolledBack })
					return
				}
				go({ name: "choose-mode", dek: flow.plan.dek })
			} catch (caught) {
				haptics.notify("error")
				if (isAppError(caught) && caught.code === "conflict") {
					// The server holds keys that are not ours: retrying cannot help, start over.
					await migration.clearPendingFor(uid).catch(() => undefined)
					go({ name: "restart", message: strings.onboarding.conflict })
					return
				}
				go({ name: "save-failed", flow, message: onboardingErrorMessage(caught) })
			}
		},
		[uid, email, displayName, migration, haptics, go],
	)

	/** Shows the new recovery key, or goes straight to the check when the run is being resumed. */
	const proceed = useCallback(
		async (flow: SetupFlow) => {
			if (flow.plan.stage === "verify") {
				await save(flow)
				return
			}
			go({ name: "show-key", flow })
		},
		[save, go],
	)

	const begin = useCallback(
		async (kind: "migrate" | "new", legacyKey: string, detectAgain: () => Promise<void>) => {
			if (uid === undefined) return
			if (kind === "migrate") {
				const plan = await migration.prepare(uid, legacyKey)
				await proceed({ kind: "migrate", plan })
				return
			}
			try {
				const plan = await migration.prepareNewAccount(uid)
				await proceed({ kind: "new", plan })
			} catch (caught) {
				// The account was set up elsewhere in the meantime: look at the server again.
				if (isAppError(caught) && caught.code === "conflict") {
					await detectAgain()
					return
				}
				throw caught
			}
		},
		[uid, migration, proceed],
	)

	const route = useCallback(
		async (kind: AccountSetupKind, detectAgain: () => Promise<void>) => {
			switch (kind) {
				case "has-keys":
					go({ name: "recovery-key", notice: null })
					return
				case "migrate":
				case "resume-migrate":
					go({ name: "legacy-key" })
					return
				case "migrate-empty":
					await begin("migrate", "", detectAgain)
					return
				case "new":
				case "resume-new":
					await begin("new", "", detectAgain)
					return
				case "unsupported":
					go({ name: "unsupported" })
			}
		},
		[go, begin],
	)

	const detect = useCallback(async () => {
		if (uid === undefined) return
		const detectOnce = async (afterConflict: boolean): Promise<void> => {
			const kind = await migration.detect(uid)
			if (afterConflict && kind === "has-keys") {
				go({ name: "recovery-key", notice: strings.onboarding.otherDevice })
				return
			}
			await route(kind, () => detectOnce(true))
		}
		await run(() => detectOnce(false))
	}, [uid, migration, route, run, go])

	// The first check starts in a promise callback, not in the effect body (no setState in effects).
	useEffect(() => {
		const token = { cancelled: false }
		void Promise.resolve().then(() => {
			if (!token.cancelled) return detect()
			return undefined
		})
		return () => {
			token.cancelled = true
		}
	}, [detect])

	const onRestart = useCallback(() => {
		go({ name: "detecting" })
		void detect()
	}, [go, detect])

	const onSubmitLegacyKey = useCallback(
		(text: string) => {
			void run(() => begin("migrate", text, detect))
		},
		[run, begin, detect],
	)

	const onSubmitRecoveryKey = useCallback(
		(text: string) => {
			void run(async () => {
				if (uid === undefined) return
				go({ name: "choose-mode", dek: await recovery.recover(uid, text) })
			})
		},
		[run, uid, recovery, go],
	)

	const onKeySaved = useCallback(() => {
		const current = stepRef.current
		if (current.name !== "show-key") return
		setError(null)
		go({ name: "confirm-key", flow: current.flow })
	}, [go])

	const onBackToKey = useCallback(() => {
		const current = stepRef.current
		if (current.name !== "confirm-key") return
		setError(null)
		go({ name: "show-key", flow: current.flow })
	}, [go])

	const onConfirmKey = useCallback(
		(text: string) => {
			const current = stepRef.current
			if (current.name !== "confirm-key" || runningRef.current) return
			const problem = confirmationProblem(text, current.flow.plan.recoveryKey)
			if (problem !== null) {
				haptics.notify("error")
				setError(problem)
				return
			}
			setError(null)
			void guarded(
				() => save(current.flow),
				() => undefined,
			)
		},
		[haptics, guarded, save],
	)

	const onRetrySave = useCallback(() => {
		const current = stepRef.current
		if (current.name !== "save-failed") return
		void guarded(
			() => save(current.flow),
			() => undefined,
		)
	}, [guarded, save])

	const onSubmitMode = useCallback(
		async ({ mode, password }: LockModeSubmit) => {
			const current = stepRef.current
			if (current.name !== "choose-mode" || uid === undefined) return
			await lock.enroll({ dek: current.dek, mode, ...(password === undefined ? {} : { password }) })
			// The key is in the regular key storage now, so a saved pair of this account can go. If
			// removing it fails, the app is already set up: a leftover pair is removed on the next setup.
			await migration.clearPendingFor(uid).catch(() => undefined)
			go({ name: "detecting" })
		},
		[lock, migration, uid, go],
	)

	const onSignOut = useCallback(() => {
		void signOut()
	}, [signOut])

	return useMemo(
		() => ({
			step,
			busy,
			error,
			canEnrollBiometrics: lock.canUseBiometrics(),
			onRetryDetect: onRestart,
			onSubmitLegacyKey,
			onSubmitRecoveryKey,
			onKeySaved,
			onBackToKey,
			onConfirmKey,
			onRetrySave,
			onRestart,
			onSubmitMode,
			onSignOut,
		}),
		[
			step,
			busy,
			error,
			lock,
			onRestart,
			onSubmitLegacyKey,
			onSubmitRecoveryKey,
			onKeySaved,
			onBackToKey,
			onConfirmKey,
			onRetrySave,
			onSubmitMode,
			onSignOut,
		],
	)
}
