import type { IKdf, KdfParams } from "@/shared/services/crypto"

const R = 8
const P = 1
const MIN_LOG2_N = 14
const MAX_LOG2_N = 16
const PROBE_N = 2 ** 12
const TARGET_MS = 700

export const DEFAULT_KDF_PARAMS: KdfParams = { algorithm: "scrypt", N: 2 ** 15, r: R, p: P }

/**
 * Picks scrypt `N` for this phone (docs/CRYPTO.md §4: 0.5–1 s, pure JS in Hermes is slow).
 * Times a cheap probe and scales: scrypt time is linear in `N`. Result is a power of two in
 * [2^14, 2^16] (2^16 needs 64 MiB). The chosen parameters are stored with the wrapper, so a
 * later change never locks the user out.
 */
export const calibrateKdf = async (
	kdf: IKdf,
	now: () => number,
	target = TARGET_MS,
): Promise<KdfParams> => {
	const salt = new Uint8Array(16)
	const start = now()
	await kdf.derive("calibration", salt, { algorithm: "scrypt", N: PROBE_N, r: R, p: P }, 32)
	const probeMs = Math.max(now() - start, 1)
	const wantedN = (PROBE_N * target) / probeMs
	const log2 = Math.min(MAX_LOG2_N, Math.max(MIN_LOG2_N, Math.floor(Math.log2(wantedN))))
	return { algorithm: "scrypt", N: 2 ** log2, r: R, p: P }
}
