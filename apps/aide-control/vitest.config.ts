import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./__tests__/setup.ts'],		include: [
			'./__tests__/**/*.test.{ts,tsx}',
		],
		exclude: [
			'**/node_modules/**',
			'**/dist/**',
			'**/out/**'
		],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
		}
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, '.')
		}
	}
});
