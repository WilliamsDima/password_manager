import { getRandomValues, randomUUID } from "expo-crypto"

import { AppError } from "@/shared/lib/errors"

import type { IRandom } from "./random"

/**
 * `IRandom` on top of `expo-crypto` (native CSPRNG). `getRandomValues` is used instead of
 * `getRandomBytes`: in dev mode the latter falls back to `Math.random` when remote debugging is on.
 */
export class ExpoRandom implements IRandom {
	public readonly bytes = (length: number): Uint8Array => {
		if (!Number.isInteger(length) || length < 0) {
			throw new AppError("crypto", "Invalid random length")
		}
		return getRandomValues(new Uint8Array(length))
	}

	public readonly uuid = (): string => randomUUID()
}
