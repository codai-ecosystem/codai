import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlannerAgent } from './PlannerAgent';
import { MemoryGraphEngine } from '@dragoscatalin/memory-graph';
import { AgentConfig, Task } from '../types';

describe('PlannerAgent', () => {
	let plannerAgent: PlannerAgent;
	let mockMemoryGraph: MemoryGraphEngine;
	let mockConfig: AgentConfig;

	beforeEach(() => {
		// Mock MemoryGraphEngine
		mockMemoryGraph = {
			addNode: vi.fn(),
			getNodes: vi.fn(),
			updateNode: vi.fn(),
			removeNode: vi.fn(),
			getConnections: vi.fn(),
			addConnection: vi.fn(),
			removeConnection: vi.fn(),
			query: vi.fn(),
			persist: vi.fn(),
			load: vi.fn(),
		} as any;

		mockConfig = {
			id: 'planner-agent',
			name: 'PlannerAgent',
			description: 'Planning agent for project architecture',
			type: 'planner',
			capabilities: [
				{
					name: 'project_planning',
					description: 'Plan project architecture and features',
					inputs: [{ name: 'requirements', type: 'string', required: true }],
					outputs: [{ name: 'analysis', type: 'object' }],
				}
			],
			aiProvider: {
				provider: 'openai',
				model: 'gpt-4',
				temperature: 0.7,
			},
			priority: 5,
			isEnabled: true,
		};

		plannerAgent = new PlannerAgent(mockConfig, mockMemoryGraph);
	});

	describe('canExecuteTask', () => {
		it('should return true for project planning tasks', () => {
			const task: Task = {
				id: 'task-1',
				title: 'Create project_planning for e-commerce app',
				description: 'Plan the architecture and features for an e-commerce application',
				agentId: 'planner',
				status: 'pending',
				priority: 'high',
				inputs: {},
				createdAt: new Date(),
				progress: 0,
			};

			expect(plannerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should return true for requirement analysis tasks', () => {
			const task: Task = {
				id: 'task-2',
				title: 'Requirement analysis for mobile app',
				description: 'requirement_analysis for a mobile application',
				agentId: 'planner',
				status: 'pending',
				priority: 'medium',
				inputs: {},
				createdAt: new Date(),
				progress: 0,
			};

			expect(plannerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should return true for task breakdown activities', () => {
			const task: Task = {
				id: 'task-3',
				title: 'Task breakdown for user auth',
				description: 'task_breakdown user auth into manageable tasks',
				agentId: 'planner',
				status: 'pending',
				priority: 'medium',
				inputs: {},
				createdAt: new Date(),
				progress: 0,
			};

			expect(plannerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should return true for architecture planning tasks', () => {
			const task: Task = {
				id: 'task-4',
				title: 'Architecture planning for microservices',
				description: 'architecture_planning the microservices architecture',
				agentId: 'planner',
				status: 'pending',
				priority: 'high',
				inputs: {},
				createdAt: new Date(),
				progress: 0,
			};

			expect(plannerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should return false for non-planning tasks', () => {
			const task: Task = {
				id: 'task-5',
				title: 'Create comprehensive unit tests',
				description: 'Create comprehensive unit tests',
				agentId: 'tester',
				status: 'pending',
				priority: 'medium',
				inputs: {},
				createdAt: new Date(),
				progress: 0,
			};

			expect(plannerAgent.canExecuteTask(task)).toBe(false);
		});

		it('should return false for deployment tasks', () => {
			const task: Task = {
				id: 'task-6',
				title: 'Deploy to AWS',
				description: 'Deploy the app to AWS',
				agentId: 'deployer',
				status: 'pending',
				priority: 'low',
				inputs: {},
				createdAt: new Date(),
				progress: 0,
			};

			expect(plannerAgent.canExecuteTask(task)).toBe(false);
		});
	});

	describe('executeTask', () => {
		it('should execute project planning task successfully', async () => {
			const task: Task = {
				id: 'task-7',
				title: 'Plan e-commerce application',
				description: 'project_planning an e-commerce application with user management and payment processing',
				agentId: 'planner',
				status: 'pending',
				priority: 'high',
				inputs: {
					requirements: 'Build an e-commerce platform with user authentication, product catalog, shopping cart, and payment processing',
					constraints: { budget: 50000, timeline: '3 months' },
				},
				createdAt: new Date(),
				progress: 0,
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			expect(result.outputs!.analysis).toBeDefined();
			expect(result.outputs!.memoryChanges).toBeDefined();
			expect(result.outputs!.tasks).toBeDefined();
			expect(result.duration).toBeGreaterThan(0);
		});

		it('should execute requirement_analysis task successfully', async () => {
			const task: Task = {
				id: 'task-8',
				title: 'Analyze fitness app requirements',
				description: 'requirement_analysis for a mobile fitness tracking app',
				agentId: 'planner',
				status: 'pending',
				priority: 'medium',
				inputs: {
					requirements: 'Create a fitness tracking app with workout logging, progress tracking, and social features',
				},
				createdAt: new Date(),
				progress: 0,
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			expect(result.outputs!.analysis).toBeDefined();
			expect((result.outputs!.analysis as any).features).toBeDefined();
			expect((result.outputs!.analysis as any).architecture).toBeDefined();
		});

		it('should execute task_breakdown successfully', async () => {
			const task: Task = {
				id: 'task-9',
				title: 'Break down auth system',
				description: 'task_breakdown user authentication system into implementable tasks',
				agentId: 'planner',
				status: 'pending',
				priority: 'high',
				inputs: {
					requirements: 'User authentication with email/password, social login, and password reset functionality',
				},
				createdAt: new Date(),
				progress: 0,
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			expect(result.outputs!.tasks).toBeDefined();
			expect(Array.isArray(result.outputs!.tasks)).toBe(true);
			expect((result.outputs!.tasks as any[]).length).toBeGreaterThan(0);
		});

		it('should execute architecture_planning successfully', async () => {
			const task: Task = {
				id: 'task-10',
				title: 'Plan microservices architecture',
				description: 'architecture_planning for a scalable web application',
				agentId: 'planner',
				status: 'pending',
				priority: 'high',
				inputs: {
					requirements: 'Design a microservices architecture for a social media platform with user management, content management, and real-time messaging',
				},
				createdAt: new Date(),
				progress: 0,
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			expect(result.outputs!.analysis).toBeDefined();
			expect((result.outputs!.analysis as any).architecture).toBeDefined();
			expect(result.outputs!.memoryChanges).toBeDefined();
			expect(result.duration).toBeGreaterThan(0);
		});

		it('should handle errors gracefully', async () => {
			const task: Task = {
				id: 'task-11',
				title: 'Invalid task',
				description: 'This should fail gracefully',
				agentId: 'planner',
				status: 'pending',
				priority: 'low',
				inputs: {
					invalidInput: 'This should cause an error',
				},
				createdAt: new Date(),
				progress: 0,
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.error).toContain('Requirements are required');
		});

		it('should handle missing requirements input', async () => {
			const task: Task = {
				id: 'task-12',
				title: 'Task without requirements',
				description: 'Task with no requirements input',
				agentId: 'planner',
				status: 'pending',
				priority: 'medium',
				inputs: {},
				createdAt: new Date(),
				progress: 0,
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.error).toContain('Requirements are required');
		});

		it('should include memory graph changes in successful execution', async () => {
			const task: Task = {
				id: 'task-13',
				title: 'Test memory graph integration',
				description: 'project_planning to verify memory graph integration',
				agentId: 'planner',
				status: 'pending',
				priority: 'medium',
				inputs: {
					requirements: 'Build a simple blog application with user authentication and post management',
				},
				createdAt: new Date(),
				progress: 0,
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			expect(result.outputs!.memoryChanges).toBeDefined();
			expect(Array.isArray(result.outputs!.memoryChanges)).toBe(true);
			expect(mockMemoryGraph.addNode).toHaveBeenCalled();
		});
	});

	describe('requirement analysis', () => {
		it('should analyze requirements and extract key features', async () => {
			const task: Task = {
				id: 'task-14',
				title: 'Social platform analysis',
				description: 'requirement_analysis for social platform',
				agentId: 'planner',
				status: 'pending',
				priority: 'high',
				inputs: {
					requirements: 'Create a social media platform with user profiles, posts, comments, likes, and real-time messaging',
				},
				createdAt: new Date(),
				progress: 0,
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			expect(result.outputs!.analysis).toBeDefined();
			expect((result.outputs!.analysis as any).features).toBeDefined();
			expect((result.outputs!.analysis as any).features.length).toBeGreaterThan(0);
			expect((result.outputs!.analysis as any).architecture).toBeDefined();
		});

		it('should handle complex constraint analysis', async () => {
			const task: Task = {
				id: 'task-15',
				title: 'Enterprise platform analysis',
				description: 'requirement_analysis with strict constraints',
				agentId: 'planner',
				status: 'pending',
				priority: 'high',
				inputs: {
					requirements: 'Enterprise resource planning system with inventory management, HR, and financial modules',
					constraints: { security: 'enterprise-grade', scalability: '10000+ users', compliance: 'SOX, GDPR' },
				},
				createdAt: new Date(),
				progress: 0,
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			expect(result.outputs!.analysis).toBeDefined();
			expect((result.outputs!.analysis as any).constraints).toBeDefined();
			expect((result.outputs!.analysis as any).requirements).toBeDefined();
		});
	});

	describe('task generation', () => {
		it('should generate actionable tasks from analysis', async () => {
			const task: Task = {
				id: 'task-16',
				title: 'Generate implementation tasks',
				description: 'project_planning to create implementable tasks from project analysis',
				agentId: 'planner',
				status: 'pending',
				priority: 'high',
				inputs: {
					requirements: 'Build a task management application with teams, projects, tasks, and deadline tracking',
				},
				createdAt: new Date(),
				progress: 0,
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			expect(result.outputs!.tasks).toBeDefined();
			expect(Array.isArray(result.outputs!.tasks)).toBe(true);

			// Check task properties
			const tasks = result.outputs!.tasks as any[];
			expect(tasks.length).toBeGreaterThan(0);
			expect(tasks[0]).toHaveProperty('id');
			expect(tasks[0]).toHaveProperty('title');
			expect(tasks[0]).toHaveProperty('description');
			expect(tasks[0]).toHaveProperty('priority');
		});

		it('should prioritize tasks correctly', async () => {
			const task: Task = {
				id: 'task-17',
				title: 'Test task prioritization',
				description: 'project_planning to verify task prioritization logic',
				agentId: 'planner',
				status: 'pending',
				priority: 'critical',
				inputs: {
					requirements: 'Build an e-commerce platform with payment processing, inventory management, and customer support',
				},
				createdAt: new Date(),
				progress: 0,
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			const generatedTasks = result.outputs!.tasks as any[];

			// Check that critical tasks are prioritized
			const highPriorityTasks = generatedTasks.filter(t => t.priority === 'high');
			const setupTasks = generatedTasks.filter(t => t.title.toLowerCase().includes('setup'));

			expect(highPriorityTasks.length).toBeGreaterThan(0);
			expect(setupTasks.length).toBeGreaterThan(0);
		});
	});

	describe('memory graph integration', () => {
		it('should store project structure in memory graph', async () => {
			const task: Task = {
				id: 'task-18',
				title: 'Test memory storage',
				description: 'project_planning to verify memory graph storage during planning',
				agentId: 'planner',
				status: 'pending',
				priority: 'medium',
				inputs: {
					requirements: 'Create a learning management system with courses, lessons, quizzes, and student progress tracking',
				},
				createdAt: new Date(),
				progress: 0,
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			expect(result.outputs!.memoryChanges).toBeDefined();
			expect(Array.isArray(result.outputs!.memoryChanges)).toBe(true);

			// Verify memory graph was called
			expect(mockMemoryGraph.addNode).toHaveBeenCalled();

			// Check that feature nodes were created
			const calls = (mockMemoryGraph.addNode as any).mock.calls;
			expect(calls.length).toBeGreaterThan(0);
			expect(calls[0][0]).toHaveProperty('type', 'feature');
		});

		it('should create proper node relationships', async () => {
			const task: Task = {
				id: 'task-19',
				title: 'Test node relationships',
				description: 'project_planning to verify proper memory graph relationships',
				agentId: 'planner',
				status: 'pending',
				priority: 'medium',
				inputs: {
					requirements: 'Build a marketplace with sellers, buyers, products, orders, and payment processing',
				},
				createdAt: new Date(),
				progress: 0,
			};

			const result = await plannerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			expect(result.outputs!.memoryChanges).toBeDefined();
			expect(Array.isArray(result.outputs!.memoryChanges)).toBe(true);
			expect((result.outputs!.memoryChanges as string[]).length).toBeGreaterThan(0);

			// Verify multiple node types were created
			const calls = (mockMemoryGraph.addNode as any).mock.calls;
			const nodeTypes = calls.map((call: any) => call[0].type);
			expect(nodeTypes).toContain('feature');
		});
	});
});
