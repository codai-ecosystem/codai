import { z } from 'zod';
import { Observable } from 'rxjs';
import { MemoryGraphEngine, AnyNode } from '@dragoscatalin/memory-graph';

/**
 * Core agent interfaces and types for AIDE
 */

// Agent message schema
export const AgentMessageSchema = z.object({
	id: z.string(),
	agentId: z.string(),
	type: z.enum(['request', 'response', 'notification', 'error']),
	content: z.string(),
	metadata: z.record(z.unknown()).optional(),
	timestamp: z.date(),
	parentMessageId: z.string().optional(),
});

// Agent capability schema
export const AgentCapabilitySchema = z.object({
	name: z.string(),
	description: z.string(),
	inputs: z.array(
		z.object({
			name: z.string(),
			type: z.string(),
			required: z.boolean().default(false),
			description: z.string().optional(),
		})
	),
	outputs: z.array(
		z.object({
			name: z.string(),
			type: z.string(),
			description: z.string().optional(),
		})
	),
});

// Agent configuration schema
export const AgentConfigSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
	type: z.enum(['planner', 'builder', 'designer', 'tester', 'deployer', 'history', 'extension']),
	capabilities: z.array(AgentCapabilitySchema),
	aiProvider: z.object({
		provider: z.enum(['openai', 'anthropic', 'ollama', 'local', 'azure', 'custom']),
		model: z.string(),
		apiKey: z.string().optional(),
		baseUrl: z.string().optional(),
		temperature: z.number().min(0).max(2).default(0.7),
		maxTokens: z.number().positive().optional(),
	}),
	priority: z.number().min(0).max(10).default(5),
	isEnabled: z.boolean().default(true),
});

// Task schema
export const TaskSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string(),
	agentId: z.string(),
	status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']),
	priority: z.enum(['low', 'medium', 'high', 'critical']),
	inputs: z.record(z.unknown()),
	outputs: z.record(z.unknown()).optional(),
	dependencies: z.array(z.string()).optional(),
	createdAt: z.date(),
	startedAt: z.date().optional(),
	completedAt: z.date().optional(),
	error: z.string().optional(),
	progress: z.number().min(0).max(100).default(0),
});

// Type exports
export type AgentMessage = z.infer<typeof AgentMessageSchema>;
export type AgentCapability = z.infer<typeof AgentCapabilitySchema>;
export type AgentConfig = z.infer<typeof AgentConfigSchema>;
export type Task = z.infer<typeof TaskSchema>;

// Base agent interface
export interface BaseAgent {
	readonly config: AgentConfig;
	readonly memoryGraph: MemoryGraphEngine;

	// Core agent methods
	initialize(): Promise<void>;
	shutdown(): Promise<void>;

	// Task execution
	executeTask(task: Task): Promise<TaskResult>;
	canExecuteTask(task: Task): boolean;

	// Communication
	sendMessage(message: Omit<AgentMessage, 'id' | 'timestamp' | 'agentId'>): Promise<void>;
	onMessage(callback: (message: AgentMessage) => void): void;

	// State management
	updateMemoryGraph(updater: (graph: MemoryGraphEngine) => void): Promise<void>;

	// Health and monitoring
	getStatus(): AgentStatus;
	getMetrics(): AgentMetrics;
}

// Task execution result
export interface TaskResult {
	success: boolean;
	outputs?: Record<string, unknown>;
	error?: string;
	duration: number;
	memoryChanges?: string[]; // IDs of modified nodes
}

// Agent status
export interface AgentStatus {
	isHealthy: boolean;
	isEnabled: boolean;
	currentTasks: number;
	totalTasksCompleted: number;
	totalTasksFailed: number;
	lastActivity: Date;
	error?: string;
}

// Agent metrics
export interface AgentMetrics {
	tasksPerMinute: number;
	averageTaskDuration: number;
	successRate: number;
	memoryUsage: number;
	cpuUsage: number;
}

// Agent communication events
export interface AgentEvents {
	message: AgentMessage;
	taskStarted: Task;
	taskCompleted: { task: Task; result: TaskResult };
	taskFailed: { task: Task; error: string };
	statusChanged: AgentStatus;
	error: Error;
}

// Conversation context
export interface ConversationContext {
	id: string;
	userId: string;
	sessionId: string;
	messages: AgentMessage[];
	currentGoal?: string;
	memoryGraphId: string;
	activeTasks: Task[];
	metadata: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}

// Agent Request/Response types for coordination
export interface AgentRequest {
	id: string;
	type: string;
	payload: any;
	timestamp: number;
	priority: 'low' | 'medium' | 'high';
}

export interface AgentResponse {
	id: string;
	success: boolean;
	result: any;
	error?: {
		type: string;
		message: string;
		details?: any;
	};
	timestamp: number;
	duration: number;
	metadata: Record<string, any>;
}

// Specific request types for each agent
export interface PlanningRequest {
	description: string;
	requirements: string[];
	constraints?: string[];
	context?: Record<string, any>;
}

export interface BuildRequest {
	plan: any;
	designSpecs?: any;
	codegenInstructions?: string[];
	targetFramework?: string;
}

export interface DesignRequest {
	requirements: string[];
	constraints: string[];
	preferences: Record<string, any>;
}

export interface TestRequest {
	artifacts: any[];
	testStrategy: 'unit' | 'integration' | 'e2e' | 'comprehensive';
	coverage: {
		minimum: number;
		target: number;
	};
}

export interface DeployRequest {
	artifacts: any[];
	platform: string;
	environment: 'development' | 'staging' | 'production';
	configuration?: Record<string, any>;
}

export interface HistoryQuery {
	action: 'record' | 'query' | 'analyze';
	data?: any;
	filters?: Record<string, any>;
}
