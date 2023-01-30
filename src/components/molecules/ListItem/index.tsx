import React, { FC, memo, useEffect, useRef, useState } from "react"
import {
	View,
	Text,
	StyleSheet,
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
import { IItem, IItemContent } from "../../../services/types"
import DescriptionItem from "../../atoms/DescriptionItem"
import PressedBtn from "../../atoms/PressedBtn"
import { openRight } from "./RightBtn"
import IconMeterial from "react-native-vector-icons/MaterialCommunityIcons"
import IconEntypo from "react-native-vector-icons/Entypo"
import { useAppSelector } from "../../../hooks/hooks"
import { getDateDisplay, DecryptData } from "../../../hooks/helpers"
import ContentItem from "../../atoms/ContentItem"
import { useTranslation } from "react-i18next"

type TListItem = {
	item: IItem
	index: number
	setFormItem: (value: IItem | boolean) => void
}

const ListItem: FC<TListItem> = memo(({ item, index, setFormItem }) => {
	const { t } = useTranslation()
	const { deleteItem, setMessage } = useActions()
	const { key } = useAppSelector(store => store.main)

	const [data, setData] = useState<IItemContent | null>(null)

	const keyError = () => {
		setMessage({
			title: t("error"),
			message: t("key_message"),
		})
	}

	const decryptHandler = () => {
		key && setData(DecryptData(item.message, key, keyError))
	}

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
				// console.log("delete")
				deleteItem(item.id)
			}
		})
		LayoutAnimation.configureNext(toggleAnimationHeight)
	}

	const canselAnimationDelete = () => {
		Animated.timing(deleteAnim, {
			delay: 0,
			toValue: 0,
			duration: 50,
			easing: Easing.out(Easing.sin),
			useNativeDriver: true,
		}).start(() => {
			// console.log("canselAnimationDelete")
		})
	}

	const runAnimationDelete = () => {
		Animated.timing(deleteAnim, {
			delay: 0,
			toValue: 100,
			duration: 50,
			easing: Easing.out(Easing.sin),
			useNativeDriver: true,
		}).start(() => {
			setMessage({
				title: t("attention"),
				message: t("data_will_be_deleted"),
				callback: () => {
					setAnimDeleteStart(true)
					animItem(true)
				},
				cansel: () => {
					canselAnimationDelete()
				},
			})
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
		decryptHandler()
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
			style={[
				getAnimationStyles(),
				animDeleteStart && { height: 0 },
				index === 0 && { marginTop: 50 },
			]}
		>
			<Swipeable
				rightThreshold={WIDTH / 3}
				onSwipeableRightOpen={deleteHandler}
				overshootRight={true}
				renderRightActions={openRight}
			>
				<View style={[styles.item, hidden && { paddingBottom: 15 }]}>
					<View style={styles.titleBlock}>
						<Text style={styles.title}>
							{!!key && DecryptData(item.title, key, keyError)}
						</Text>
						<Text style={styles.date}>{getDateDisplay(item.id)}</Text>
					</View>

					<ContentItem
						hidden={hidden}
						toggleListItem={toggleListItem}
						data={data}
					/>

					{!hidden && !!data?.description && (
						<DescriptionItem description={data.description} />
					)}

					{!hidden && (
						<>
							<PressedBtn
								onPress={deleteHandler}
								overStyle={styles.btn}
								colorPressed={"rgba(255,0,0, 0.1)"}
							>
								<IconMeterial name={"delete"} size={20} color={COLORS.RED} />
							</PressedBtn>
							<PressedBtn
								overStyle={styles.btnEdit}
								onPress={() => setFormItem(item)}
							>
								<IconEntypo name={"edit"} size={18} color={COLORS.MAIN} />
							</PressedBtn>
						</>
					)}
				</View>
			</Swipeable>
		</Animated.View>
	)
})

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
	btnEdit: {
		position: "absolute",
		bottom: 0,
		left: "50%",
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
		elevation: 5,
		overflow: "hidden",
	},
	titleBlock: {
		width: "100%",
		justifyContent: "space-between",
		alignItems: "flex-start",
		flexDirection: "row",
	},
	title: {
		color: COLORS.TITLE_COLOR,
		fontSize: 16,
		width: "70%",
	},
	date: {
		color: COLORS.GRAY,
		width: "30%",
		textAlign: "right",
	},
})

export default ListItem
