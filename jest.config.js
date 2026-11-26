const expoPreset = require("jest-expo/jest-preset")

// jest-expo resolves the "react-native" export condition; immer and react-redux (Redux Toolkit) map it
// to ESM builds, and @noble/* are ESM-only, so they must be transformed like the react-native packages.
const EXTRA_TRANSFORMED_PACKAGES = ["immer", "react-redux", "@noble/ciphers", "@noble/hashes"]

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
	// Unistyles mocks first, then the app themes (UI modules call StyleSheet.create(theme => ...) on import).
	setupFiles: ["react-native-unistyles/mocks", "<rootDir>/jest.setup.js"],
	// Reanimated 4 ships its own resolver: it swaps native-only modules for their web versions in Jest.
	resolver: "react-native-reanimated/jest/resolver",
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
	},
	transformIgnorePatterns,
	testPathIgnorePatterns: ["/node_modules/"],
}
