import {
	doc,
	updateDoc,
	getDoc,
	DocumentData,
	deleteDoc,
} from "firebase/firestore/lite"
import { db } from "../../config/firebase"
import { IItem, IUser } from "../../services/types"

export const updateItemAPI = async (user: IUser, items: IItem[]) => {
	await updateDoc(doc(db, "users", user.id), {
		items: items,
	})
}

export const updateProfileAPI = async (user: IUser, displayName: string) => {
	await updateDoc(doc(db, "users", user.id), {
		displayName,
	})
}

export const deleteUserAPI = async (id: string) => {
	await deleteDoc(doc(db, "users", id))
}

export const getDataUser = async (user: DocumentData) => {
	const docRef = doc(db, "users", user.uid)
	const docSnap = await getDoc(docRef)
	const data = docSnap.data()
	return data
}
