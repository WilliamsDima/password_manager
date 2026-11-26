module.exports = api => {
	api.cache(true)
	return {
		presets: ["babel-preset-expo"],
		// Unistyles rewrites style usage in `src` (components get reactive styles without re-renders).
		plugins: [["react-native-unistyles/plugin", { root: "src" }]],
		env: {
			// Strip console.* from release bundles (SECURITY_AUDIT O1); the logger is also off in release.
			production: {
				plugins: ["transform-remove-console"],
			},
		},
	}
}
