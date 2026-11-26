const expoPreset = require("jest-expo/jest-preset")

// jest-expo resolves the "react-native" export condition; immer and react-redux (Redux Toolkit) map it
// to ESM builds, so they must be transformed like the react-native packages.
const EXTRA_TRANSFORMED_PACKAGES = ["immer", "react-redux"]

const PRESET_PREFIX = "/node_modules/(?!("
if (!expoPreset.transformIgnorePatterns[0]?.startsWith(PRESET_PREFIX)) {
	throw new Error("jest-expo transformIgnorePatterns changed: update jest.config.js")
}

const transformIgnorePatterns = expoPreset.transformIgnorePatterns.map((pattern, index) =>
	index === 0
		? pattern.replace(PRESET_PREFIX, `/node_modules/(?!(${EXTRA_TRANSFORMED_PACKAGES.join("|")}|`)
		: pattern,
)

/** @type {import('jest').Config} */
module.exports = {
	preset: "jest-expo",
	roots: ["<rootDir>/src"],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
	},
	transformIgnorePatterns,
	testPathIgnorePatterns: ["/node_modules/", "/legacy/"],
}
