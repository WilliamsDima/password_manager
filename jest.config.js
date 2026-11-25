/** @type {import('jest').Config} */
module.exports = {
	preset: "jest-expo",
	roots: ["<rootDir>/src"],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
	},
	testPathIgnorePatterns: ["/node_modules/", "/legacy/"],
}
