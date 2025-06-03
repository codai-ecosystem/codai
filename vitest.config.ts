import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['packages/*/src/**/*.{test,spec}.{ts,tsx}'],
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
    alias: {
      '@aide/memory-graph': resolve(__dirname, 'packages/memory-graph/src'),
      '@aide/agent-runtime': resolve(__dirname, 'packages/agent-runtime/src'),
      '@aide/ui-components': resolve(__dirname, 'packages/ui-components/src')
    }
  }
});
