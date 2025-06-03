/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./test/setup.ts'],
		css: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'dist/',
				'demo/',
				'test/setup.ts',
				'**/*.d.ts'
			]
		}
	},
	resolve: {
		alias: {
			'@': './src'
		}
	}
});
