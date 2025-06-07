/**
 * Agent Runtime Service
 * Manages the AIDE agent runtime and provides integration with the backend
 */
import { AgentRuntime, Task, TaskResult, AgentMessage, ConversationContext } from '../mock-agent-runtime';
import { MemoryGraphEngine } from '../mock-memory-graph';
import { getAdminApp } from '../firebase-admin';

// Mock FirestoreService
class MockFirestoreService {
	static async logAudit(data: any): Promise<void> {
		console.log('Mock audit log:', data);
	}
}

export interface AgentTaskInfo extends Task {
	userId: string;
	projectId?: string;
	conversationId?: string;
	title?: string;
	agentId?: string;
	outputs?: any;
	description?: string;
	priority?: string;
	inputs?: any;
}

export interface ActiveConversation {
	id: string;
	userId: string;
	agentIds: string[];
	context: ConversationContext;
	runtime: AgentRuntime;
	createdAt: Date;
	lastActivity: Date;
}

/**
 * Service for managing agent runtime instances and tasks
 */
export class AgentRuntimeService {
	private static instance: AgentRuntimeService;
	private runtimes = new Map<string, AgentRuntime>();
	private activeTasks = new Map<string, AgentTaskInfo>();
	private conversations = new Map<string, ActiveConversation>();
	private memoryGraphs = new Map<string, MemoryGraphEngine>();
	private constructor(
		private firestoreService: MockFirestoreService
	) { }

	static getInstance(firestoreService?: MockFirestoreService): AgentRuntimeService {
		if (!AgentRuntimeService.instance) {
			AgentRuntimeService.instance = new AgentRuntimeService(
				firestoreService || new MockFirestoreService()
			);
		}
		return AgentRuntimeService.instance;
	}

	/**
	 * Get or create agent runtime for a user
	 */
	async getOrCreateRuntime(userId: string): Promise<AgentRuntime> {
		if (this.runtimes.has(userId)) {
			return this.runtimes.get(userId)!;
		}

		// Get user's memory graph
		let memoryGraph = this.memoryGraphs.get(userId);
		if (!memoryGraph) {
			// TODO: Initialize memory graph from Firestore or create new one
			memoryGraph = new MemoryGraphEngine();
			this.memoryGraphs.set(userId, memoryGraph);
		}

		// Get API keys from environment
		const apiKeys = {
			openai: process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY,
			anthropic: process.env.ANTHROPIC_API_KEY,
			local: process.env.LOCAL_LLM_ENDPOINT,
		};
		// Create agent runtime
		const runtime = new AgentRuntime(memoryGraph, apiKeys);
		// Note: AgentRuntime initializes automatically in constructor

		this.runtimes.set(userId, runtime);

		// Subscribe to runtime events
		runtime.tasks$.subscribe(event => {
			this.handleTaskEvent(userId, event);
		});

		runtime.messages$.subscribe(message => {
			this.handleMessageEvent(userId, message);
		});

		return runtime;
	}

	/**
	 * Create and execute a new task
	 */
	async createTask(
		userId: string,
		taskData: {
			title: string;
			description: string;
			type?: string;
			agentId?: string;
			projectId?: string;
			inputs?: Record<string, unknown>;
			priority?: 'low' | 'medium' | 'high' | 'critical';
		}
	): Promise<AgentTaskInfo> {
		const runtime = await this.getOrCreateRuntime(userId);

		// Create task object
		const task: AgentTaskInfo = {
			id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			title: taskData.title,
			description: taskData.description,
			agentId: taskData.agentId || 'planner',
			status: 'pending',
			priority: taskData.priority || 'medium',
			inputs: taskData.inputs || {},
			dependencies: [],
			createdAt: new Date(),
			progress: 0,
			userId,
			projectId: taskData.projectId,
		};

		// Store task
		this.activeTasks.set(task.id, task);
		// Save to Firestore
		try {
			const db = getFirestore();
			await db.collection('agent_tasks').doc(task.id).set({
				...task,
				createdAt: task.createdAt.toISOString(),
				startedAt: task.startedAt?.toISOString(),
				completedAt: task.completedAt?.toISOString(),
			});
		} catch (error) {
			console.error('Failed to save task to Firestore:', error);
		}

		// Execute task asynchronously
		runtime.executeTask(task).catch(error => {
			console.error(`Task ${task.id} failed:`, error);
			this.updateTaskStatus(task.id, 'failed', { error: error.message });
		});

		return task;
	}

