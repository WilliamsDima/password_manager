/**
 * Decrypts v1 data for the migration only (docs/CRYPTO.md §6): CryptoJS OpenSSL format
 * (`Salted__`, `EVP_BytesToKey`/MD5, AES-256-CBC). Decrypt-only: v1 encryption is never written.
 * CBC has no MAC, so a successful decrypt does not prove the data is intact: the caller must
 * validate the parsed shape. Failures throw `AppError("crypto")`.
 */
export type ILegacyDecryptor = {
	/** Returns the UTF-8 plaintext (v1 stores `JSON.stringify(value)`). */
	readonly decrypt: (ciphertext: string, legacyKey: string) => string
}
