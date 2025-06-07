import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Clean up after each test
afterEach(() => {
	cleanup();
});

// Add process global for Node.js compatibility
if (typeof global.process === 'undefined') {
	global.process = {
		env: {},
		// Add any other required process properties
		nextTick: (fn: Function, ...args: any[]) => setTimeout(() => fn(...args), 0)
	} as any;
}

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// Mock SVG getComputedTextLength
Object.defineProperty(SVGElement.prototype, 'getComputedTextLength', {
	writable: true,
	value: vi.fn().mockReturnValue(100),
});

// Mock getBBox for SVG elements
Object.defineProperty(SVGElement.prototype, 'getBBox', {
	writable: true,
	value: vi.fn().mockReturnValue({
		x: 0,
		y: 0,
		width: 100,
		height: 20,
	}),
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));

// Mock IDBKeyRange if not available
if (typeof global.IDBKeyRange === 'undefined') {
	global.IDBKeyRange = {
		only: (key: any) => ({ key, type: 'only', includes: (x: any) => x === key }),
		lowerBound: (lower: any, open = false) => ({
			lower,
			type: 'lowerBound',
			open,
			includes: (x: any) => open ? x > lower : x >= lower
		}),
		upperBound: (upper: any, open = false) => ({
			upper,
			type: 'upperBound',
			open,
			includes: (x: any) => open ? x < upper : x <= upper
		}),
		bound: (lower: any, upper: any, lowerOpen = false, upperOpen = false) => ({
			lower,
			upper,
			type: 'bound',
			lowerOpen,
			upperOpen,
			includes: (x: any) => {
				const aboveLower = lowerOpen ? x > lower : x >= lower;
				const belowUpper = upperOpen ? x < upper : x <= upper;
				return aboveLower && belowUpper;
			}
		})
	} as any;
}

// Mock console methods to reduce noise in tests
global.console = {
	...console,
	warn: vi.fn(),
	error: vi.fn(),
	log: vi.fn(),
};
