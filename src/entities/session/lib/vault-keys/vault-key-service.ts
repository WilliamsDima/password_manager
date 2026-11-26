import { encodeUtf8 } from "@/shared/lib/encoding"
import { AppError } from "@/shared/lib/errors"
import type { Envelope, ICryptoService } from "@/shared/services/crypto"
import type { IRandom } from "@/shared/services/random"

import { dekAad } from "./aad"
import { RECOVERY_KEY_BYTES } from "./recovery-key-format"
import type { IVaultKeyService } from "./vault-key-service.types"

const KEK_INFO = "pm/v2/kek"
const KEY_LENGTH = 32

/**
 * RK → HKDF → KEK → wraps DEK (docs/CRYPTO.md §2). A successful unwrap (GCM tag matches) is the
 * proof that the recovery key is right (C4); there is no separate check value.
 * The KEK is derived per call and wiped right after use.
 */
export class VaultKeyService implements IVaultKeyService {
	constructor(
		private readonly crypto: ICryptoService,
		private readonly random: IRandom,
	) {}

	public readonly generateRecoveryKey = (): Uint8Array => this.random.bytes(RECOVERY_KEY_BYTES)

	public readonly generateDek = (): Uint8Array => this.random.bytes(KEY_LENGTH)

	public readonly wrapDek = (
		recoveryKey: Uint8Array,
		dek: Uint8Array,
		uid: string,
		rkVersion: number,
	): Envelope => {
		if (dek.length !== KEY_LENGTH) throw new AppError("crypto", "Invalid key length")
		return this.withKek(recoveryKey, uid, rkVersion, kek =>
			this.crypto.encrypt(kek, dek, dekAad(uid, rkVersion)),
		)
	}

	public readonly unwrapDek = (
		recoveryKey: Uint8Array,
		wrappedDek: Envelope,
		uid: string,
		rkVersion: number,
	): Uint8Array => {
		const dek = this.withKek(recoveryKey, uid, rkVersion, kek =>
			this.crypto.decrypt(kek, wrappedDek, dekAad(uid, rkVersion)),
		)
		if (dek.length !== KEY_LENGTH) throw new AppError("crypto", "Invalid key length")
		return dek
	}

	private readonly withKek = <T>(
		recoveryKey: Uint8Array,
		uid: string,
		rkVersion: number,
		run: (kek: Uint8Array) => T,
	): T => {
		if (recoveryKey.length !== RECOVERY_KEY_BYTES) {
			throw new AppError("crypto", "Invalid key length")
		}
		if (uid === "" || !Number.isInteger(rkVersion) || rkVersion < 1) {
			throw new AppError("crypto", "Invalid key context")
		}
		const kek = this.crypto.hkdf(recoveryKey, encodeUtf8(uid), KEK_INFO, KEY_LENGTH)
		try {
			return run(kek)
		} finally {
			kek.fill(0)
		}
	}
}
