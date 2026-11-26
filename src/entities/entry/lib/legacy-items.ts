import { AppError } from "@/shared/lib/errors"
import type { ILegacyDecryptor } from "@/shared/services/legacy-decryptor"

import type { EntryPayload } from "../model/types"

/** Raised when some v1 items do not decrypt or have the wrong shape; nothing is written then. */
export class LegacyDataError extends AppError {
	constructor(public readonly failedIds: readonly string[]) {
		super("crypto", "Legacy data check failed")
	}
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value)

const parseJson = (text: string): unknown => JSON.parse(text) as unknown

/**
 * v1 item → v2 payload. CBC has no MAC, so "decrypts and parses" proves nothing: the shape is
 * checked strictly (`title` string, `message` = `{login, password, description?}` strings).
 */
const convertItem = (
	item: Readonly<Record<string, unknown>>,
	key: string,
	decryptor: ILegacyDecryptor,
): EntryPayload | null => {
	if (typeof item.title !== "string" || typeof item.message !== "string") return null
	const title = parseJson(decryptor.decrypt(item.title, key))
	const message = parseJson(decryptor.decrypt(item.message, key))
	if (
		typeof title !== "string" ||
		!isRecord(message) ||
		typeof message.login !== "string" ||
		typeof message.password !== "string" ||
		(message.description !== undefined && typeof message.description !== "string")
	) {
		return null
	}
	// v1 item id is the creation timestamp in ms.
	const createdAt = typeof item.id === "number" && Number.isFinite(item.id) ? item.id : 0
	const notes = message.description
	return {
		title,
		login: message.login,
		password: message.password,
		createdAt,
		updatedAt: createdAt,
		...(typeof notes === "string" && notes !== "" ? { notes } : {}),
	}
}

/** Decrypts every v1 item or throws `LegacyDataError` listing the ids that failed. */
export const decryptLegacyItems = (
	items: unknown,
	key: string,
	decryptor: ILegacyDecryptor,
): readonly EntryPayload[] => {
	if (!Array.isArray(items)) throw new AppError("not-found", "Nothing to migrate")
	const results = (items as readonly unknown[]).map((raw, index) => {
		const rawId = isRecord(raw) ? raw.id : undefined
		const id =
			typeof rawId === "number" || typeof rawId === "string" ? String(rawId) : `#${String(index)}`
		try {
			return { id, payload: isRecord(raw) ? convertItem(raw, key, decryptor) : null }
		} catch {
			return { id, payload: null }
		}
	})
	const failed = results.filter(result => result.payload === null).map(result => result.id)
	if (failed.length > 0) throw new LegacyDataError(failed)
	return results.flatMap(result => (result.payload === null ? [] : [result.payload]))
}

/** Order-independent comparison key; `notes` empty and missing are the same. */
export const canonicalPayload = (payload: EntryPayload): string =>
	JSON.stringify([
		payload.title,
		payload.login,
		payload.password,
		payload.notes ?? "",
		payload.createdAt,
		payload.updatedAt,
	])

export const samePayloads = (a: readonly EntryPayload[], b: readonly EntryPayload[]): boolean => {
	const left = a.map(canonicalPayload).sort()
	const right = b.map(canonicalPayload).sort()
	return left.length === right.length && left.every((value, index) => value === right[index])
}
