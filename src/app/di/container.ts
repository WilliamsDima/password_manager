import { ExpoSecureStorage, type ISecureStorage } from "@/shared/services/secure-storage"

/**
 * Everything the store passes to `queryFn` as `api.extra` (docs/ARCHITECTURE.md §3.1).
 * Grows as an intersection of the dependency types declared by entities, e.g.
 * `EntryApiDependencies & SessionApiDependencies`, so the compiler checks the container.
 */
export type AppDependencies = {
	/** Temporary until `VaultLockService` (entities/session, 5.3) owns it. */
	readonly secureStorage: ISecureStorage
}

/**
 * Composition root: the **only** place where implementations are created and wired together.
 * Replacing a library = a new adapter class + one line here.
 */
export const createContainer = (): AppDependencies => ({
	secureStorage: new ExpoSecureStorage(),
})
