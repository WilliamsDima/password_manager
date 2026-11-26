import { toOpenableUrl } from "./open-url"

describe("toOpenableUrl", () => {
	it("keeps web addresses and adds https to bare hosts", () => {
		expect(toOpenableUrl("https://example.com/a?b=1")).toBe("https://example.com/a?b=1")
		expect(toOpenableUrl("HTTP://example.com")).toBe("HTTP://example.com")
		expect(toOpenableUrl("  cp.vdsina.com  ")).toBe("https://cp.vdsina.com")
		expect(toOpenableUrl("example.com:8080/path")).toBe("https://example.com:8080/path")
	})

	it("refuses every other scheme and unusable text", () => {
		for (const bad of [
			"javascript:alert(1)",
			"JAVASCRIPT:alert(1)",
			"data:text/html,<script>",
			"file:///etc/passwd",
			"intent://scan/#Intent;scheme=zxing;end",
			"content://contacts",
			"tel:+79990000000",
			"mailto:a@b.c",
			"ftp://example.com",
			"market://details?id=x",
			"",
			"   ",
			"two words.com",
			`https://example.com/${"a".repeat(2100)}`,
		]) {
			expect(toOpenableUrl(bad)).toBeNull()
		}
	})
})
