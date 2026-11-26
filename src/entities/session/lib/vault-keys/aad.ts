import { encodeUtf8 } from "@/shared/lib/encoding"

/** AAD strings from docs/CRYPTO.md §2–4: they bind a ciphertext to its purpose, account and slot. */
const aad = (...parts: readonly string[]): Uint8Array => encodeUtf8(parts.join("|"))

export const dekAad = (uid: string, rkVersion: number): Uint8Array =>
	aad("pm/v2/dek", uid, String(rkVersion))

export const localPasswordAad = (uid: string): Uint8Array => aad("pm/v2/local", uid, "password")
