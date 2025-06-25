import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
	test: {
		globals: true,
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{ts,tsx}'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'coverage/**',
				'dist/**',
				'**/node_modules/**',
				'**/*.d.ts',
				'**/*.test.{ts,tsx}',
				'**/*.spec.{ts,tsx}',
				'**/test/**',
			],
		},
		setupFiles: ['./src/renderer/__tests__/setupTests.ts'],
		alias: {
			'@codai/memory-graph': resolve(__dirname, '../../packages/memory-graph/dist'),
			'@codai/agent-runtime': resolve(__dirname, '../../packages/agent-runtime/dist'),
			'@aide/ui-components': resolve(__dirname, '../../packages/ui-components/dist'),
		},
	},
});
