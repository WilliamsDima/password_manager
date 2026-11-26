import { AppError } from "@/shared/lib/errors"
import type { IRemoteStore } from "@/shared/services/remote-store"

import { parseRecoveryKey } from "../lib/vault-keys"
import type { IVaultKeyService } from "../lib/vault-keys"

/**
 * Gets the DEK from the typed, pasted or scanned recovery key (docs/CRYPTO.md §2): the key is
 * checked by its checksum first (no network for a typo), then the server `wrappedDek` is unwrapped.
 * A successful unwrap proves the key. The caller enrolls the DEK in a lock mode afterwards.
 */
export class VaultRecoveryService {
	constructor(
		private readonly remote: IRemoteStore,
		private readonly vaultKeys: IVaultKeyService,
	) {}

	public readonly recover = async (uid: string, recoveryKeyText: string): Promise<Uint8Array> => {
		const parsed = parseRecoveryKey(recoveryKeyText)
		if (!parsed.ok) {
			throw new AppError("invalid-recovery-key", `Invalid recovery key: ${parsed.reason}`)
		}
		const profile = await this.remote.getProfile(uid, "server")
		if (profile?.crypto == null) throw new AppError("not-found", "No v2 keys on the server yet")
		try {
			return this.vaultKeys.unwrapDek(
				parsed.key,
				profile.crypto.wrappedDek,
				uid,
				profile.crypto.rkVersion,
			)
		} catch (error) {
			if (error instanceof AppError && error.code === "crypto") {
				// Checksum fine but not the key of this account (another account's key, or reissued).
				throw new AppError("invalid-recovery-key", "Invalid recovery key: mismatch", {
					cause: error,
				})
			}
			throw error
		} finally {
			parsed.key.fill(0)
		}
	}
}
