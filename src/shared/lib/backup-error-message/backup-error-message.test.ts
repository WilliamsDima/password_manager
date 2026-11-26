import { AppError } from "@/shared/lib/errors"

import { backupErrorMessage } from "./index"

describe("backupErrorMessage", () => {
	it.each([
		["invalid-backup", "повреждён"],
		["file-too-large", "слишком большой"],
		["conflict", "изменились"],
		["network", "соединения"],
	] as const)("maps %p", (code, part) => {
		expect(backupErrorMessage(new AppError(code, "x"))).toContain(part)
	})

	it("reuses the key texts for a wrong recovery key and hides everything else", () => {
		expect(
			backupErrorMessage(new AppError("invalid-recovery-key", "Invalid recovery key: mismatch")),
		).toContain("не подходит")
		expect(backupErrorMessage(new AppError("unknown", "secret internals"))).toContain("Не удалось")
		expect(backupErrorMessage(new Error("secret internals"))).toContain("Не удалось")
	})
})
