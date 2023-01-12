import { onAuthStateChanged, User } from "firebase/auth"
import { addDoc, collection } from "firebase/firestore/lite"
import React, {
	FC,
	useState,
	useMemo,
	createContext,
	useContext,
	ReactNode,
	useEffect,
} from "react"
import { Alert } from "react-native"
import { auth, db, login, logout, register } from "../config/firebase"
import { getErrorMessage } from "../services/errorsMessage"
import { useActions } from "./useActions"

type IContext = {
	user: User | null
	isLoading: boolean
	loginHandler: (email: string, password: string) => Promise<void>
	logoutHandler: () => Promise<void>
	registerHandler: (email: string, password: string) => Promise<void>
}

const AuthContext = createContext<IContext>({} as IContext)

type AuthProviderType = {
	children: ReactNode
}

export const AuthProvider: FC<AuthProviderType> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null)
	const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(false)
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const { setError } = useActions()

	const registerHandler = async (email: string, password: string) => {
		setIsLoading(true)
		try {
			const { user } = await register(email, password)
			await addDoc(collection(db, "users"), {
				id: user.uid,
				displayName: "No name" || user.displayName,
			})
		} catch (error: any) {
			if (error) setError(getErrorMessage(error.toString()))
			console.log("error register: ", error)
			// Alert.alert("error register: ", error)
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
			// Alert.alert("error login: ", error)
		} finally {
			setIsLoading(false)
		}
	}

	const logoutHandler = async () => {
		setIsLoading(true)
		try {
			await logout()
		} catch (error: any) {
			if (error) setError(getErrorMessage(error.toString()))
			console.log("error logout: ", error)
			// Alert.alert("error logout: ", error)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		const unsub = onAuthStateChanged(auth, user => {
			setIsLoading(true)
			if (user) {
				setUser(user)
				setIsLoadingInitial(false)
				setIsLoading(false)
			} else {
				setUser(null)
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
