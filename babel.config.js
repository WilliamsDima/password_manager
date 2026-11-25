module.exports = api => {
	api.cache(true)
	return {
		presets: ["babel-preset-expo"],
		env: {
			// Strip console.* from release bundles (SECURITY_AUDIT O1); the logger is also off in release.
			production: {
				plugins: ["transform-remove-console"],
			},
		},
	}
}
