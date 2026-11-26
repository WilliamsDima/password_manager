import type { WriteStatus } from "./remote-store"

/** How long a single write waits for the server before it is reported as queued (offline). */
export const WRITE_ACK_MS = 3000

/**
 * Native Firestore resolves a write only when the server confirms it, so offline it would hang
 * while the write already sits in the local queue. After `WRITE_ACK_MS` the write is reported as
 * `queued`; the SDK keeps sending it. A rejection that arrives later (rules) cannot be reported
 * any more and is dropped: the next read of the list shows the server state.
 */
export const settleWithin = async (write: Promise<void>): Promise<WriteStatus> => {
	const timer: { id: ReturnType<typeof setTimeout> | null } = { id: null }
	const queued = new Promise<WriteStatus>(resolve => {
		timer.id = setTimeout(() => {
			resolve("queued")
		}, WRITE_ACK_MS)
	})
	try {
		return await Promise.race([write.then((): WriteStatus => "synced"), queued])
	} finally {
		if (timer.id !== null) clearTimeout(timer.id)
		write.catch(() => undefined)
	}
}
