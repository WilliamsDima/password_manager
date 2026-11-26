package expo.modules.pmkdf

import android.util.Base64
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.bouncycastle.crypto.generators.SCrypt

/**
 * Native scrypt for the app password KDF (docs/CRYPTO.md §4, `IKdf`). The password arrives as a
 * (JS-normalized) string and is turned into UTF-8 bytes; salt and result are base64. Secrets are
 * never logged and error messages carry no input.
 */
class PmKdfModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PmKdf")

    AsyncFunction("scrypt") Coroutine { password: String, saltBase64: String, n: Int, r: Int, p: Int, length: Int ->
      validate(n, r, p, length)
      withContext(Dispatchers.Default) {
        val passwordBytes = password.toByteArray(Charsets.UTF_8)
        val salt = Base64.decode(saltBase64, Base64.NO_WRAP)
        try {
          val derived = SCrypt.generate(passwordBytes, salt, n, r, p, length)
          try {
            Base64.encodeToString(derived, Base64.NO_WRAP)
          } finally {
            derived.fill(0)
          }
        } finally {
          passwordBytes.fill(0)
        }
      }
    }
  }

  private fun validate(n: Int, r: Int, p: Int, length: Int) {
    val powerOfTwo = n > 1 && (n and (n - 1)) == 0
    // Memory is 128 * N * r bytes: refuse anything above 256 MiB instead of crashing the app.
    val memory = 128L * n * r
    if (!powerOfTwo || r < 1 || p < 1 || length < 1 || length > 1024 || memory > 256L * 1024 * 1024) {
      throw CodedException("INVALID_PARAMS", "Invalid scrypt parameters", null)
    }
  }
}
