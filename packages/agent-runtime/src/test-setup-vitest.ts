// Vitest setup for agent-runtime tests
import { vi, beforeEach, expect } from 'vitest';

// Global test setup
beforeEach(() => {
	// Clear all mocks before each test
	vi.clearAllMocks();
});

// Mock console methods to reduce noise in tests
global.console = {
	...console,
	log: vi.fn(),
	debug: vi.fn(),
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
};

// Add custom matchers if needed
expect.extend({
	toBeValidTestCode(received: string) {
		const hasDescribe = received.includes('describe(');
		const hasTest = received.includes('test(') || received.includes('it(');
		const hasExpect = received.includes('expect(');

		const pass = hasDescribe && hasTest && hasExpect;

		if (pass) {
			return {
				message: () => `expected ${received} not to be valid test code`,
				pass: true,
			};
		} else {
			return {
				message: () =>
					`expected ${received} to be valid test code with describe, test/it, and expect`,
				pass: false,
			};
		}
	},
});

// Extend Vitest matchers type
declare module 'vitest' {
	interface Assertion<T = any> {
		toBeValidTestCode(): T;
	}
	interface AsymmetricMatchersContaining {
		toBeValidTestCode(): any;
	}
}
