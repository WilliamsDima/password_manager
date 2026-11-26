import { LockModeForm } from "@/features/lock-mode"
import { strings } from "@/shared/config"
import { AppText, ScrollScreen } from "@/shared/ui"

import { useOnboarding } from "../model/use-onboarding"
import { KeyInputStep } from "./key-input-step"
import { ShowKeyStep } from "./show-key-step"
import { MessageStep, WorkingStep } from "./status-steps"

/**
 * Setup of the vault on this phone, step by step (docs/CRYPTO.md §2, §5, §6): the account on the
 * server decides whether the recovery key is entered, the v1 data is migrated or a new account is
 * created. The last step is always the choice of the sign-in mode.
 */
export const OnboardingFlow = () => {
	const state = useOnboarding()
	const { step } = state

	switch (step.name) {
		case "detecting":
			return (
				<WorkingStep
					text={strings.onboarding.detecting}
					error={state.error}
					onRetry={state.onRetryDetect}
				/>
			)
		case "unsupported":
			return (
				<MessageStep
					title={strings.setup.title}
					message={strings.onboarding.unsupported}
					actionLabel={null}
					onAction={state.onRestart}
					onSignOut={state.onSignOut}
				/>
			)
		case "recovery-key":
			return (
				<KeyInputStep
					title={strings.setup.title}
					hint={strings.setup.recoveryHint}
					notice={step.notice}
					placeholder={strings.setup.recoveryPlaceholder}
					submitLabel={strings.setup.recoveryNext}
					secure={false}
					busy={state.busy}
					error={state.error}
					secondaryLabel={strings.lock.signOut}
					onSubmit={state.onSubmitRecoveryKey}
					onSecondary={state.onSignOut}
				/>
			)
		case "legacy-key":
			return (
				<KeyInputStep
					title={strings.onboarding.legacy.title}
					hint={strings.onboarding.legacy.hint}
					placeholder={strings.onboarding.legacy.placeholder}
					submitLabel={strings.onboarding.legacy.next}
					secure
					busy={state.busy}
					error={state.error}
					secondaryLabel={strings.lock.signOut}
					onSubmit={state.onSubmitLegacyKey}
					onSecondary={state.onSignOut}
				/>
			)
		case "show-key":
			return <ShowKeyStep recoveryKey={step.flow.plan.recoveryKey} onContinue={state.onKeySaved} />
		case "confirm-key":
			return (
				<KeyInputStep
					title={strings.onboarding.confirm.title}
					hint={strings.onboarding.confirm.hint}
					placeholder={strings.onboarding.confirm.placeholder}
					submitLabel={strings.onboarding.confirm.check}
					secure={false}
					busy={false}
					error={state.error}
					secondaryLabel={strings.onboarding.confirm.back}
					onSubmit={state.onConfirmKey}
					onSecondary={state.onBackToKey}
				/>
			)
		case "saving":
			return (
				<WorkingStep text={strings.onboarding.saving} error={null} onRetry={state.onRetrySave} />
			)
		case "save-failed":
			return (
				<MessageStep
					title={strings.onboarding.saveFailedTitle}
					message={step.message}
					actionLabel={strings.onboarding.retry}
					onAction={state.onRetrySave}
					onSignOut={state.onSignOut}
				/>
			)
		case "restart":
			return (
				<MessageStep
					title={strings.onboarding.saveFailedTitle}
					message={step.message}
					actionLabel={strings.onboarding.restart}
					onAction={state.onRestart}
					onSignOut={state.onSignOut}
				/>
			)
		case "choose-mode":
			return (
				<ScrollScreen>
					<AppText variant="title">{strings.setup.modeTitle}</AppText>
					<LockModeForm
						biometricAvailable={state.canEnrollBiometrics}
						requireCurrentPassword={false}
						submitLabel={strings.setup.save}
						onSubmit={state.onSubmitMode}
					/>
				</ScrollScreen>
			)
	}
}
