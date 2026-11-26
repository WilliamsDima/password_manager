import { useEffect } from "react"
import { useDispatch } from "react-redux"

import type { IAuthService } from "@/shared/services/auth"

import type { AppDispatch } from "../store/store"
import { startAuthSync } from "./auth-sync"

/** Keeps the session slice in step with the auth SDK while the component is mounted. */
export const useAuthSync = (authService: IAuthService): void => {
	const dispatch = useDispatch<AppDispatch>()

	useEffect(() => startAuthSync(authService, dispatch), [authService, dispatch])
}
