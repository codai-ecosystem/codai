import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('localStorage mock test', () => {
	beforeEach(() => {
		window.localStorage.clear();
		vi.clearAllMocks();
	});

	it('should store and retrieve values', () => {
		window.localStorage.setItem('test', 'value');
		expect(window.localStorage.getItem('test')).toBe('value');
	});

	it('should clear values between tests', () => {
		expect(window.localStorage.getItem('test')).toBeNull();
	});

	it('should clear all values', () => {
		window.localStorage.setItem('test1', 'value1');
		window.localStorage.setItem('test2', 'value2');
		window.localStorage.clear();
		expect(window.localStorage.getItem('test1')).toBeNull();
		expect(window.localStorage.getItem('test2')).toBeNull();
	});
});
