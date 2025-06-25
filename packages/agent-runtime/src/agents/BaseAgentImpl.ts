import { Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { MemoryGraphEngine } from '@codai/memory-graph';
import {
	BaseAgent,
	AgentConfig,
	Task,
	TaskResult,
	AgentMessage,
	AgentStatus,
	AgentMetrics,
} from '../types.js';

/**
 * Base implementation for all AIDE agents
 * Provides common functionality and patterns
 */
export abstract class BaseAgentImpl implements BaseAgent {
	protected messageSubject = new Subject<AgentMessage>();
	protected isInitialized = false;
	protected isShuttingDown = false;
	protected currentTasks = new Map<string, Task>();
	protected metrics: AgentMetrics = {
		tasksPerMinute: 0,
		averageTaskDuration: 0,
		successRate: 1,
		memoryUsage: 0,
		cpuUsage: 0,
	};
	protected status: AgentStatus = {
		isHealthy: true,
		isEnabled: true,
		currentTasks: 0,
		totalTasksCompleted: 0,
		totalTasksFailed: 0,
		lastActivity: new Date(),
	};
	constructor(
		public readonly config: AgentConfig,
		public readonly memoryGraph: MemoryGraphEngine
	) {}

	async initialize(): Promise<void> {
		if (this.isInitialized) {
			return;
		}

		try {
			// Perform agent-specific initialization
			await this.onInitialize();

			this.isInitialized = true;
			this.status.isHealthy = true;
			this.status.lastActivity = new Date();

			await this.sendMessage({
				type: 'notification',
				content: `${this.config.name} initialized successfully`,
			});
		} catch (error) {
			this.status.isHealthy = false;
			this.status.error = error instanceof Error ? error.message : String(error);
			throw error;
		}
	}

	async shutdown(): Promise<void> {
		if (!this.isInitialized || this.isShuttingDown) {
			return;
		}

		this.isShuttingDown = true;

		try {
			// Cancel all active tasks
			for (const task of this.currentTasks.values()) {
				await this.onTaskCancelled(task);
			}
			this.currentTasks.clear();

			// Perform agent-specific cleanup
			await this.onShutdown();

			this.isInitialized = false;
			this.status.isEnabled = false;

			await this.sendMessage({
				type: 'notification',
				content: `${this.config.name} shutdown completed`,
			});

			// Close message subject
			this.messageSubject.complete();
		} catch (error) {
			this.status.error = error instanceof Error ? error.message : String(error);
			throw error;
		}
	}

	abstract canExecuteTask(task: Task): boolean;
	abstract executeTask(task: Task): Promise<TaskResult>;

	async sendMessage(message: Omit<AgentMessage, 'id' | 'timestamp' | 'agentId'>): Promise<void> {
		const fullMessage: AgentMessage = {
			id: this.generateId(),
			agentId: this.config.id,
			timestamp: new Date(),
			...message,
		};

		this.messageSubject.next(fullMessage);
		this.status.lastActivity = new Date();
	}

	onMessage(callback: (message: AgentMessage) => void): void {
		this.messageSubject.subscribe(callback);
	}

	async updateMemoryGraph(updater: (graph: MemoryGraphEngine) => void): Promise<void> {
		try {
			updater(this.memoryGraph);
			this.status.lastActivity = new Date();
		} catch (error) {
			await this.sendMessage({
				type: 'error',
				content: `Memory graph update failed: ${error instanceof Error ? error.message : String(error)}`,
			});
			throw error;
		}
	}

	getStatus(): AgentStatus {
		return { ...this.status };
	}

	getMetrics(): AgentMetrics {
		return { ...this.metrics };
	}

	// Protected helper methods
	protected generateId(): string {
		return uuidv4();
	}

	protected updateTaskMetrics(task: Task, result: TaskResult): void {
		this.status.currentTasks = this.currentTasks.size;

		if (result.success) {
			this.status.totalTasksCompleted++;
		} else {
			this.status.totalTasksFailed++;
		}

		// Update success rate
		const totalTasks = this.status.totalTasksCompleted + this.status.totalTasksFailed;
		this.metrics.successRate = totalTasks > 0 ? this.status.totalTasksCompleted / totalTasks : 1;

		// Update average task duration
		const currentAvg = this.metrics.averageTaskDuration;
		const completedTasks = this.status.totalTasksCompleted;
		this.metrics.averageTaskDuration =
			completedTasks > 0
				? (currentAvg * (completedTasks - 1) + result.duration) / completedTasks
				: result.duration;

		this.status.lastActivity = new Date();
	}

	protected async executeWithErrorHandling<T>(
		operation: () => Promise<T>,
		errorContext: string
	): Promise<T> {
		try {
			return await operation();
		} catch (error) {
			const errorMessage = `${errorContext}: ${error instanceof Error ? error.message : String(error)}`;
			await this.sendMessage({
				type: 'error',
				content: errorMessage,
			});
			throw new Error(errorMessage);
		}
	}

	// Lifecycle hooks for subclasses
	protected async onInitialize(): Promise<void> {
		// Override in subclasses for custom initialization
	}

	protected async onShutdown(): Promise<void> {
		// Override in subclasses for custom cleanup
	}

	protected async onTaskStarted(task: Task): Promise<void> {
		this.currentTasks.set(task.id, task);
		await this.sendMessage({
			type: 'notification',
			content: `Started task: ${task.title}`,
			metadata: { taskId: task.id },
		});
	}

	protected async onTaskCompleted(task: Task, result: TaskResult): Promise<void> {
		this.currentTasks.delete(task.id);
		this.updateTaskMetrics(task, result);

		await this.sendMessage({
			type: 'response',
			content: `Completed task: ${task.title}`,
			metadata: { taskId: task.id, result },
		});
	}

	protected async onTaskFailed(task: Task, error: Error): Promise<void> {
		this.currentTasks.delete(task.id);
		this.updateTaskMetrics(task, { success: false, error: error.message, duration: 0 });

		await this.sendMessage({
			type: 'error',
			content: `Task failed: ${task.title} - ${error.message}`,
			metadata: { taskId: task.id, error: error.message },
		});
	}

	protected async onTaskCancelled(task: Task): Promise<void> {
		this.currentTasks.delete(task.id);

		await this.sendMessage({
			type: 'notification',
			content: `Task cancelled: ${task.title}`,
			metadata: { taskId: task.id },
		});
	}

	// AI provider integration helpers
	protected async callAI(prompt: string, context?: Record<string, unknown>): Promise<string> {
		// This would integrate with the actual AI provider
		// For now, return a placeholder response
		await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate AI call

		return `AI response for: ${prompt.substring(0, 50)}...`;
	}

	protected buildPrompt(template: string, variables: Record<string, unknown>): string {
		let prompt = template;

		for (const [key, value] of Object.entries(variables)) {
			const placeholder = `{{${key}}}`;
			prompt = prompt.replace(new RegExp(placeholder, 'g'), String(value));
		}

		return prompt;
	}

	// Common validation helpers
	protected validateTaskInputs(task: Task, requiredInputs: string[]): void {
		const missingInputs = requiredInputs.filter(input => !(input in task.inputs));

		if (missingInputs.length > 0) {
			throw new Error(`Missing required inputs: ${missingInputs.join(', ')}`);
		}
	}

	protected validateMemoryGraphState(): void {
		if (!this.memoryGraph) {
			throw new Error('Memory graph is not available');
		}
	}
}
