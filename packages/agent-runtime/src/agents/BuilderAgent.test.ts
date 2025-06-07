/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BuilderAgent } from './BuilderAgent';
import type { Task, AgentConfig } from '../types';
import type { MemoryGraphEngine } from '@codai/memory-graph';

// Mock MemoryGraphEngine
const mockMemoryGraph = {
	addNode: vi.fn(),
	getNode: vi.fn(),
	updateNode: vi.fn(),
	removeNode: vi.fn(),
	getNodesByType: vi.fn(),
	addRelationship: vi.fn(),
	removeRelationship: vi.fn(),
	getRelationships: vi.fn(),
	getRelatedNodes: vi.fn(),
	getDependencyChain: vi.fn(),
	validateGraph: vi.fn(),
	toJSON: vi.fn(),
	get currentGraph() { return {}; },
	get nodes() { return []; },
	get relationships() { return []; },
	get graph$() { return { asObservable: vi.fn() }; },
	get changes$() { return { asObservable: vi.fn() }; }
} as any;

describe('BuilderAgent', () => {
	let builderAgent: BuilderAgent;
	let mockConfig: AgentConfig;

	beforeEach(() => {
		vi.clearAllMocks();

		mockConfig = {
			id: 'builder-agent',
			name: 'BuilderAgent',
			description: 'Agent for code generation and building',
			type: 'builder',
			capabilities: [
				{
					name: 'code_generation',
					description: 'Generate code based on specifications',
					inputs: [
						{ name: 'specification', type: 'object', required: true },
						{ name: 'language', type: 'string', required: true }
					],
					outputs: [{ name: 'code', type: 'object' }]
				},
				{
					name: 'project_setup',
					description: 'Set up project structure and configuration',
					inputs: [
						{ name: 'specification', type: 'object', required: true },
						{ name: 'language', type: 'string', required: true }
					],
					outputs: [{ name: 'project_structure', type: 'object' }]
				}
			],
			aiProvider: {
				provider: 'openai',
				model: 'gpt-4',
				temperature: 0.7
			},
			priority: 5,
			isEnabled: true
		};

		builderAgent = new BuilderAgent(mockConfig, mockMemoryGraph);
	});

	describe('canExecuteTask', () => {
		it('should return true for code generation tasks', () => {
			const task: Task = {
				id: 'task-1',
				title: 'Generate component code',
				description: 'Create a React component for user authentication',
				agentId: 'builder-agent',
				status: 'pending',
				priority: 'high',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			const result = builderAgent.canExecuteTask(task);
			expect(result).toBe(true);
		});

		it('should return true for implementation tasks', () => {
			const task: Task = {
				id: 'task-2',
				title: 'API implementation required',
				description: 'Implement REST API endpoints',
				agentId: 'builder-agent',
				status: 'pending',
				priority: 'high',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			const result = builderAgent.canExecuteTask(task);
			expect(result).toBe(true);
		});

		it('should return true for project setup tasks', () => {
			const task: Task = {
				id: 'task-3',
				title: 'Project setup needed',
				description: 'Set up a new Next.js project',
				agentId: 'builder-agent',
				status: 'pending',
				priority: 'medium',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			const result = builderAgent.canExecuteTask(task);
			expect(result).toBe(true);
		});

		it('should return true for component creation tasks', () => {
			const task: Task = {
				id: 'task-4',
				title: 'Component creation required',
				description: 'Create UI components for dashboard',
				agentId: 'builder-agent',
				status: 'pending',
				priority: 'medium',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			const result = builderAgent.canExecuteTask(task);
			expect(result).toBe(true);
		});

		it('should return true for file creation tasks', () => {
			const task: Task = {
				id: 'task-5',
				title: 'File creation needed',
				description: 'Create configuration files',
				agentId: 'builder-agent',
				status: 'pending',
				priority: 'low',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			const result = builderAgent.canExecuteTask(task);
			expect(result).toBe(true);
		});

		it('should return true for tasks assigned to builder agent', () => {
			const task: Task = {
				id: 'task-6',
				title: 'Custom task',
				description: 'Some custom building task',
				agentId: 'builder',
				status: 'pending',
				priority: 'medium',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			const result = builderAgent.canExecuteTask(task);
			expect(result).toBe(true);
		});

		it('should return false for non-building tasks', () => {
			const task: Task = {
				id: 'task-7',
				title: 'Plan project requirements',
				description: 'Analyze and plan the project architecture',
				agentId: 'planner-agent',
				status: 'pending',
				priority: 'medium',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			const result = builderAgent.canExecuteTask(task);
			expect(result).toBe(false);
		});
	});

	describe('executeTask', () => {
		it('should execute code generation tasks successfully', async () => {
			const task: Task = {
				id: 'task-8',
				title: 'Generate code',
				description: 'Generate React component code',
				agentId: 'builder-agent',
				status: 'pending',
				priority: 'high',
				inputs: {
					specification: {
						name: 'UserCard',
						type: 'component',
						props: ['user', 'onClick'],
						styling: 'Tailwind CSS'
					},
					language: 'TypeScript React'
				},
				progress: 0,
				createdAt: new Date()
			};

			const result = await builderAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			expect(result.duration).toBeGreaterThan(0);
		});

		it('should execute project setup tasks successfully', async () => {
			const task: Task = {
				id: 'task-9',
				title: 'Project setup',
				description: 'Set up new web application',
				agentId: 'builder-agent',
				status: 'pending',
				priority: 'high',
				inputs: {
					specification: {
						project_type: 'web_application',
						name: 'my-app',
						description: 'A new web application',
						technical_stack: ['React', 'TypeScript', 'Tailwind CSS', 'Vite']
					},
					language: 'TypeScript'
				},
				progress: 0,
				createdAt: new Date()
			};

			const result = await builderAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			expect(result.outputs?.project_structure).toBeDefined();
			expect(result.outputs?.config_files).toBeDefined();
			expect(result.outputs?.package_config).toBeDefined();
			expect(result.duration).toBeGreaterThan(0);
		});

		it('should execute component creation tasks successfully', async () => {
			const task: Task = {
				id: 'task-10',
				title: 'Create component',
				description: 'Create a new UI component',
				agentId: 'builder-agent',
				status: 'pending',
				priority: 'medium',
				inputs: {
					specification: {
						name: 'Button',
						type: 'component',
						props: ['children', 'onClick', 'variant'],
						styling: 'Tailwind CSS'
					},
					language: 'TypeScript React'
				},
				progress: 0,
				createdAt: new Date()
			};

			const result = await builderAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			expect(result.outputs?.component_code).toBeDefined();
			expect(result.outputs?.styles).toBeDefined();
			expect(result.outputs?.tests).toBeDefined();
			expect(result.duration).toBeGreaterThan(0);
		});

		it('should execute API implementation tasks successfully', async () => {
			const task: Task = {
				id: 'task-11',
				title: 'Implement API',
				description: 'Create REST API endpoints',
				agentId: 'builder-agent',
				status: 'pending',
				priority: 'high',
				inputs: {
					specification: {
						name: 'UserAPI',
						endpoints: [
							{ method: 'GET', path: '/users', description: 'Get all users' },
							{ method: 'POST', path: '/users', description: 'Create user' },
							{ method: 'GET', path: '/users/:id', description: 'Get user by ID' }
						]
					},
					language: 'TypeScript Node.js'
				},
				progress: 0,
				createdAt: new Date()
			};

			const result = await builderAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			expect(result.outputs?.api_code).toBeDefined();
			expect(result.outputs?.schemas).toBeDefined();
			expect(result.outputs?.tests).toBeDefined();
			expect(result.duration).toBeGreaterThan(0);
		});

		it('should handle task execution errors gracefully', async () => {
			const task: Task = {
				id: 'task-12',
				title: 'Generate code',
				description: 'Generate invalid code',
				agentId: 'builder-agent',
				status: 'pending',
				priority: 'medium',
				inputs: {
					// Missing required specification
					language: 'TypeScript'
				},
				progress: 0,
				createdAt: new Date()
			};

			const result = await builderAgent.executeTask(task);

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.duration).toBeGreaterThan(0);
		});

		it('should include execution duration in results', async () => {
			const task: Task = {
				id: 'task-13',
				title: 'Generate code',
				description: 'Generate simple component',
				agentId: 'builder-agent',
				status: 'pending',
				priority: 'medium',
				inputs: {
					specification: {
						name: 'SimpleComponent',
						type: 'component'
					},
					language: 'TypeScript React'
				},
				progress: 0,
				createdAt: new Date()
			};

			const result = await builderAgent.executeTask(task);

			expect(result.duration).toBeDefined();
			expect(result.duration).toBeGreaterThan(0);
		});
	});

	describe('code generation capabilities', () => {
		it('should generate appropriate project structure', async () => {
			const task: Task = {
				id: 'gen-task-1',
				title: 'Project setup',
				description: 'Set up React project structure',
				agentId: 'builder-agent',
				status: 'pending',
				priority: 'high',
				inputs: {
					specification: {
						project_type: 'web_application',
						name: 'react-app',
						technical_stack: ['React', 'TypeScript']
					},
					language: 'TypeScript'
				},
				progress: 0,
				createdAt: new Date()
			};

			const result = await builderAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs?.project_structure).toBeDefined();
			expect(result.outputs?.config_files).toBeDefined();
			expect(result.outputs?.setup_commands).toBeDefined();
		});

		it('should generate configuration files for specified stack', async () => {
			const task: Task = {
				id: 'gen-task-2',
				title: 'Project setup with Tailwind',
				description: 'Set up project with Tailwind CSS',
				agentId: 'builder-agent',
				status: 'pending',
				priority: 'medium',
				inputs: {
					specification: {
						project_type: 'web_application',
						technical_stack: ['TypeScript', 'Tailwind CSS', 'Vite']
					},
					language: 'TypeScript'
				},
				progress: 0,
				createdAt: new Date()
			};

			const result = await builderAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs?.config_files).toBeDefined();
			// Verify specific config files are generated
			const configFiles = result.outputs?.config_files as Record<string, string>;
			expect(configFiles).toHaveProperty('tsconfig.json');
		});
	});

	describe('memory integration', () => {
		it('should store building results in memory graph', async () => {
			const task: Task = {
				id: 'mem-task-1',
				title: 'Create component with memory',
				description: 'Create component and store in memory',
				agentId: 'builder-agent',
				status: 'pending',
				priority: 'medium',
				inputs: {
					specification: {
						name: 'MemoryComponent',
						type: 'component'
					},
					language: 'TypeScript React'
				},
				progress: 0,
				createdAt: new Date()
			};

			await builderAgent.executeTask(task);

			// Verify memory graph is accessed for storing nodes
			expect(mockMemoryGraph.addNode).toHaveBeenCalled();
		});

		it('should track API implementations in memory graph', async () => {
			const task: Task = {
				id: 'mem-task-2',
				title: 'API implementation with memory',
				description: 'Create API and store in memory',
				agentId: 'builder-agent',
				status: 'pending',
				priority: 'high',
				inputs: {
					specification: {
						name: 'TestAPI',
						endpoints: [{ method: 'GET', path: '/test' }]
					},
					language: 'TypeScript Node.js'
				},
				progress: 0,
				createdAt: new Date()
			};

			await builderAgent.executeTask(task);

			// Verify memory graph is accessed for storing API nodes
			expect(mockMemoryGraph.addNode).toHaveBeenCalled();
		});
	});
});
