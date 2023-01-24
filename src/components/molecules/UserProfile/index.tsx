import React, { FC, memo, useEffect, useState } from "react"
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
} from "react-native"
import { useAppSelector } from "../../../hooks/hooks"
import COLORS from "../../../services/colors"
import Icon from "react-native-vector-icons/FontAwesome5"
import IconEntypo from "react-native-vector-icons/Entypo"
import IconMaterial from "react-native-vector-icons/MaterialIcons"
import PressedBtn from "../../atoms/PressedBtn"
import { useAuth } from "../../../hooks/useAuth"
import { getDateDisplay } from "../../../hooks/helpers"
import { useActions } from "../../../hooks/useActions"
import { useInput } from "../../../hooks/useInput"
import Input from "../../atoms/Input/Input"
import IconDesign from "react-native-vector-icons/AntDesign"

type TUser = {
	setCamera: (value: boolean) => void
}

const UserProfile: FC<TUser> = memo(({ setCamera }) => {
	const { user, key, items } = useAppSelector(store => store.main)
	const { deleteUserHandler } = useAuth()
	const { setMessage, updateProfile, setKey } = useActions()
	const [editeMode, setEditeMode] = useState(false)
	const [name, bindName, setName] = useInput(user?.displayName || "")
	const [keyUser, bindKey, setUserKey] = useInput(key || "")

	const deleteProfile = () => {
		if (user) {
			setMessage({
				title: "Внимание!",
				message: "Все ваши данные будут безвозвратно удалены, вы уверены?",
				callback: () => {
					deleteUserHandler(user.id)
					setKey(null)
				},
			})
		}
	}

	const saveProfile = () => {
		if (!name.trim() || name.trim().length < 3) {
			setMessage({
				title: "Ошибка",
				message: "Имя должно состоять миниму из 3-х символов!",
				callback: () => {
					setEditeMode(false)
					setName(user?.displayName)
				},
			})
			return
		}

		if (name.trim().length > 30) {
			setMessage({
				title: "Ошибка",
				message: "Имя не должно превышать 30 символов!",
				callback: () => {
					setEditeMode(false)
					setName(user?.displayName)
				},
			})
			return
		}

		setEditeMode(false)
		updateProfile(name)
	}

	const keyUpdate = () => {
		console.log("keyUpdate", keyUser)

		setUserKey(keyUser)
		setKey(keyUser)
	}

	useEffect(() => {
		console.log("profile", key)

		setUserKey(key)
	}, [key])

	return (
		<View style={styles.container}>
			<View style={styles.user}>
				<View style={styles.avatar}>
					<Icon name={"user-circle"} size={66} color={COLORS.GRAY} />
					<Text style={styles.date}>
						{user && getDateDisplay(user?.dateCreate)}
					</Text>
				</View>

				<View style={styles.nameBlock}>
					{editeMode ? (
						<>
							<TextInput {...bindName} style={styles.input} autoFocus={true} />
							<PressedBtn overStyle={styles.btnEdit} onPress={saveProfile}>
								<IconMaterial name={"done"} size={18} color={COLORS.MAIN} />
							</PressedBtn>
						</>
					) : (
						<>
							<Text style={styles.name}>{user?.displayName}</Text>
							<PressedBtn
								overStyle={styles.btnEdit}
								onPress={() => setEditeMode(true)}
							>
								<IconEntypo name={"edit"} size={18} color={COLORS.MAIN} />
							</PressedBtn>
						</>
					)}
				</View>
			</View>

			{!!items?.length && (
				<View style={styles.keyBlock}>
					<Input
						{...bindKey}
						placeholder={"ключ"}
						overStyle={styles.keyInput}
						secureTextEntry={true}
						overStyleWrapp={{ marginBottom: 15 }}
					>
						<TouchableOpacity onPress={() => setCamera && setCamera(true)}>
							<IconDesign name={"qrcode"} size={24} color={COLORS.MAIN} />
						</TouchableOpacity>
					</Input>

					<PressedBtn overStyle={styles.keyDone} onPress={keyUpdate}>
						<IconMaterial name={"done"} size={18} color={COLORS.MAIN} />
					</PressedBtn>
				</View>
			)}

			<PressedBtn
				colorPressed={"rgba(255, 255, 255, 0.12)"}
				overStyle={styles.delete}
				onPress={deleteProfile}
			>
				<Text style={styles.textBtn}>удалить аккаунт</Text>
			</PressedBtn>
		</View>
	)
})

export default UserProfile

const styles = StyleSheet.create({
	keyDone: {
		position: "absolute",
		top: 3,
		right: 40,
		width: 40,
		height: 40,
		borderRadius: 20,
	},
	keyBlock: {
		position: "relative",
		paddingHorizontal: 10,
		marginTop: 5,
	},
	keyInput: {
		color: COLORS.GOLD,
		paddingRight: 70,
	},
	input: {
		color: COLORS.MAIN,
		fontSize: 20,
		width: "80%",
		padding: 0,
	},
	container: {
		width: "100%",
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
	},
	delete: {
		width: "100%",
		marginTop: 10,
	},
	avatar: {
		marginTop: 5,
		justifyContent: "center",
		alignItems: "center",
	},
	date: {
		color: COLORS.GRAY,
		marginTop: 5,
	},
	textBtn: {
		color: COLORS.GRAY,
	},
	user: {
		width: "100%",
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	btnEdit: {
		width: 40,
		height: 40,
		borderRadius: 20,
	},
	nameBlock: {
		justifyContent: "center",
		alignItems: "center",
		flexDirection: "row",
		width: "70%",
		borderBottomWidth: 1,
		borderColor: COLORS.GRAY,
		paddingBottom: 5,
	},
	name: {
		color: COLORS.MAIN,
		fontSize: 20,
		width: "80%",
	},
})
