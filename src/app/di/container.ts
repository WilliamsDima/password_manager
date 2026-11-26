import {
	type IVaultKeyService,
	type SessionApiDependencies,
	VaultKeyService,
} from "@/entities/session"
import { EntryCodec } from "@/entities/entry"
import { VaultMigrationService } from "@/features/vault-migration"
import { FirebaseAuthService } from "@/shared/services/auth"
import {
	type ICryptoService,
	type IKdf,
	NobleCryptoService,
	NobleScryptKdf,
} from "@/shared/services/crypto"
import { CryptoJsLegacyDecryptor, type ILegacyDecryptor } from "@/shared/services/legacy-decryptor"
import { ExpoRandom, type IRandom } from "@/shared/services/random"
import { FirestoreSdkStore, type IRemoteStore } from "@/shared/services/remote-store"
import { ExpoSecureStorage, type ISecureStorage } from "@/shared/services/secure-storage"

/**
 * Everything the store passes to `queryFn` as `api.extra` (docs/ARCHITECTURE.md §3.1).
 * Grows as an intersection of the dependency types declared by entities, e.g.
 * `EntryApiDependencies & SessionApiDependencies`, so the compiler checks the container.
 */
export type AppDependencies = SessionApiDependencies & {
	/** Temporary until `VaultLockService` (entities/session, 5.3) owns it. */
	readonly secureStorage: ISecureStorage
	/** Crypto building blocks (5.1); repositories and `VaultLockService` consume them from 5.2/5.3. */
	readonly random: IRandom
	readonly crypto: ICryptoService
	readonly kdf: IKdf
	readonly vaultKeys: IVaultKeyService
	readonly entryCodec: EntryCodec
	readonly legacyDecryptor: ILegacyDecryptor
	readonly remoteStore: IRemoteStore
	/** v1 → v2 migration and DEK change (5.2); screens arrive with 5.3 / 6.4. */
	readonly vaultMigration: VaultMigrationService
}

/**
 * Composition root: the **only** place where implementations are created and wired together.
 * Replacing a library = a new adapter class + one line here.
 */
export const createContainer = (): AppDependencies => {
	const random = new ExpoRandom()
	const crypto = new NobleCryptoService(random)
	const secureStorage = new ExpoSecureStorage()
	const vaultKeys = new VaultKeyService(crypto, random)
	const entryCodec = new EntryCodec(crypto)
	const legacyDecryptor = new CryptoJsLegacyDecryptor()
	const remoteStore = new FirestoreSdkStore()
	return {
		authService: new FirebaseAuthService(),
		secureStorage,
		random,
		crypto,
		kdf: new NobleScryptKdf(),
		vaultKeys,
		entryCodec,
		legacyDecryptor,
		remoteStore,
		vaultMigration: new VaultMigrationService(
			remoteStore,
			legacyDecryptor,
			vaultKeys,
			entryCodec,
			random,
			secureStorage,
		),
	}
}
