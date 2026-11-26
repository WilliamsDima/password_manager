// ESLint flat config. Rules follow docs/ARCHITECTURE.md (§2 FSD layers, §4 code standards).
const { defineConfig } = require("eslint/config")
const expoConfig = require("eslint-config-expo/flat")
const tseslint = require("typescript-eslint")
const boundaries = require("eslint-plugin-boundaries")
const prettier = require("eslint-config-prettier")
const globals = require("globals")

// FSD layers, top to bottom. A layer may import only from layers below it.
const LAYERS = ["app", "pages", "widgets", "features", "entities", "shared"]
const SLICED_LAYERS = ["pages", "widgets", "features", "entities"]

const layerPolicies = LAYERS.map((layer, index) => ({
	from: { element: { type: layer } },
	allow: { to: { element: { types: LAYERS.slice(index + 1) } } },
}))

module.exports = defineConfig([
	{
		ignores: [
			"legacy/**",
			"secrets/**",
			"android/**",
			"ios/**",
			".expo/**",
			"node_modules/**",
			"coverage/**",
			"dist/**",
			"expo-env.d.ts",
		],
	},

	expoConfig,

	// Node scripts and config files
	{
		files: ["*.js", "*.mjs", "scripts/**/*.mjs", ".claude/**/*.mjs"],
		languageOptions: { globals: { ...globals.node } },
		rules: { "no-console": "off" },
	},

	// TypeScript source: strict type-aware rules
	{
		files: ["**/*.ts", "**/*.tsx"],
		extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
		languageOptions: {
			parserOptions: { projectService: true, tsconfigRootDir: __dirname },
		},
		rules: {
			"@typescript-eslint/no-explicit-any": "error",
			"@typescript-eslint/ban-ts-comment": [
				"error",
				{ "ts-expect-error": "allow-with-description", "ts-ignore": true, "ts-nocheck": true },
			],
			"@typescript-eslint/consistent-type-definitions": ["error", "type"],
			"@typescript-eslint/explicit-member-accessibility": [
				"error",
				{ accessibility: "explicit", overrides: { constructors: "no-public" } },
			],
		},
	},

	// Code standards for all source files
	{
		files: ["src/**/*.{ts,tsx}", "index.ts"],
		rules: {
			"no-var": "error",
			"prefer-const": "error",
			"no-restricted-syntax": [
				"error",
				{
					selector: "VariableDeclaration[kind='let']",
					message: "`let` is forbidden (docs/ARCHITECTURE.md §4). Use `const`.",
				},
				// JSX rules (CLAUDE.md "JSX rules"): logic lives above the JSX, in hooks.
				{
					selector:
						"JSXAttribute[name.name=/^(style|contentContainerStyle)$/] > JSXExpressionContainer > ObjectExpression",
					message:
						"No inline style objects. Static: StyleSheet.create; conditional or themed: `useThemedStyles` / useMemo.",
				},
				{
					selector:
						"JSXAttribute[name.name=/^(style|contentContainerStyle)$/] > JSXExpressionContainer > ArrayExpression",
					message: "No style arrays built in JSX. Build the style in useMemo above the JSX.",
				},
				{
					selector:
						":matches(JSXElement, JSXFragment) > JSXExpressionContainer > ConditionalExpression > Literal[raw='null']",
					message: "Use `<></>` instead of `null` for the empty branch of a JSX conditional.",
				},
				{
					selector:
						"JSXAttribute > JSXExpressionContainer > :matches(ArrowFunctionExpression, FunctionExpression)",
					message: "No functions inside JSX. Extract a named handler with useCallback.",
				},
				{
					selector:
						"JSXAttribute > JSXExpressionContainer > :matches(ConditionalExpression, LogicalExpression, TemplateLiteral, CallExpression, BinaryExpression)",
					message:
						"No computed values in JSX props. Compute them in useMemo above the JSX and pass the result.",
				},
			],
			"no-console": "error",
			"no-restricted-imports": [
				"error",
				{
					patterns: [
						{
							regex: `^@/(${SLICED_LAYERS.join("|")})/[^/]+/.+`,
							message: "Import a slice only through its public API (index.ts).",
						},
						{
							regex: "^@/shared/[^/]+/[^/]+/.+",
							message: "Import shared segments only through their public API.",
						},
						{
							regex: "^@/app/.+",
							message: "Import the app layer only through `@/app`.",
						},
						// Relative paths that leave the current slice must not bypass the public API either.
						{
							regex: `^(\\.\\./)+(${SLICED_LAYERS.join("|")})/[^/]+/.+`,
							message: "Use `@/<layer>/<slice>` (public API) instead of a deep relative import.",
						},
						{
							regex: "^(\\.\\./)+shared/[^/]+/[^/]+/.+",
							message:
								"Use `@/shared/<segment>/<name>` (public API) instead of a deep relative import.",
						},
					],
				},
			],
		},
	},

	// FSD layer boundaries
	{
		files: ["src/**/*.{ts,tsx}"],
		plugins: { boundaries },
		settings: {
			"import/resolver": {
				typescript: { project: "./tsconfig.json" },
				node: true,
			},
			"boundaries/elements": [
				{ type: "app", pattern: "src/app" },
				...SLICED_LAYERS.map(layer => ({
					type: layer,
					pattern: `src/${layer}/*`,
					capture: ["slice"],
				})),
				{ type: "shared", pattern: "src/shared" },
			],
		},
		rules: {
			"boundaries/dependencies": [2, { default: "disallow", policies: layerPolicies }],
			// Every source file must belong to an FSD layer (no stray src/utils, src/hooks, ...).
			"boundaries/no-unknown-files": 2,
		},
	},

	// The logger is the only place allowed to touch console.
	{
		files: ["src/shared/lib/logger/**"],
		rules: { "no-console": "off" },
	},

	// Tests
	{
		files: ["**/*.test.{ts,tsx}", "**/__tests__/**"],
		languageOptions: { globals: { ...globals.jest } },
	},

	prettier,
])