	/**
	 * Get task status and details
	 */
	async getTask(taskId: string, userId: string): Promise<AgentTaskInfo | null> {
		const task = this.activeTasks.get(taskId); if (!task || task.userId !== userId) {
			// Try to load from Firestore
			try {
				const db = getFirestore();
				const taskDoc = await db.collection('agent_tasks').doc(taskId).get();
				if (taskDoc.exists && taskDoc.data()?.userId === userId) {
					const taskData = taskDoc.data()!;
					// Convert back to AgentTaskInfo
					const restoredTask: AgentTaskInfo = {
						...taskData,
						createdAt: new Date(taskData.createdAt),
						startedAt: taskData.startedAt ? new Date(taskData.startedAt) : undefined,
						completedAt: taskData.completedAt ? new Date(taskData.completedAt) : undefined,
					} as AgentTaskInfo;

					// Add back to active tasks if not completed
					if (restoredTask.status === 'in_progress' || restoredTask.status === 'pending') {
						this.activeTasks.set(taskId, restoredTask);
					}

					return restoredTask;
				}
			} catch (error) {
				console.error('Failed to load task from Firestore:', error);
			}
			return null;
		}
		return task;
	}

	/**
	 * Start a conversation with agents
	 */
	async startConversation(
		conversationId: string,
		userId: string,
		userMessage: string,
		agentIds: string[] = ['planner']
	): Promise<ActiveConversation> {
		const runtime = await this.getOrCreateRuntime(userId);

		const conversation: ActiveConversation = {
			id: conversationId,
			userId,
			agentIds,
			context: {
				id: conversationId,
				userId,
				sessionId: `session_${Date.now()}`,
				messages: [],
				memoryGraphId: userId,
				activeTasks: [],
				metadata: {},
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			runtime,
			createdAt: new Date(),
			lastActivity: new Date(),
		};

		this.conversations.set(conversationId, conversation);

		// Start conversation with runtime
		await runtime.startConversation(conversationId, userMessage, {
			onMessageStream: (agentId: string, chunk: string, complete: boolean) => {
				// TODO: Emit to WebSocket or store for polling
				console.log(`Agent ${agentId}: ${chunk} (complete: ${complete})`);
			},
			onAgentStart: (agentId: string) => {
				console.log(`Agent ${agentId} started`);
			},
			onAgentComplete: (agentId: string) => {
				console.log(`Agent ${agentId} completed`);
			}
		});

		return conversation;
	}

	/**
	 * Get conversation details
	 */
	getConversation(conversationId: string, userId: string): ActiveConversation | null {
		const conversation = this.conversations.get(conversationId);
		if (!conversation || conversation.userId !== userId) {
			return null;
		}
		return conversation;
	}

	/**
	 * Get available agents for a user
	 */
	async getAvailableAgents(userId: string): Promise<Array<{
		id: string;
		name: string;
		description: string;
		status: string;
		capabilities: string[];
	}>> {
		const runtime = await this.getOrCreateRuntime(userId);
		const statuses = runtime.getAgentStatuses();

		const agents = [
			{
				id: 'planner',
				name: 'Planner Agent',
				description: 'Analyzes requirements and creates project plans',
				capabilities: ['analysis', 'planning', 'architecture']
			},
			{
				id: 'builder',
				name: 'Builder Agent',
				description: 'Generates code and implements features',
				capabilities: ['coding', 'implementation', 'refactoring']
			},
			{
				id: 'designer',
				name: 'Designer Agent',
				description: 'Creates UI/UX designs and layouts',
				capabilities: ['design', 'ui', 'ux', 'styling']
			},
			{
				id: 'tester',
				name: 'Tester Agent',
				description: 'Writes and executes tests',
				capabilities: ['testing', 'qa', 'debugging']
			},
			{
				id: 'deployer',
				name: 'Deployer Agent',
				description: 'Handles deployment and infrastructure',
				capabilities: ['deployment', 'ci-cd', 'infrastructure']
			}
		];
		return agents.map(agent => ({
			...agent,
			status: statuses.get(agent.id)?.isHealthy ? 'available' : 'offline'
		}));
	}

	/**
	 * Handle task events from agent runtime
	 */
	private async handleTaskEvent(
		userId: string,
		event: { type: 'started' | 'completed' | 'failed'; task: Task; result?: TaskResult; error?: string }
	) {
		const { type, task, result, error } = event;

		// Update task status
		await this.updateTaskStatus(task.id,
			type === 'started' ? 'in_progress' :
				type === 'completed' ? 'completed' : 'failed',
			{
				outputs: result?.outputs,
				error,
				startedAt: type === 'started' ? new Date() : undefined,
				completedAt: type !== 'started' ? new Date() : undefined,
			}
		);		// Log audit event
		await FirestoreService.logAudit({
			userId,
			action: `agent_task_${type}`,
			resource: 'agent_task',
			resourceId: task.id,
			details: {
				taskId: task.id,
				agentId: task.agentId,
				title: task.title,
				error: error || null,
			},
			ipAddress: 'system',
		});
	}

	/**
	 * Handle message events from agent runtime
	 */
	private async handleMessageEvent(userId: string, message: AgentMessage) {
		// Store message in conversation context
		const conversationId = message.metadata?.conversationId as string;
		if (conversationId) {
			const conversation = this.conversations.get(conversationId);
			if (conversation) {
				conversation.context.messages.push(message);
				conversation.lastActivity = new Date();
			}
		}

		// TODO: Emit to WebSocket for real-time updates
	}

	/**
	 * Update task status and persist changes
	 */
	private async updateTaskStatus(
		taskId: string,
		status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled',
		updates: Partial<AgentTaskInfo> = {}
	) {
		const task = this.activeTasks.get(taskId);
		if (task) {
			const updatedTask = { ...task, status, ...updates };
			this.activeTasks.set(taskId, updatedTask);			// Save to Firestore
			try {
				const db = getFirestore();
				await db.collection('agent_tasks').doc(taskId).update({
					status,
					...updates,
					startedAt: updates.startedAt?.toISOString(),
					completedAt: updates.completedAt?.toISOString(),
					updatedAt: new Date().toISOString(),
				});
			} catch (error) {
				console.error('Failed to update task in Firestore:', error);
			}
		}
	}

	/**
	 * Clean up inactive runtimes and conversations
	 */
	async cleanup() {
		const now = new Date();
		const INACTIVE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

		// Clean up inactive conversations
		for (const [id, conversation] of this.conversations) {
			if (now.getTime() - conversation.lastActivity.getTime() > INACTIVE_TIMEOUT) {
				this.conversations.delete(id);
			}
		}

		// Clean up completed tasks older than 1 hour
		const TASK_CLEANUP_TIMEOUT = 60 * 60 * 1000; // 1 hour
		for (const [id, task] of this.activeTasks) {
			if (task.status === 'completed' || task.status === 'failed') {
				const completedTime = task.completedAt?.getTime() || task.createdAt.getTime();
				if (now.getTime() - completedTime > TASK_CLEANUP_TIMEOUT) {
					this.activeTasks.delete(id);
				}
			}
		}
	}
}
