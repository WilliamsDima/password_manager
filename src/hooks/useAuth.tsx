import { onAuthStateChanged, User } from "firebase/auth"
import {
	addDoc,
	updateDoc,
	doc,
	setDoc,
	collection,
	DocumentData,
} from "firebase/firestore/lite"
import React, {
	FC,
	useState,
	useMemo,
	createContext,
	useContext,
	ReactNode,
	useEffect,
} from "react"
import {
	auth,
	db,
	getUserData,
	login,
	logout,
	register,
} from "../config/firebase"
import { getErrorMessage } from "../services/errorsMessage"
import { IUser } from "../services/types"
import { useActions } from "./useActions"

type IContext = {
	user: DocumentData | undefined
	isLoading: boolean
	loginHandler: (email: string, password: string) => Promise<void>
	logoutHandler: () => Promise<void>
	registerHandler: (
		email: string,
		password: string,
		user: IUser
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
	const { setError, setUser: setUserAC } = useActions()

	const registerHandler = async (
		email: string,
		password: string,
		userReg: IUser
	) => {
		setIsLoading(true)
		try {
			const { user } = await register(email, password)

			const userData = {
				...userReg,
				id: user.uid,
				email,
			}
			await setDoc(doc(db, "users", user.uid), userData)
			setUserAC(userData)
		} catch (error: any) {
			if (error) setError(getErrorMessage(error.toString()))
			console.log("error register: ", error)
		} finally {
			setIsLoading(false)
		}
	}

	const loginHandler = async (email: string, password: string) => {
		setIsLoading(true)
		try {
			await login(email, password)
		} catch (error: any) {
			if (error) setError(getErrorMessage(error.toString()))

			console.log("error login: ", error.toString())
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
			if (error) setError(getErrorMessage(error.toString()))
			console.log("error getUser: ", error.toString())
		} finally {
			setIsLoading(false)
		}
	}

	const logoutHandler = async () => {
		setIsLoading(true)
		try {
			await logout()
			setUserAC(null)
		} catch (error: any) {
			if (error) setError(getErrorMessage(error.toString()))
			console.log("error logout: ", error)
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
			registerHandler,
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
