import React, { FC, useEffect, useRef, useState } from "react"
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Animated,
	Easing,
	LayoutAnimation,
} from "react-native"
import { Swipeable } from "react-native-gesture-handler"
import { useActions } from "../../../hooks/useActions"
import {
	toggleAnimation,
	toggleAnimationHeight,
} from "../../../services/animation"
import COLORS from "../../../services/colors"
import { WIDTH } from "../../../services/constants"
import { IItem } from "../../../services/types"
import DescriptionItem from "../../atoms/DescriptionItem"
import PressedBtn from "../../atoms/PressedBtn"
import { openLeft } from "./LeftBtn"
import { openRight } from "./RightBtn"
import IconMeterial from "react-native-vector-icons/MaterialCommunityIcons"

type TListItem = {
	item: IItem
}

const ListItem: FC<TListItem> = ({ item }) => {
	const { deleteItem } = useActions()

	const [hidden, setHidden] = useState(true)
	const [animDeleteStart, setAnimDeleteStart] = useState(false)
	const [animOpenStart, setAnimOpenStart] = useState(false)

	const animatedController = useRef(new Animated.Value(0)).current
	const animatedDeleteController = useRef(new Animated.Value(0)).current

	const deleteAnim = useRef(new Animated.Value(0)).current

	const translateXAnim = deleteAnim.interpolate({
		inputRange: [0, 100],
		outputRange: [0, -WIDTH],
	})

	const getAnimationStyles = () => ({
		transform: [
			{
				translateX: translateXAnim,
			},
		],
	})

	const animItem = (deleteMode?: Boolean) => {
		const config = {
			duration: 300,
			toValue: animDeleteStart ? 0 : 1,
			easing: Easing.bezier(0.4, 0.0, 0.2, 1),
			useNativeDriver: false,
		}

		Animated.timing(animatedDeleteController, config).start(() => {
			if (deleteMode) {
				console.log("delete")
				deleteItem(item.id)
			}
		})
		LayoutAnimation.configureNext(toggleAnimationHeight)
	}

	const runAnimationDelete = () => {
		Animated.timing(deleteAnim, {
			delay: 0,
			toValue: 100,
			duration: 50,
			easing: Easing.out(Easing.sin),
			useNativeDriver: true,
		}).start(() => {
			setAnimDeleteStart(true)
			animItem(true)
		})
	}

	const toggleListItem = () => {
		const config = {
			duration: 300,
			toValue: hidden ? 0 : 1,
			easing: Easing.bezier(0.4, 0.0, 0.2, 1),
			useNativeDriver: false,
		}

		Animated.timing(animatedController, config).start()
		LayoutAnimation.configureNext(toggleAnimation)
		setHidden(!hidden)
	}

	const deleteHandler = () => {
		runAnimationDelete()
	}

	useEffect(() => {
		if (!animOpenStart) {
			setAnimOpenStart(true)
			animItem()
		}
	}, [])

	return (
		<Animated.View
			style={[getAnimationStyles(), animDeleteStart && { height: 0 }]}
		>
			<Swipeable
				rightThreshold={WIDTH / 3}
				leftThreshold={WIDTH / 3}
				onSwipeableRightOpen={deleteHandler}
				onSwipeableLeftWillOpen={toggleListItem}
				overshootRight={true}
				overshootLeft={false}
				renderRightActions={openRight}
				renderLeftActions={openLeft}
			>
				<View style={[styles.item, hidden && { paddingBottom: 15 }]}>
					<Text style={styles.title}>{item.title}</Text>

					<TouchableOpacity
						onPress={toggleListItem}
						style={[styles.showBlock, hidden && styles.hide]}
					>
						{hidden ? (
							<Text style={styles.hideText}>.......</Text>
						) : (
							<>
								<View style={styles.showItem}>
									<Text style={styles.showText}>логин</Text>
								</View>
								<View style={styles.showItem}>
									<Text style={styles.showText}>пароль</Text>
								</View>
							</>
						)}
					</TouchableOpacity>

					{!hidden && (
						<DescriptionItem description='какое то описание для вашего аккаунта' />
					)}

					{!hidden && (
						<PressedBtn
							onPress={deleteHandler}
							overStyle={styles.btn}
							colorPressed={"rgba(255,0,0, 0.1)"}
						>
							<IconMeterial name={"delete"} size={20} color={COLORS.RED} />
						</PressedBtn>
					)}
				</View>
			</Swipeable>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	btn: {
		position: "absolute",
		bottom: 0,
		left: 10,
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
	},
	item: {
		backgroundColor: COLORS.ITEM_BG,
		padding: 15,
		marginVertical: 8,
		borderRadius: 5,
		justifyContent: "center",
		alignItems: "flex-start",
		position: "relative",
		paddingBottom: 40,
		elevation: 10,
		overflow: "hidden",
	},
	hide: {
		alignItems: "center",
		padding: 0,
	},
	showBlock: {
		width: "100%",
		overflow: "hidden",
		marginTop: 10,
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		justifyContent: "center",
		alignItems: "flex-start",
		borderRadius: 5,
		padding: 10,
	},
	showText: {
		color: "#fff",
		fontSize: 16,
	},
	showItem: {},
	hideText: {
		color: "rgba(255, 255, 255, 0.1)",
		fontSize: 20,
	},
	title: {
		color: COLORS.TITLE_COLOR,
		fontSize: 16,
	},
})

export default ListItem
