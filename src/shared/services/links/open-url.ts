const MAX_URL_LENGTH = 2048
const HTTP_URL = /^https?:\/\/\S+$/i
/** Schemes that must never be opened from stored text (code, files, other apps' actions). */
const BLOCKED_SCHEME = /^(javascript|data|file|content|intent|vbscript|blob|about|tel|sms|mailto):/i
const ANY_SCHEME_WITH_SLASHES = /^[a-z][a-z0-9+.-]*:\/\//i

/**
 * Turns the address typed into an entry into something safe to open, or `null`. Only web
 * addresses are opened: `example.com` becomes `https://example.com`, `http(s)://…` is kept, and
 * every other scheme (`javascript:`, `intent:`, `file:`, `tel:` …) is refused.
 */
export const toOpenableUrl = (text: string): string | null => {
	const value = text.trim()
	if (value === "" || value.length > MAX_URL_LENGTH || /\s/.test(value)) return null
	if (BLOCKED_SCHEME.test(value)) return null
	if (ANY_SCHEME_WITH_SLASHES.test(value)) return HTTP_URL.test(value) ? value : null
	return `https://${value}`
}
