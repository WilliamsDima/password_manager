import { AppError } from "@/shared/lib/errors"

import { formatWait, lockErrorMessage } from "./index"

describe("lockErrorMessage", () => {
	it.each([
		["invalid-credentials", "Неверный пароль"],
		["auth-canceled", "Вход отменён"],
		["network", "Нет соединения с сетью"],
	] as const)("maps %p", (code, text) => {
		expect(lockErrorMessage(new AppError(code, "x"))).toBe(text)
	})

	it.each([
		["Invalid recovery key: length", "56 символов"],
		["Invalid recovery key: character", "недопустимый символ"],
		["Invalid recovery key: checksum", "опечатки"],
		["Invalid recovery key: padding", "опечатки"],
		["Invalid recovery key: mismatch", "не подходит"],
	])("explains the recovery key problem: %p", (message, part) => {
		expect(lockErrorMessage(new AppError("invalid-recovery-key", message))).toContain(part)
	})

	it("shows the wait time for a lockout and a plain text without it", () => {
		const lockout = Object.assign(new AppError("too-many-requests", "x"), { retryAfterMs: 65_000 })

		expect(lockErrorMessage(lockout)).toBe("Повторите через 1 мин 5 с")
		expect(lockErrorMessage(new AppError("too-many-requests", "x"))).toBe("Слишком много попыток")
	})

	it("hides unknown and technical errors behind the generic text", () => {
		expect(lockErrorMessage(new AppError("unknown", "secret internals"))).toContain("Не удалось")
		expect(lockErrorMessage(new Error("secret internals"))).toContain("Не удалось")
	})
})

describe("formatWait", () => {
	it.each([
		[30_000, "30 с"],
		[60_000, "1 мин"],
		[65_000, "1 мин 5 с"],
		[900_000, "15 мин"],
		[3_600_000, "1 ч"],
		[1, "1 с"],
	])("%p ms → %p", (ms, text) => {
		expect(formatWait(ms)).toBe(text)
	})
})
