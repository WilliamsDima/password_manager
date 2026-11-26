import { scryptAsync } from "@noble/hashes/scrypt.js"

import { encodeUtf8 } from "@/shared/lib/encoding"
import { AppError } from "@/shared/lib/errors"

import type { IKdf, KdfParams } from "./crypto"

/**
 * scrypt in pure JS (docs/CRYPTO.md §4). Replaceable through `IKdf` by a native KDF if the
 * measurement on the phone (5.3) shows it is too slow.
 */
export class NobleScryptKdf implements IKdf {
	public readonly derive = async (
		password: string,
		salt: Uint8Array,
		params: KdfParams,
		length: number,
	): Promise<Uint8Array> => {
		// Params come from stored JSON (local wrapper), so the type alone is not trusted.
		const algorithm: string = params.algorithm
		if (algorithm !== "scrypt") throw new AppError("crypto", "Unsupported KDF")
		try {
			return await scryptAsync(encodeUtf8(password.normalize("NFKC")), salt, {
				N: params.N,
				r: params.r,
				p: params.p,
				dkLen: length,
			})
		} catch (error) {
			throw new AppError("crypto", "Key derivation failed", { cause: error })
		}
	}
}
