/**
 * Agent Runtime Types for Advanced Demo
 * This file contains simplified types for demonstration purposes
 */

import { MemoryGraphEngine, AnyNode } from '@aide/memory-graph';

// Task Status
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

// Task Priority
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

// Task Type
export type TaskType = 'planner' | 'builder' | 'designer' | 'tester' | 'deployer';

// Task Definition
export interface Task {
	id: string;
	type: TaskType;
	description: string;
	priority: TaskPriority;
	metadata: Record<string, unknown>;
	createdAt: Date;
	status?: TaskStatus;
	result?: TaskResult;
	error?: string;
}

// Task Result
export interface TaskResult {
	id: string;
	taskId: string;
	success: boolean;
	summary: string;
	output: Record<string, unknown>;
	nodes?: AnyNode[];
	completedAt: Date;
}

// Agent Status
export interface AgentStatus {
	isActive: boolean;
	currentTask?: Task;
	metrics?: AgentMetrics;
}

// Agent Metrics
export interface AgentMetrics {
	tasksCompleted: number;
	successRate: number;
	averageTaskTime: number;
}

// Agent Message
export interface AgentMessage {
	id: string;
	agentId: string;
	content: string;
	timestamp: Date;
	metadata?: Record<string, unknown>;
}

// Conversation Context
export interface ConversationContext {
	id: string;
	messages: AgentMessage[];
	metadata: Record<string, unknown>;
}

// Agent Configuration
export interface AgentConfig {
	id: string;
	name: string;
	description: string;
	capabilities?: string[];
}

/**
 * Mock AgentRuntime class for the advanced demo
 * Simulates the functionality of the real AgentRuntime
 * but with simplified implementation
 */
export class AgentRuntimeDemo {
	private taskSubject = new Subject<{ type: 'started' | 'completed' | 'failed'; task: Task; result?: TaskResult; error?: string }>();
	private messageSubject = new Subject<AgentMessage>();
	private statusSubject = new BehaviorSubject<{ agentId: string; status: AgentStatus }>({
		agentId: '',
		status: { isActive: false }
	});

	public tasks$ = this.taskSubject.asObservable();
	public messages$ = this.messageSubject.asObservable();
	public status$ = this.statusSubject.asObservable();

	private taskQueue: Task[] = [];
	private agents: AgentConfig[] = [
		{
			id: 'planner',
			name: 'Project Planner',
			description: 'Plans and breaks down project requirements into actionable tasks'
		},
		{
			id: 'builder',
			name: 'Code Builder',
			description: 'Implements code based on specifications'
		},
		{
			id: 'designer',
			name: 'UI/UX Designer',
			description: 'Creates user interface and experience designs'
		},
		{
			id: 'tester',
			name: 'Quality Tester',
			description: 'Tests implementations and provides quality feedback'
		},
		{
			id: 'deployer',
			name: 'Deployment Engineer',
			description: 'Handles deployment and infrastructure configuration'
		}
	];

	constructor(private memoryGraph: MemoryGraphEngine) {
		// Initialize the agents
		for (const agent of this.agents) {
			this.statusSubject.next({
				agentId: agent.id,
				status: { isActive: false, metrics: { tasksCompleted: 0, successRate: 0, averageTaskTime: 0 } }
			});
		}
	}

	/**
	 * Submit a task to the agent runtime
	 * @param task The task to submit
	 */
	async submitTask(task: Task): Promise<void> {
		// Add the task to the queue
		this.taskQueue.push(task);

		// Notify that the task has started
		this.taskSubject.next({
			type: 'started',
			task: { ...task, status: 'in_progress' }
		});

		// Set the agent to active
		this.statusSubject.next({
			agentId: task.type,
			status: {
				isActive: true,
				currentTask: task,
				metrics: { tasksCompleted: 0, successRate: 0, averageTaskTime: 0 }
			}
		});

		// Simulate task processing time
		await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

		// Create a mock result
		const result: TaskResult = {
			id: `result-${task.id}`,
			taskId: task.id,
			success: Math.random() > 0.2, // 80% success rate for demo
			summary: `Completed ${task.type} task: ${task.description.slice(0, 50)}...`,
			output: {},
			completedAt: new Date()
		};

		if (result.success) {
			// Task completed successfully
			this.taskSubject.next({
				type: 'completed',
				task: { ...task, status: 'completed' },
				result
			});      // Update memory graph with a new node
			if (task.type === 'planner') {
				const node = this.memoryGraph.addNode({
					type: 'feature',
					name: `Feature: ${task.description.slice(0, 30)}`,
					description: task.description,
					metadata: {
						agent: task.type,
						taskId: task.id,
						priority: task.priority,
						status: 'planned'
					}
				});
				result.nodes = [node];
			}
		} else {
			// Task failed
			const error = `Failed to complete task: Simulated error in ${task.type}`;
			this.taskSubject.next({
				type: 'failed',
				task: { ...task, status: 'failed', error },
				error
			});
		}

		// Set the agent back to inactive
		this.statusSubject.next({
			agentId: task.type,
			status: {
				isActive: false,
				metrics: {
					tasksCompleted: 1,
					successRate: result.success ? 100 : 0,
					averageTaskTime: 3000
				}
			}
		});
	}

	/**
	 * Get all available agents
	 */
	getAgents(): AgentConfig[] {
		return this.agents;
	}

	/**
	 * Get the agent by type
	 */
	getAgent(type: TaskType): AgentConfig | undefined {
		return this.agents.find(a => a.id === type);
	}
}

// Import this at the top once you've saved the file
import { BehaviorSubject, Subject } from 'rxjs';
