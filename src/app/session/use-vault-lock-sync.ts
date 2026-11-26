import { useEffect } from "react"
import { AppState } from "react-native"
import { useDispatch, useSelector } from "react-redux"

import { selectSessionStatus, selectSessionUser, type VaultLockService } from "@/entities/session"
import { baseApi } from "@/shared/api"

import { startCacheReset } from "./cache-reset"

const AUTO_LOCK_CHECK_MS = 5000

/**
 * Ties the lock to the session and the app lifecycle (docs/CRYPTO.md §4):
 * - signed in → read the saved mode for this account; signed out → forget every local key
 *   (never while the status is still `initializing`, or a cold start would erase the keys);
 * - background longer than the grace period, or idling, locks the vault.
 */
export const useVaultLockSync = (lock: VaultLockService): void => {
	const status = useSelector(selectSessionStatus)
	const uid = useSelector(selectSessionUser)?.uid
	const dispatch = useDispatch()

	// The RTK Query cache holds decrypted entries: drop it whenever the vault is not open.
	useEffect(
		() =>
			startCacheReset(lock, () => {
				dispatch(baseApi.util.resetApiState())
			}),
		[lock, dispatch],
	)

	useEffect(() => {
		if (status === "signed-in" && uid !== undefined) void lock.initialize(uid)
		else if (status === "signed-out") void lock.wipe()
	}, [status, uid, lock])

	useEffect(() => {
		const subscription = AppState.addEventListener("change", state => {
			if (state === "active") lock.noteForegrounded()
			else if (state === "background") lock.noteBackgrounded()
		})
		const timer = setInterval(() => {
			lock.checkAutoLock()
		}, AUTO_LOCK_CHECK_MS)
		return () => {
			subscription.remove()
			clearInterval(timer)
		}
	}, [lock])
}
