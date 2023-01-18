import { doc, updateDoc, getDoc, DocumentData } from "firebase/firestore/lite"
import { db } from "../../config/firebase"
import { IItem, IUser } from "../../services/types"

export const updateItemAPI = async (user: IUser, items: IItem[]) => {
	await updateDoc(doc(db, "users", user.id), {
		...user,
		items: items,
	})
}

export const getDataUser = async (user: DocumentData) => {
	const docRef = doc(db, "users", user.uid)
	const docSnap = await getDoc(docRef)
	const data = docSnap.data()
	return data
}
