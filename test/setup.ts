/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Global test setup for AIDE project
 * Configures testing environment and shared utilities
 */

import { beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock environment variables for tests
beforeEach(() => {
	vi.stubEnv('NODE_ENV', 'test');
	vi.stubEnv('AIDE_LOG_LEVEL', 'silent');
	vi.stubEnv('AIDE_PERSISTENCE_PATH', './test-data');
});

afterEach(() => {
	vi.unstubAllEnvs();
	vi.clearAllMocks();
});

// Global test utilities
declare global {
	const mockMemoryGraph: {
		clear: () => void;
		addNode: (node: any) => void;
		getNode: (id: string) => any;
	};
}

// Mock memory graph for tests
globalThis.mockMemoryGraph = {
	clear: vi.fn(),
	addNode: vi.fn(),
	getNode: vi.fn()
};
