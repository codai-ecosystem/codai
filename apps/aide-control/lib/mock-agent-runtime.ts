/**
 * Mock implementation of @aide/agent-runtime for building
 * This provides the minimum interface needed for compilation
 */

export interface Task {
	id: string;
	userId: string;
	type: string;
	status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
	data: any;
	createdAt: Date;
	startedAt?: Date;
	completedAt?: Date;
	error?: string;
	title?: string;
	description?: string;
	agentId?: string;
}

export interface TaskResult {
	success: boolean;
	data?: any;
	error?: string;
	metadata?: Record<string, any>;
	outputs?: any;
}

export interface AgentMessage {
	id: string;
	content: string;
	role: 'user' | 'assistant' | 'system';
	timestamp: Date;
	metadata?: Record<string, any>;
}

export interface ConversationContext {
	id: string;
	userId: string;
	messages: AgentMessage[];
	metadata?: Record<string, any>;
	sessionId?: string;
	memoryGraphId?: string;
}

export class AgentRuntime {
	public tasks$ = {
		subscribe: (callback: (event: any) => void) => {
			// Mock observable
			return { unsubscribe: () => {} };
		},
	};

	public messages$ = {
		subscribe: (callback: (message: AgentMessage) => void) => {
			// Mock observable
			return { unsubscribe: () => {} };
		},
	};

	constructor(memoryGraph: any, apiKeys: any) {
		// Mock constructor
	}

	async executeTask(task: Task): Promise<TaskResult> {
		// Mock implementation
		return {
			success: true,
			data: { result: 'Mock task execution completed' },
		};
	}

	async sendMessage(message: AgentMessage): Promise<AgentMessage> {
		// Mock implementation
		return {
			id: `msg_${Date.now()}`,
			content: `Mock response to: ${message.content}`,
			role: 'assistant',
			timestamp: new Date(),
		};
	}

	async getContext(): Promise<ConversationContext> {
		// Mock implementation
		return {
			id: 'mock_context',
			userId: 'mock_user',
			messages: [],
		};
	}

	async updateContext(context: Partial<ConversationContext>): Promise<void> {
		// Mock implementation
	}

	async startConversation(
		conversationId: string,
		userMessage: AgentMessage,
		options?: any
	): Promise<void> {
		// Mock implementation
	}
	getAgentStatuses(): Map<string, any> {
		// Mock implementation returning a Map instead of array
		return new Map();
	}

	async cleanup(): Promise<void> {
		// Mock implementation
	}
}
