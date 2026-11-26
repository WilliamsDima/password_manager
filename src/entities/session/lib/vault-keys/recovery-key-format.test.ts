import {
	formatRecoveryKey,
	formatRecoveryKeyQr,
	parseRecoveryKey,
	type RecoveryKeyParseResult,
} from "./recovery-key-format"

// Expected strings computed independently (Python: Crockford Base32 of RK ‖ 20-bit SHA-256 prefix ‖ 0000).
const ZERO_KEY = new Uint8Array(32)
const ZERO_TEXT = "0000-0000-0000-0000-0000-0000-0000-0000-0000-0000-0000-0000-0006-CT3G"
const SEQ_KEY = Uint8Array.from({ length: 32 }, (_, i) => i)
const SEQ_TEXT = "000G-40R4-0M30-E209-185G-R38E-1W81-24GK-2GAH-C5RR-34D1-P70X-3RFP-63E0"

const keyOf = (result: RecoveryKeyParseResult): Uint8Array =>
	result.ok ? result.key : new Uint8Array(0)

describe("recovery key format", () => {
	it("encodes known vectors as 14 groups of 4", () => {
		expect(formatRecoveryKey(ZERO_KEY)).toBe(ZERO_TEXT)
		expect(formatRecoveryKey(SEQ_KEY)).toBe(SEQ_TEXT)
	})

	it("uses the pmrk1: prefix and no separators for QR", () => {
		expect(formatRecoveryKeyQr(SEQ_KEY)).toBe(`pmrk1:${SEQ_TEXT.replaceAll("-", "")}`)
	})

	it("round-trips text and QR forms", () => {
		expect(keyOf(parseRecoveryKey(SEQ_TEXT))).toEqual(SEQ_KEY)
		expect(keyOf(parseRecoveryKey(formatRecoveryKeyQr(SEQ_KEY)))).toEqual(SEQ_KEY)
	})

	it("ignores case, dashes, spaces and surrounding whitespace", () => {
		const messy = `  ${SEQ_TEXT.toLowerCase().replaceAll("-", " ")}\n`

		expect(keyOf(parseRecoveryKey(messy))).toEqual(SEQ_KEY)
		expect(keyOf(parseRecoveryKey(SEQ_TEXT.replaceAll("-", "")))).toEqual(SEQ_KEY)
	})

	it("maps O→0 and I/L→1 so look-alikes typed by hand still work", () => {
		const typed = SEQ_TEXT.replaceAll("0", "O").replaceAll("1", "l")

		expect(keyOf(parseRecoveryKey(typed))).toEqual(SEQ_KEY)
	})

	it("reports the reason for each kind of mistake", () => {
		expect(parseRecoveryKey(SEQ_TEXT.replace("000G", "000U"))).toEqual({
			ok: false,
			reason: "character",
		})
		expect(parseRecoveryKey(SEQ_TEXT.slice(0, -1))).toEqual({ ok: false, reason: "length" })
		expect(parseRecoveryKey(`${SEQ_TEXT}0`)).toEqual({ ok: false, reason: "length" })
		expect(parseRecoveryKey("")).toEqual({ ok: false, reason: "length" })
	})

	it("detects any single-character typo through the checksum", () => {
		const raw = SEQ_TEXT.replaceAll("-", "")
		const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
		const failures = Array.from(raw).flatMap((char, index) => {
			const swapped = alphabet[(alphabet.indexOf(char) + 1) % 32] ?? ""
			const result = parseRecoveryKey(raw.slice(0, index) + swapped + raw.slice(index + 1))
			return result.ok ? [index] : []
		})

		expect(failures).toEqual([])
	})

	it("rejects non-zero padding bits (one string per key)", () => {
		const raw = ZERO_TEXT.replaceAll("-", "")

		// The last character is 1 checksum bit + 4 padding bits: "G" = 10000, "H" = 10001.
		expect(raw.endsWith("G")).toBe(true)
		expect(parseRecoveryKey(raw).ok).toBe(true)
		expect(parseRecoveryKey(`${raw.slice(0, -1)}H`)).toEqual({ ok: false, reason: "padding" })
	})

	it("refuses to encode a key of the wrong length", () => {
		expect(() => formatRecoveryKey(new Uint8Array(31))).toThrow("Recovery key must be 32 bytes")
	})
})
