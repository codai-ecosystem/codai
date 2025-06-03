import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Clean up after each test
afterEach(() => {
	cleanup();
});

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

// Mock console methods to reduce noise in tests
global.console = {
	...console,
	warn: vi.fn(),
	error: vi.fn(),
	log: vi.fn(),
};
