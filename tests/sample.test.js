/**
 * Sample test for codai
 * This ensures the test infrastructure is working
 */

describe('codai Service', () => {
	test('should be defined', () => {
		expect(true).toBe(true);
	});

	test('should have basic functionality', () => {
		const service = { name: 'codai', version: '1.0.0' };
		expect(service.name).toBe('codai');
		expect(service.version).toBeDefined();
	});

	test('should pass async test', async () => {
		const result = await Promise.resolve('success');
		expect(result).toBe('success');
	});
});
