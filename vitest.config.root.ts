/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Root Vitest configuration for AIDE project
 * Provides shared testing setup for all packages
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		globals: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'dist/',
				'**/*.test.ts',
				'**/*.spec.ts',
				'**/test-setup.ts'
			],
			thresholds: {
				global: {
					branches: 70,
					functions: 70,
					lines: 70,
					statements: 70
				}
			}
		},
		testTimeout: 10000,
		hookTimeout: 10000
	},
	resolve: {
		alias: {			'@codai/memory-graph': './packages/memory-graph/src',
			'@codai/agent-runtime': './packages/agent-runtime/src',
			'@codai/ui-components': './packages/ui-components/src'
		}
	}
});
