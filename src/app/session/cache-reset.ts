import type { VaultLockService } from "@/entities/session"

/**
 * Calls `reset` whenever the vault is not open (locked, signed out, setup needed). The RTK Query
 * cache holds decrypted entries, so it must not outlive an open vault (docs/CRYPTO.md §4).
 * Returns the unsubscribe function.
 */
export const startCacheReset = (
	lock: Pick<VaultLockService, "subscribe" | "getState">,
	reset: () => void,
): (() => void) =>
	lock.subscribe(() => {
		if (lock.getState().status !== "unlocked") reset()
	})
