import {
	getAuth,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut,
} from "firebase/auth"
import { initializeApp } from "firebase/app"
import {
	doc,
	getDoc,
	getFirestore,
	setDoc,
	updateDoc,
} from "firebase/firestore/lite"

//import Config from "react-native-config"

// const firebaseConfig = {
// 	apiKey: Config.FIREBASE_API_KEY,
// 	authDomain: Config.FIREBASE_AUTH_DOMAIN,
// 	projectId: Config.FIREBASE_PROJECT_ID,
// 	storageBucket: Config.FIREBASE_STORAGE_BUCKET,
// 	messagingSenderId: Config.FIREBASE_MESSAGING_SENDER_ID,
// 	appId: Config.FIREBASE_APP_ID,
// }

const firebaseConfig = {
	apiKey: "AIzaSyDLEjwp0G-KHtL_wr17hM0SbQ9S7p7KEaU",
	authDomain: "account-manager-8d8e5.firebaseapp.com",
	projectId: "account-manager-8d8e5",
	storageBucket: "account-manager-8d8e5.appspot.com",
	messagingSenderId: "421527171854",
	appId: "1:421527171854:web:cbaf0f2802e41a9edcdd5f",
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

export const register = (email: string, password: string) => {
	return createUserWithEmailAndPassword(auth, email, password)
}

export const login = (email: string, password: string) => {
	return signInWithEmailAndPassword(auth, email, password)
}

export const logout = () => {
	return signOut(auth)
}
