import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/*/src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/apps/**'], // Exclude apps to avoid conflicts
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
        '**/test/**'
      ]
    },
    setupFiles: ['./test/setup.ts'],
    alias: {      '@dragoscatalin/memory-graph': resolve(__dirname, 'packages/memory-graph/src'),
      '@dragoscatalin/agent-runtime': resolve(__dirname, 'packages/agent-runtime/src'),
      '@dragoscatalin/ui-components': resolve(__dirname, 'packages/ui-components/src')
    }
  },
  define: {
    global: 'globalThis',
  }
});
