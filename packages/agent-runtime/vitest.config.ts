import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		globals: true,
		setupFiles: ['./src/test-setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'dist/',
				'src/**/*.test.ts',
				'src/**/*.spec.ts',
				'src/test-setup.ts',
			],
		},
	},
	resolve: {
		alias: {
			'@dragoscatalin/memory-graph': '../memory-graph/src',
			'@dragoscatalin/ui-components': '../ui-components/src',
		},
	},
});
