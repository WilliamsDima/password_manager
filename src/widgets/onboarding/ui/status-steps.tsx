import { ActivityIndicator } from "react-native"

import { strings } from "@/shared/config"
import { useAppTheme } from "@/shared/theme"
import { AppText, ErrorText, LinkButton, PrimaryButton, Screen } from "@/shared/ui"

/** A centered spinner with a text (checking the account, saving). */
export const WorkingStep = ({
	text,
	error,
	onRetry,
}: {
	readonly text: string
	readonly error: string | null
	readonly onRetry: () => void
}) => {
	const { colors } = useAppTheme()
	return (
		<Screen>
			{error === null ? (
				<>
					<ActivityIndicator color={colors.primary} accessibilityLabel={text} />
					<AppText align="center">{text}</AppText>
				</>
			) : (
				<>
					<ErrorText message={error} />
					<PrimaryButton label={strings.onboarding.retry} onPress={onRetry} />
				</>
			)}
		</Screen>
	)
}

/** A message with one main action and a way out (sign out). */
export const MessageStep = ({
	title,
	message,
	actionLabel,
	onAction,
	onSignOut,
}: {
	readonly title: string
	readonly message: string
	readonly actionLabel: string | null
	readonly onAction: () => void
	readonly onSignOut: () => void
}) => (
	<Screen>
		<AppText variant="title">{title}</AppText>
		<AppText>{message}</AppText>
		{actionLabel === null ? <></> : <PrimaryButton label={actionLabel} onPress={onAction} />}
		<LinkButton label={strings.lock.signOut} onPress={onSignOut} />
	</Screen>
)
