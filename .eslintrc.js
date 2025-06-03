module.exports = {
	root: true,
	extends: [
		'eslint:recommended',
		'@typescript-eslint/recommended',
		'prettier',
	],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint', 'react', 'react-hooks'],
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
		ecmaFeatures: {
			jsx: true,
		},
	},
	env: {
		browser: true,
		node: true,
		es6: true,
	},
	rules: {
		// VS Code coding guidelines compliance
		'@typescript-eslint/naming-convention': [
			'error',
			{
				selector: 'interface',
				format: ['PascalCase'],
			},
			{
				selector: 'typeAlias',
				format: ['PascalCase'],
			},
			{
				selector: 'enum',
				format: ['PascalCase'],
			},
			{
				selector: 'enumMember',
				format: ['PascalCase'],
			},
			{
				selector: 'function',
				format: ['camelCase'],
			},
			{
				selector: 'method',
				format: ['camelCase'],
			},
			{
				selector: 'property',
				format: ['camelCase'],
			},
			{
				selector: 'variableLike',
				format: ['camelCase'],
			},
		],

		// Enforce arrow functions over function expressions
		'prefer-arrow-callback': 'error',
		'func-style': ['error', 'expression'],

		// Require curly braces for all control statements
		'curly': ['error', 'all'],

		// Spacing rules following VS Code guidelines
		'object-curly-spacing': ['error', 'always'],
		'array-bracket-spacing': ['error', 'never'],
		'computed-property-spacing': ['error', 'never'],

		// React specific rules
		'react/jsx-uses-react': 'error',
		'react/jsx-uses-vars': 'error',
		'react-hooks/rules-of-hooks': 'error',
		'react-hooks/exhaustive-deps': 'warn',

		// Best practices
		'no-console': 'warn',
		'no-debugger': 'warn',
		'@typescript-eslint/no-unused-vars': 'error',
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/no-explicit-any': 'warn',
	},
	overrides: [
		{
			files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
			env: {
				jest: true,
			},
		},
	],
};
