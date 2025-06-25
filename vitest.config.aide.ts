/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./test/setup.ts'],
		include: [
			'packages/**/*.test.ts',
			'packages/**/*.test.tsx',
			'extensions/aide-core/**/*.test.ts',
			'extensions/copilot/**/*.test.ts',
		],
		exclude: [
			'**/node_modules/**',
			'**/dist/**',
			'**/out/**',
			// Exclude all VS Code legacy tests
			'test/**',
			'src/vs/**/*.test.ts',
			'extensions/*/test/**',
			'!extensions/aide-core/**',
			'!extensions/copilot/**',
		],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: [
				'packages/**/src/**/*.ts',
				'extensions/aide-core/src/**/*.ts',
				'extensions/copilot/src/**/*.ts',
			],
			exclude: ['**/*.test.ts', '**/*.test.tsx', '**/dist/**', '**/out/**', '**/node_modules/**'],
		},
	},
	resolve: {
		alias: {
			'@dragoscatalin/memory-graph': resolve(__dirname, './packages/memory-graph/src'),
			'@dragoscatalin/agent-runtime': resolve(__dirname, './packages/agent-runtime/src'),
			'@dragoscatalin/ui-components': resolve(__dirname, './packages/ui-components/src'),
		},
	},
});
