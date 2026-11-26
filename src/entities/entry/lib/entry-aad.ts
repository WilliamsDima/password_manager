import { encodeUtf8 } from "@/shared/lib/encoding"

/** AAD of an entry (docs/CRYPTO.md §3): binds the ciphertext to the account and the document ID. */
export const entryAad = (uid: string, entryId: string): Uint8Array =>
	encodeUtf8(["pm/v2/entry", uid, entryId].join("|"))
