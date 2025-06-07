import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TesterAgent } from './TesterAgent';
import { AgentConfig, Task } from '../types';
import { MemoryGraphEngine } from '@codai/memory-graph';

describe('TesterAgent', () => {
	let testerAgent: TesterAgent;
	let mockMemoryGraph: any;
	let mockConfig: AgentConfig;

	beforeEach(() => {
		mockMemoryGraph = {
			addNode: vi.fn(),
			getNode: vi.fn(),
			updateNode: vi.fn(),
			removeNode: vi.fn(),
			query: vi.fn(),
			traverse: vi.fn(),
			getStats: vi.fn(),
		} as any;

		mockConfig = {
			id: 'test-tester',
			name: 'Test Tester Agent',
			description: 'Agent for testing',
			type: 'tester',
			capabilities: [{
				name: 'test_generation',
				description: 'Generate tests',
				inputs: [
					{ name: 'code', type: 'string', required: true, description: 'Code to test' }
				],
				outputs: [
					{ name: 'tests', type: 'array', description: 'Generated tests' }
				]
			}],
			aiProvider: {
				provider: 'openai',
				model: 'gpt-4',
				temperature: 0.2,
			},
			priority: 6,
			isEnabled: true,
		};

		testerAgent = new TesterAgent(mockConfig, mockMemoryGraph);
	});

	describe('canExecuteTask', () => {
		it('should return true for unit testing tasks', () => {
			const task: Task = {
				id: 'test-1',
				title: 'Unit_testing for Calculator',
				description: 'Create unit tests for calculator functions',
				agentId: 'test-tester',
				status: 'pending',
				priority: 'medium',
				inputs: { code: 'function add(a, b) { return a + b; }' },
				createdAt: new Date(),
				progress: 0,
			};

			expect(testerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should return true for integration testing tasks', () => {
			const task: Task = {
				id: 'test-2',
				title: 'Integration_testing for API',
				description: 'Create integration tests for user API',
				agentId: 'test-tester',
				status: 'pending',
				priority: 'medium',
				inputs: { code: 'API code here' },
				createdAt: new Date(),
				progress: 0,
			};

			expect(testerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should return true for e2e testing tasks', () => {
			const task: Task = {
				id: 'test-3',
				title: 'E2e_testing for User Flow',
				description: 'Create end-to-end tests for user registration flow',
				agentId: 'test-tester',
				status: 'pending',
				priority: 'medium',
				inputs: { code: 'User flow code' },
				createdAt: new Date(),
				progress: 0,
			};

			expect(testerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should return true for performance testing tasks', () => {
			const task: Task = {
				id: 'test-4',
				title: 'Performance_testing for Database',
				description: 'Create performance tests for database queries',
				agentId: 'test-tester',
				status: 'pending',
				priority: 'medium',
				inputs: { code: 'Database code' },
				createdAt: new Date(),
				progress: 0,
			};

			expect(testerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should return true for security testing tasks', () => {
			const task: Task = {
				id: 'test-5',
				title: 'Security_testing for Authentication',
				description: 'Create security tests for auth system',
				agentId: 'test-tester',
				status: 'pending',
				priority: 'medium',
				inputs: { code: 'Auth code' },
				createdAt: new Date(),
				progress: 0,
			};

			expect(testerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should return false for non-testing tasks', () => {
			const task: Task = {
				id: 'test-6',
				title: 'Build Frontend Components',
				description: 'Create React components for the dashboard',
				agentId: 'test-builder',
				status: 'pending',
				priority: 'medium',
				inputs: { requirements: 'Dashboard requirements' },
				createdAt: new Date(),
				progress: 0,
			};

			expect(testerAgent.canExecuteTask(task)).toBe(false);
		});
	});

	describe('executeTask', () => {
		beforeEach(() => {
			// Mock the sendMessage method
			vi.spyOn(testerAgent as any, 'sendMessage').mockResolvedValue(undefined);
		});
		it('should execute unit testing task successfully', async () => {
			const task: Task = {
				id: 'test-1',
				title: 'Unit_testing for Calculator',
				description: 'Create unit tests for calculator functions',
				agentId: 'test-tester',
				status: 'pending',
				priority: 'medium',
				inputs: {
					code: 'function add(a, b) { return a + b; }',
					testType: 'unit'
				},
				createdAt: new Date(),
				progress: 0,
			};

			const result = await testerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			expect(result.outputs?.testType).toBe('unit');
			expect(typeof result.outputs?.result).toBe('string');
			expect(result.duration).toBeGreaterThanOrEqual(0);
		});
		it('should execute integration testing task successfully', async () => {
			const task: Task = {
				id: 'test-2',
				title: 'Integration_testing for API',
				description: 'Create integration tests for user API',
				agentId: 'test-tester',
				status: 'pending',
				priority: 'medium',
				inputs: {
					code: 'const express = require("express"); const app = express();',
					testType: 'integration'
				},
				createdAt: new Date(),
				progress: 0,
			};

			const result = await testerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			expect(result.outputs?.testType).toBe('integration');
			expect(typeof result.outputs?.result).toBe('string');
			expect(result.duration).toBeGreaterThanOrEqual(0);
		});
		it('should execute e2e testing task successfully', async () => {
			const task: Task = {
				id: 'test-3',
				title: 'E2e_testing for User Flow',
				description: 'Create end-to-end tests for user registration',
				agentId: 'test-tester',
				status: 'pending',
				priority: 'medium',
				inputs: {
					code: 'React component code',
					testType: 'e2e'
				},
				createdAt: new Date(),
				progress: 0,
			};

			const result = await testerAgent.executeTask(task); expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			expect(result.outputs?.testType).toBe('e2e');
			expect(typeof result.outputs?.result).toBe('string');
			expect(result.duration).toBeGreaterThanOrEqual(0);
		});
		it('should execute performance testing task successfully', async () => {
			const task: Task = {
				id: 'test-4',
				title: 'Performance_testing for Database',
				description: 'Create performance tests for database queries',
				agentId: 'test-tester',
				status: 'pending',
				priority: 'medium',
				inputs: {
					code: 'Database query code',
					testType: 'performance'
				},
				createdAt: new Date(),
				progress: 0,
			};

			const result = await testerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined(); expect(result.outputs?.testType).toBe('performance');
			expect(typeof result.outputs?.result).toBe('string');
			expect(result.duration).toBeGreaterThanOrEqual(0);
		});
		it('should execute security testing task successfully', async () => {
			const task: Task = {
				id: 'test-5',
				title: 'Security_testing for Authentication',
				description: 'Create security tests for auth system',
				agentId: 'test-tester',
				status: 'pending',
				priority: 'medium',
				inputs: {
					code: 'Authentication code',
					testType: 'security'
				},
				createdAt: new Date(),
				progress: 0,
			};

			const result = await testerAgent.executeTask(task); expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			expect(result.outputs?.testType).toBe('security');
			expect(typeof result.outputs?.result).toBe('string');
			expect(result.duration).toBeGreaterThanOrEqual(0);
		});
		it('should default to unit tests when testType is not specified', async () => {
			const task: Task = {
				id: 'test-6',
				title: 'Unit_testing for Utility Functions',
				description: 'Create tests for utility functions',
				agentId: 'test-tester',
				status: 'pending',
				priority: 'medium',
				inputs: {
					code: 'function utils() { return true; }'
				},
				createdAt: new Date(),
				progress: 0,
			};

			const result = await testerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			expect(result.outputs?.testType).toBe('unit');
		});
		it('should handle errors gracefully', async () => {
			// Mock an error during test generation
			vi.spyOn(testerAgent as any, 'generateUnitTests').mockRejectedValue(new Error('Test generation failed'));

			const task: Task = {
				id: 'test-error',
				title: 'Unit Testing with Error',
				description: 'This should fail',
				agentId: 'test-tester',
				status: 'pending',
				priority: 'medium',
				inputs: {
					code: 'invalid code',
					testType: 'unit'
				},
				createdAt: new Date(),
				progress: 0,
			};

			const result = await testerAgent.executeTask(task); expect(result.success).toBe(false);
			expect(result.error).toBe('Test generation failed');
			expect(result.duration).toBeGreaterThanOrEqual(0);
		});
	});

	describe('test framework detection', () => {
		it('should detect Jest from package.json', () => {
			const task: Task = {
				id: 'test-jest',
				title: 'Jest Testing',
				description: 'Test with Jest',
				agentId: 'test-tester',
				status: 'pending',
				priority: 'medium',
				inputs: {
					code: 'function test() {}',
					packageJson: {
						devDependencies: {
							jest: '^29.0.0'
						}
					}
				},
				createdAt: new Date(),
				progress: 0,
			};

			const framework = (testerAgent as any).detectTestFramework(task);
			expect(framework).toBe('jest');
		});

		it('should detect Mocha from package.json', () => {
			const task: Task = {
				id: 'test-mocha',
				title: 'Mocha Testing',
				description: 'Test with Mocha',
				agentId: 'test-tester',
				status: 'pending',
				priority: 'medium',
				inputs: {
					code: 'function test() {}',
					packageJson: {
						devDependencies: {
							mocha: '^10.0.0'
						}
					}
				},
				createdAt: new Date(),
				progress: 0,
			};

			const framework = (testerAgent as any).detectTestFramework(task);
			expect(framework).toBe('mocha');
		});

		it('should detect Vitest from package.json', () => {
			const task: Task = {
				id: 'test-vitest',
				title: 'Vitest Testing',
				description: 'Test with Vitest',
				agentId: 'test-tester',
				status: 'pending',
				priority: 'medium',
				inputs: {
					code: 'function test() {}',
					packageJson: {
						devDependencies: {
							vitest: '^0.34.0'
						}
					}
				},
				createdAt: new Date(),
				progress: 0,
			};

			const framework = (testerAgent as any).detectTestFramework(task);
			expect(framework).toBe('vitest');
		});

		it('should detect Playwright from package.json', () => {
			const task: Task = {
				id: 'test-playwright',
				title: 'Playwright Testing',
				description: 'Test with Playwright',
				agentId: 'test-tester',
				status: 'pending',
				priority: 'medium',
				inputs: {
					code: 'function test() {}',
					packageJson: {
						devDependencies: {
							'@playwright/test': '^1.40.0'
						}
					}
				},
				createdAt: new Date(),
				progress: 0,
			};

			const framework = (testerAgent as any).detectTestFramework(task);
			expect(framework).toBe('playwright');
		});

		it('should default to Jest when no framework is detected', () => {
			const task: Task = {
				id: 'test-default',
				title: 'Default Testing',
				description: 'Test with default framework',
				agentId: 'test-tester',
				status: 'pending',
				priority: 'medium',
				inputs: {
					code: 'function test() {}'
				},
				createdAt: new Date(),
				progress: 0,
			};

			const framework = (testerAgent as any).detectTestFramework(task);
			expect(framework).toBe('jest');
		});
	});

	describe('function extraction', () => {
		it('should extract regular functions', () => {
			const code = `
				function add(a, b) {
					return a + b;
				}

				function multiply(x, y) {
					return x * y;
				}
			`;

			const functions = (testerAgent as any).extractFunctions(code);

			expect(functions).toHaveLength(2);
			expect(functions[0]).toEqual({
				name: 'add',
				parameters: ['a', 'b']
			});
			expect(functions[1]).toEqual({
				name: 'multiply',
				parameters: ['x', 'y']
			});
		});

		it('should extract arrow functions', () => {
			const code = `
				const subtract = (a, b) => a - b;
				const divide = (x, y) => x / y;
			`;

			const functions = (testerAgent as any).extractFunctions(code);

			expect(functions).toHaveLength(2);
			expect(functions[0]).toEqual({
				name: 'subtract',
				parameters: ['a', 'b']
			});
			expect(functions[1]).toEqual({
				name: 'divide',
				parameters: ['x', 'y']
			});
		});

		it('should handle functions with no parameters', () => {
			const code = `
				function greet() {
					return "Hello";
				}

				const getMessage = () => "Welcome";
			`;

			const functions = (testerAgent as any).extractFunctions(code);

			expect(functions).toHaveLength(2);
			expect(functions[0]).toEqual({
				name: 'greet',
				parameters: []
			});
			expect(functions[1]).toEqual({
				name: 'getMessage',
				parameters: []
			});
		});
	});

	describe('test generation', () => {
		it('should generate Jest test header correctly', () => {
			const header = (testerAgent as any).generateTestHeader('jest');
			expect(header).toContain("require('@jest/globals')");
			expect(header).toContain('test, expect, describe, beforeEach, afterEach');
		});

		it('should generate Mocha test header correctly', () => {
			const header = (testerAgent as any).generateTestHeader('mocha');
			expect(header).toContain("require('chai')");
			expect(header).toContain("require('mocha')");
		});

		it('should generate Vitest test header correctly', () => {
			const header = (testerAgent as any).generateTestHeader('vitest');
			expect(header).toContain("import { test, expect, describe, beforeEach, afterEach } from 'vitest'");
		});

		it('should generate test setup correctly', () => {
			const setup = (testerAgent as any).generateTestSetup('function test() {}');
			expect(setup).toContain("describe('Generated Tests'");
			expect(setup).toContain('beforeEach');
			expect(setup).toContain('afterEach');
		});

		it('should generate test case for Jest correctly', () => {
			const testCase = {
				name: 'should test add function',
				input: 'a, b',
				expected: 'sum'
			};

			const caseCode = (testerAgent as any).generateTestCase(testCase, 'jest');
			expect(caseCode).toContain('test(');
			expect(caseCode).toContain('should test add function');
			expect(caseCode).toContain('expect(true).toBe(true)');
		});

		it('should generate test case for Mocha correctly', () => {
			const testCase = {
				name: 'should test multiply function',
				input: 'x, y',
				expected: 'product'
			};

			const caseCode = (testerAgent as any).generateTestCase(testCase, 'mocha');
			expect(caseCode).toContain('it(');
			expect(caseCode).toContain('should test multiply function');
		});

		it('should generate test teardown correctly', () => {
			const teardown = (testerAgent as any).generateTestTeardown();
			expect(teardown).toContain('});');
		});
	});

	describe('memory graph integration', () => {
		it('should store test results in memory graph', async () => {
			const task: Task = {
				id: 'test-memory',
				title: 'Memory Test',
				description: 'Test memory integration',
				agentId: 'test-tester',
				status: 'pending',
				priority: 'medium',
				inputs: { code: 'function test() {}' },
				createdAt: new Date(),
				progress: 0,
			};

			await (testerAgent as any).storeTestResult('unit', 'test code', task);

			expect(mockMemoryGraph.addNode).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'test',
					name: 'Unit Test',
					testType: 'unit',
					metadata: expect.objectContaining({
						createdBy: mockConfig.id,
						generatedCode: 'test code',
						taskId: task.id
					})
				})
			);
		});
	});
});
