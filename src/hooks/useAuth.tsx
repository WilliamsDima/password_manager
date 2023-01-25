import { onAuthStateChanged } from "firebase/auth"
import { doc, setDoc, DocumentData } from "firebase/firestore/lite"
import React, {
	FC,
	useState,
	useMemo,
	createContext,
	useContext,
	ReactNode,
	useEffect,
} from "react"
import { clearEncrypted, clearLocal, setEncrypted } from "../api/asyncStorage"
import { deleteUserAPI } from "../api/firebase/firebase"
import {
	auth,
	db,
	deleteProfile,
	getUserData,
	login,
	logout,
	recovery,
	register,
} from "../config/firebase"
import { KEY } from "../services/constants"
import { getErrorMessage } from "../services/errorsMessage"
import { IUser } from "../services/types"
import { EncryptData } from "./helpers"
import { useAppSelector } from "./hooks"
import { useActions } from "./useActions"

type IContext = {
	user: DocumentData | undefined
	isLoading: boolean
	loginHandler: (email: string, password: string, key: string) => Promise<void>
	recoveryHandler: (email: string) => Promise<void>
	deleteUserHandler: (id: string) => Promise<void>
	logoutHandler: () => Promise<void>
	registerHandler: (
		email: string,
		password: string,
		user: IUser,
		toKeyGen: () => void
	) => Promise<void>
}

const AuthContext = createContext<IContext>({} as IContext)

type AuthProviderType = {
	children: ReactNode
}

export const AuthProvider: FC<AuthProviderType> = ({ children }) => {
	const [user, setUser] = useState<DocumentData | undefined>()
	const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(false)
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const { setMessage, setUser: setUserAC, setKey, setPin } = useActions()
	const { pin } = useAppSelector(store => store.main)

	const registerHandler = async (
		email: string,
		password: string,
		userReg: IUser,
		toKeyGen: () => void
	) => {
		setIsLoading(true)
		try {
			const { user } = await register(email, password)

			const userData = {
				...userReg,
				id: user.uid,
				dateCreate: +new Date(),
				email,
				items: [],
			}
			await setDoc(doc(db, "users", user.uid), userData)

			toKeyGen()
		} catch (error: any) {
			if (error)
				setMessage({
					title: "Ошибка",
					message: getErrorMessage(error.toString()),
				})

			console.log("error register: ", error)
		} finally {
			setIsLoading(false)
		}
	}

	const loginHandler = async (email: string, password: string, key: string) => {
		setIsLoading(true)
		try {
			await login(email, password)
			setEncrypted(KEY, key)
		} catch (error: any) {
			if (error)
				setMessage({
					title: "Ошибка",
					message: getErrorMessage(error.toString()),
				})

			console.log("error login: ", error.toString())
		} finally {
			setIsLoading(false)
		}
	}

	const recoveryHandler = async (email: string) => {
		setIsLoading(true)
		try {
			await recovery(email)
			setMessage({
				title: "",
				message: `На почту ${email} отправлено письмо с инструкцией для сброса пароля.`,
			})
		} catch (error: any) {
			if (error)
				setMessage({
					title: "Ошибка",
					message: getErrorMessage(error.toString()),
				})

			console.log("error recover: ", error.toString())
		} finally {
			setIsLoading(false)
		}
	}

	const getUser = async (id: string) => {
		setIsLoading(true)
		try {
			const user = (await getUserData(id)) as IUser
			setUserAC(user)
		} catch (error: any) {
			if (error)
				setMessage({
					title: "Ошибка",
					message: getErrorMessage(error.toString()),
				})
			console.log("error getUser: ", error.toString())
		} finally {
			setIsLoading(false)
		}
	}

	const logoutHandler = async () => {
		setIsLoading(true)
		try {
			clearLocal()
			clearEncrypted()
			await logout()
			setUserAC(null)
			setKey(null)
			setPin(pin)
		} catch (error: any) {
			if (error)
				setMessage({
					title: "Ошибка",
					message: getErrorMessage(error.toString()),
				})
			console.log("error logout: ", error)
		} finally {
			setIsLoading(false)
		}
	}

	const deleteUserHandler = async (id: string) => {
		setIsLoading(true)
		try {
			clearLocal()
			clearEncrypted()
			await deleteProfile(user)
			await deleteUserAPI(id)
			setUserAC(null)
			setKey(null)
			setPin(pin)
		} catch (error: any) {
			if (error)
				setMessage({
					title: "Ошибка",
					message: getErrorMessage(error.toString()),
				})
			console.log("error delete user: ", error)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		const unsub = onAuthStateChanged(auth, user => {
			setIsLoading(true)
			if (user) {
				setUser(user)
				getUser(user.uid)
				setIsLoadingInitial(false)
				setIsLoading(false)
			} else {
				setUser(undefined)
				setIsLoading(false)
			}
		})

		return unsub
	}, [])

	const value = useMemo(() => {
		return {
			user,
			isLoading,
			loginHandler,
			logoutHandler,
			recoveryHandler,
			registerHandler,
			deleteUserHandler,
		}
	}, [user, isLoading])

	return (
		<AuthContext.Provider value={value}>
			{!isLoadingInitial && children}
		</AuthContext.Provider>
	)
}

export const useAuth = () => {
	return useContext(AuthContext)
}
