import { requireNativeModule } from "expo"

import { fromBase64, toBase64 } from "@/shared/lib/encoding"
import { AppError } from "@/shared/lib/errors"

import type { IKdf, KdfParams } from "./crypto"

/** `modules/pm-kdf` (Kotlin, BouncyCastle). Arguments and result cross the bridge as strings. */
type PmKdfNative = {
	readonly scrypt: (
		password: string,
		saltBase64: string,
		n: number,
		r: number,
		p: number,
		length: number,
	) => Promise<string>
}

/**
 * scrypt on the JVM (docs/CRYPTO.md §4): measured pure-JS scrypt in Hermes takes ~5 s for N=2^14
 * and ~9.5 s for N=2^15, so the app password KDF runs natively. Same output as `NobleScryptKdf`
 * for the same inputs (both are plain scrypt over the NFKC-normalized UTF-8 password).
 */
export class NativeScryptKdf implements IKdf {
	private native: PmKdfNative | null = null

	public readonly derive = async (
		password: string,
		salt: Uint8Array,
		params: KdfParams,
		length: number,
	): Promise<Uint8Array> => {
		try {
			const derived = await this.module().scrypt(
				password.normalize("NFKC"),
				toBase64(salt),
				params.N,
				params.r,
				params.p,
				length,
			)
			return fromBase64(derived)
		} catch (error) {
			throw new AppError("crypto", "Key derivation failed", { cause: error })
		}
	}

	private readonly module = (): PmKdfNative => {
		this.native ??= requireNativeModule<PmKdfNative>("PmKdf")
		return this.native
	}
}
