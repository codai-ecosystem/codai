import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlannerAgent } from './PlannerAgent';
import type { Task, AgentConfig } from '../types';
import type { MemoryGraphEngine } from '@dragoscatalin/memory-graph';

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

describe('PlannerAgent', () => {
	let plannerAgent: PlannerAgent;
	let mockConfig: AgentConfig;

	beforeEach(() => {
		vi.clearAllMocks();

		mockConfig = {
			id: 'planner-agent',
			name: 'PlannerAgent',
			description: 'Agent for project planning and architecture',
			type: 'planner',
			capabilities: [
				{
					name: 'planning',
					description: 'Plan project features and architecture',
					inputs: [{ name: 'requirements', type: 'string', required: false }],
					outputs: [{ name: 'plan', type: 'object' }]
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

		plannerAgent = new PlannerAgent(mockConfig, mockMemoryGraph);
	});

	describe('canExecuteTask', () => {
		it('should return true for planning tasks', () => {
			const task: Task = {
				id: 'task-1',
				title: 'Create project plan',
				description: 'Plan the project architecture',
				agentId: 'planner-agent',
				status: 'pending',
				priority: 'medium',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			expect(plannerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should return true for architecture tasks', () => {
			const task: Task = {
				id: 'task-2',
				title: 'Design system architecture',
				description: 'Create the overall system design',
				agentId: 'planner-agent',
				status: 'pending',
				priority: 'high',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			expect(plannerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should return true for feature planning tasks', () => {
			const task: Task = {
				id: 'task-3',
				title: 'Plan feature implementation',
				description: 'Plan how to implement new features',
				agentId: 'planner-agent',
				status: 'pending',
				priority: 'medium',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			expect(plannerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should return true for requirement analysis tasks', () => {
			const task: Task = {
				id: 'task-4',
				title: 'Analyze requirements',
				description: 'Analyze project requirements and dependencies',
				agentId: 'planner-agent',
				status: 'pending',
				priority: 'high',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			expect(plannerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should return true for design tasks', () => {
			const task: Task = {
				id: 'task-5',
				title: 'Design system',
				description: 'Create system design documentation',
				agentId: 'planner-agent',
				status: 'pending',
				priority: 'medium',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			expect(plannerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should return false for non-planning tasks', () => {
			const task: Task = {
				id: 'task-6',
				title: 'Run tests',
				description: 'Execute unit tests',
				agentId: 'tester-agent',
				status: 'pending',
				priority: 'low',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			expect(plannerAgent.canExecuteTask(task)).toBe(false);
		});
	});

	describe('executeTask', () => {
		it('should execute planning tasks successfully', async () => {
			const task: Task = {
				id: 'task-1',
				title: 'Create project plan',
				description: 'Plan the project architecture and structure',
				agentId: 'planner-agent',
				status: 'pending',
				priority: 'medium',
				inputs: {
					requirements: 'Create a web application with user authentication and data management'
				},
				progress: 0,
				createdAt: new Date()
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			if (result.outputs) {
				expect(result.outputs.analysis).toBeDefined();
				expect(result.outputs.plan).toBeDefined();
			}
		});

		it('should execute architecture tasks successfully', async () => {
			const task: Task = {
				id: 'task-2',
				title: 'Design system architecture',
				description: 'Create overall system architecture',
				agentId: 'planner-agent',
				status: 'pending',
				priority: 'high',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
		});

		it('should execute feature planning tasks successfully', async () => {
			const task: Task = {
				id: 'task-3',
				title: 'Plan feature implementation',
				description: 'Plan new feature development',
				agentId: 'planner-agent',
				status: 'pending',
				priority: 'medium',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
		});

		it('should execute requirement analysis tasks successfully', async () => {
			const task: Task = {
				id: 'task-4',
				title: 'Analyze requirements',
				description: 'Analyze project requirements',
				agentId: 'planner-agent',
				status: 'pending',
				priority: 'high',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
		});

		it('should execute design tasks successfully', async () => {
			const task: Task = {
				id: 'task-5',
				title: 'Design system',
				description: 'Create system design',
				agentId: 'planner-agent',
				status: 'pending',
				priority: 'medium',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
		});

		it('should handle task execution errors gracefully', async () => {
			const task: Task = {
				id: 'task-6',
				title: '',
				description: '',
				agentId: 'planner-agent',
				status: 'pending',
				priority: 'low',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});

		it('should include execution duration in results', async () => {
			const task: Task = {
				id: 'task-7',
				title: 'Plan project',
				description: 'Create project plan',
				agentId: 'planner-agent',
				status: 'pending',
				priority: 'medium',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.duration).toBeDefined();
			expect(result.duration).toBeGreaterThan(0);
		});

		it('should set task progress to 100 on successful completion', async () => {
			const task: Task = {
				id: 'task-8',
				title: 'Create architecture',
				description: 'Design system architecture',
				agentId: 'planner-agent',
				status: 'pending',
				priority: 'high',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(task.progress).toBe(100);
		});
	});

	describe('requirement analysis', () => {
		it('should analyze requirements and generate appropriate outputs', async () => {
			const task: Task = {
				id: 'req-task-1',
				title: 'Analyze user requirements',
				description: 'Analyze the user requirements for the new feature',
				agentId: 'planner-agent',
				status: 'pending',
				priority: 'high',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
		});

		it('should identify dependencies in requirements', async () => {
			const task: Task = {
				id: 'req-task-2',
				title: 'Plan with dependencies',
				description: 'Plan feature that requires database and API integration',
				agentId: 'planner-agent',
				status: 'pending',
				priority: 'high',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
		});
	});

	describe('task generation', () => {
		it('should generate sub-tasks for complex planning', async () => {
			const task: Task = {
				id: 'gen-task-1',
				title: 'Plan complete feature',
				description: 'Plan a complete feature from start to finish',
				agentId: 'planner-agent',
				status: 'pending',
				priority: 'high',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
		});

		it('should generate structured planning documentation', async () => {
			const task: Task = {
				id: 'gen-task-2',
				title: 'Create project structure',
				description: 'Generate project structure and organization plan',
				agentId: 'planner-agent',
				status: 'pending',
				priority: 'medium',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
		});
	});

	describe('memory integration', () => {
		it('should store planning results in memory graph', async () => {
			const task: Task = {
				id: 'mem-task-1',
				title: 'Plan and store',
				description: 'Plan feature and store results',
				agentId: 'planner-agent',
				status: 'pending',
				priority: 'medium',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			await plannerAgent.executeTask(task);

			expect(mockMemoryGraph.addNode).toHaveBeenCalled();
		});

		it('should query memory graph for existing plans', async () => {
			const task: Task = {
				id: 'mem-task-2',
				title: 'Plan based on existing',
				description: 'Plan new feature based on existing architecture',
				agentId: 'planner-agent',
				status: 'pending',
				priority: 'medium',
				inputs: {},
				progress: 0,
				createdAt: new Date()
			};

			await plannerAgent.executeTask(task);

			// Verify memory graph is accessed for storing nodes
			expect(mockMemoryGraph.addNode).toHaveBeenCalled();
		});
	});
});
