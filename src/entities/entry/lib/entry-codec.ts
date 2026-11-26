import { decodeUtf8, encodeUtf8 } from "@/shared/lib/encoding"
import { AppError } from "@/shared/lib/errors"
import type { Envelope, ICryptoService } from "@/shared/services/crypto"

import type { EntryPayload } from "../model/types"
import { entryAad } from "./entry-aad"

/** Plaintext is padded with spaces to a multiple of this, hiding the exact password/notes length (§3). */
const PAD_BLOCK = 64

type RawPayload = { readonly [K in keyof EntryPayload]?: unknown }

const isRecord = (value: unknown): value is RawPayload =>
	typeof value === "object" && value !== null && !Array.isArray(value)

const optionalOf = <T>(value: unknown, check: (v: unknown) => v is T): T | undefined | null =>
	value === undefined ? undefined : check(value) ? value : null

const isString = (value: unknown): value is string => typeof value === "string"
const isBoolean = (value: unknown): value is boolean => typeof value === "boolean"
const isTimestamp = (value: unknown): value is number =>
	typeof value === "number" && Number.isFinite(value)

/** Validates the decrypted JSON: a tag-valid ciphertext from a buggy writer must not crash the UI. */
const parsePayload = (value: unknown): EntryPayload => {
	const url = isRecord(value) ? optionalOf(value.url, isString) : null
	const notes = isRecord(value) ? optionalOf(value.notes, isString) : null
	const favorite = isRecord(value) ? optionalOf(value.favorite, isBoolean) : null
	if (
		!isRecord(value) ||
		!isString(value.title) ||
		!isString(value.login) ||
		!isString(value.password) ||
		!isTimestamp(value.createdAt) ||
		!isTimestamp(value.updatedAt) ||
		url === null ||
		notes === null ||
		favorite === null
	) {
		throw new AppError("crypto", "Invalid entry payload")
	}
	return {
		title: value.title,
		login: value.login,
		password: value.password,
		createdAt: value.createdAt,
		updatedAt: value.updatedAt,
		...(url === undefined ? {} : { url }),
		...(notes === undefined ? {} : { notes }),
		...(favorite === undefined ? {} : { favorite }),
	}
}

const pad = (bytes: Uint8Array): Uint8Array => {
	const padded = new Uint8Array(Math.ceil(bytes.length / PAD_BLOCK) * PAD_BLOCK).fill(0x20)
	padded.set(bytes)
	return padded
}

/** Encrypts a whole entry as one AES-GCM envelope bound to `uid` and `entryId` (docs/CRYPTO.md §3). */
export class EntryCodec {
	constructor(private readonly crypto: ICryptoService) {}

	public readonly encrypt = (
		dek: Uint8Array,
		uid: string,
		entryId: string,
		payload: EntryPayload,
	): Envelope => {
		const plaintext = pad(encodeUtf8(JSON.stringify(payload)))
		try {
			return this.crypto.encrypt(dek, plaintext, entryAad(uid, entryId))
		} finally {
			plaintext.fill(0)
		}
	}

	public readonly decrypt = (
		dek: Uint8Array,
		uid: string,
		entryId: string,
		envelope: Envelope,
	): EntryPayload => {
		const plaintext = this.crypto.decrypt(dek, envelope, entryAad(uid, entryId))
		try {
			return parsePayload(JSON.parse(decodeUtf8(plaintext)))
		} catch (error) {
			throw error instanceof AppError ? error : new AppError("crypto", "Invalid entry payload")
		} finally {
			plaintext.fill(0)
		}
	}
}
