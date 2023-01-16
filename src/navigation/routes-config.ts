import COLORS from "../services/colors"

export const screenOptions = {
	headerStyle: {
		borderBottomWidth: 0,
		// android
		elevation: 0,
		// ios
		shadowOpacity: 0,
		backgroundColor: COLORS.MAIN,
	},
}

const horizontalAnimation = {
	cardStyleInterpolator: ({ current, layouts }) => {
		return {
			cardStyle: {
				transform: [
					{
						translateX: current.progress.interpolate({
							inputRange: [0, 1],
							outputRange: [layouts.screen.width, 0],
						}),
					},
				],
			},
		}
	},
}

export const stackOptions = {
	...horizontalAnimation,
	presentation: "transparentModal",
	animationTypeForReplace: "push",
	animation: "slide_from_left",
}
