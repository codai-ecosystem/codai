/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { MemoryGraphEngine, AnyNode } from '@codai/memory-graph';
import {
	BaseAgent,
	AgentConfig,
	Task,
	TaskResult,
	AgentMessage,
	AgentStatus,
	AgentMetrics,
	ConversationContext
} from './types.js';
import {
	LLMService,
	LLMModelConfig,
	createLLMService,
	defaultLLMConfigs
} from './llm/index.js';
import { PlannerAgent } from './agents/PlannerAgent.js';
import { BuilderAgent } from './agents/BuilderAgent.js';
import { DesignerAgent } from './agents/DesignerAgent.js';
import { TesterAgent } from './agents/TesterAgent.js';
import { DeployerAgent } from './agents/DeployerAgent.js';
import { HistoryAgent } from './agents/HistoryAgent.js';

/**
 * Agent Runtime Engine
 * Orchestrates multiple AI agents working together on software development tasks
 */
export class AgentRuntime {
	private agents = new Map<string, BaseAgent>();
	private llmServices = new Map<string, LLMService>();
	private taskQueue: Task[] = [];
	private activeTasks = new Map<string, Task>();
	private conversations = new Map<string, ConversationContext>();

	private taskSubject = new Subject<{ type: 'started' | 'completed' | 'failed'; task: Task; result?: TaskResult; error?: string }>();
	private messageSubject = new Subject<AgentMessage>();
	private statusSubject = new BehaviorSubject<{ agentId: string; status: AgentStatus }>({ agentId: '', status: {} as AgentStatus });

	public tasks$ = this.taskSubject.asObservable();
	public messages$ = this.messageSubject.asObservable();
	public status$ = this.statusSubject.asObservable();

	/**
	 * Creates a new Agent Runtime instance
	 * @param memoryGraph Memory graph engine for persistent storage
	 * @param apiKeys API keys for LLM providers
	 */
	constructor(
		private memoryGraph: MemoryGraphEngine,
		private apiKeys: Record<string, string> = {}
	) {
		this.initializeLLMServices();
		this.initializeAgents();
	}

	/**
	 * Initialize LLM services for different providers
	 */
	private initializeLLMServices(): void {
		// Initialize OpenAI service if API key provided
		if (this.apiKeys.openai) {
			try {
				const openaiConfig: LLMModelConfig = {
					...defaultLLMConfigs.openai,
					apiKey: this.apiKeys.openai
				};
				const openaiService = createLLMService(openaiConfig);
				this.llmServices.set('openai', openaiService);
				console.log('OpenAI service initialized');
			} catch (error) {
				console.error('Failed to initialize OpenAI service:', error);
			}
		}

		// Initialize Anthropic service if API key provided
		if (this.apiKeys.anthropic) {
			try {
				const anthropicConfig: LLMModelConfig = {
					...defaultLLMConfigs.anthropic,
					apiKey: this.apiKeys.anthropic
				};
				const anthropicService = createLLMService(anthropicConfig);
				this.llmServices.set('anthropic', anthropicService);
				console.log('Anthropic service initialized');
			} catch (error) {
				console.error('Failed to initialize Anthropic service:', error);
			}
		}

		// Add local LLM service if configured
		if (this.apiKeys.local) {
			try {
				const localConfig: LLMModelConfig = {
					...defaultLLMConfigs.local,
					apiKey: this.apiKeys.local
				};
				const localService = createLLMService(localConfig);
				this.llmServices.set('local', localService);
				console.log('Local LLM service initialized');
			} catch (error) {
				console.error('Failed to initialize local LLM service:', error);
			}
		}
	}
	/**
	 * Initialize all agent types
	 */
	private async initializeAgents() {
		// Only create agents if we have at least one LLM service available
		if (this.llmServices.size === 0) {
			console.warn('No LLM services initialized. Agents will not function properly.');
		}

		// Default LLM provider to use if available (prefer OpenAI > Anthropic > Local)
		const defaultProvider = this.llmServices.has('openai') ? 'openai' :
			this.llmServices.has('anthropic') ? 'anthropic' :
				this.llmServices.has('local') ? 'local' : '';

		const agentConfigs: AgentConfig[] = [
			{
				id: 'planner',
				name: 'Project Planner',
				description: 'Plans and breaks down project requirements into actionable tasks',
				type: 'planner',
				capabilities: [
					{
						name: 'project_planning',
						description: 'Analyze requirements and create project structure',
						inputs: [
							{ name: 'requirements', type: 'string', required: true, description: 'Project requirements' },
							{ name: 'constraints', type: 'object', required: false, description: 'Technical constraints' }
						],
						outputs: [
							{ name: 'project_plan', type: 'object', description: 'Structured project plan' },
							{ name: 'tasks', type: 'array', description: 'List of actionable tasks' }
						]
					}
				],
				aiProvider: {
					provider: defaultProvider || 'openai',
					model: defaultProvider === 'anthropic' ? 'claude-3-opus-20240229' : 'gpt-4o',
					temperature: 0.3,
				},
				priority: 10,
				isEnabled: true,
			},
			{
				id: 'builder',
				name: 'Code Builder',
				description: 'Generates and modifies code based on specifications',
				type: 'builder',
				capabilities: [
					{
						name: 'code_generation',
						description: 'Generate code from specifications',
						inputs: [
							{ name: 'specification', type: 'object', required: true, description: 'Code specification' },
							{ name: 'language', type: 'string', required: true, description: 'Programming language' }
						],
						outputs: [
							{ name: 'code', type: 'string', description: 'Generated code' },
							{ name: 'files', type: 'array', description: 'Created files' }
						]
					}
				],
				aiProvider: {
					provider: 'openai',
					model: 'gpt-4',
					temperature: 0.1,
				},
				priority: 8,
				isEnabled: true,
			},
			{
				id: 'designer',
				name: 'UI Designer',
				description: 'Creates user interfaces and design systems',
				type: 'designer',
				capabilities: [
					{
						name: 'ui_design',
						description: 'Design user interfaces and components',
						inputs: [
							{ name: 'requirements', type: 'object', required: true, description: 'Design requirements' },
							{ name: 'brand', type: 'object', required: false, description: 'Brand guidelines' }
						],
						outputs: [
							{ name: 'design', type: 'object', description: 'Design specification' },
							{ name: 'components', type: 'array', description: 'UI components' }
						]
					}
				],
				aiProvider: {
					provider: 'openai',
					model: 'gpt-4',
					temperature: 0.5,
				},
				priority: 7,
				isEnabled: true,
			},
			{
				id: 'tester',
				name: 'Quality Tester',
				description: 'Creates and runs tests to ensure code quality',
				type: 'tester',
				capabilities: [
					{
						name: 'test_generation',
						description: 'Generate comprehensive tests',
						inputs: [
							{ name: 'code', type: 'string', required: true, description: 'Code to test' },
							{ name: 'test_type', type: 'string', required: false, description: 'Type of tests' }
						],
						outputs: [
							{ name: 'tests', type: 'array', description: 'Generated tests' },
							{ name: 'coverage', type: 'number', description: 'Test coverage percentage' }
						]
					}
				],
				aiProvider: {
					provider: 'openai',
					model: 'gpt-4',
					temperature: 0.2,
				},
				priority: 6,
				isEnabled: true,
			},
			{
				id: 'deployer',
				name: 'Deployment Manager',
				description: 'Handles deployment and infrastructure setup',
				type: 'deployer',
				capabilities: [
					{
						name: 'deployment_setup',
						description: 'Set up deployment pipelines',
						inputs: [
							{ name: 'platform', type: 'string', required: true, description: 'Deployment platform' },
							{ name: 'config', type: 'object', required: false, description: 'Deployment configuration' }
						],
						outputs: [
							{ name: 'pipeline', type: 'object', description: 'Deployment pipeline' },
							{ name: 'url', type: 'string', description: 'Deployed application URL' }
						]
					}
				],
				aiProvider: {
					provider: 'openai',
					model: 'gpt-4',
					temperature: 0.1,
				},
				priority: 5,
				isEnabled: true,
			},
			{
				id: 'history',
				name: 'History Manager',
				description: 'Tracks changes and manages version control',
				type: 'history',
				capabilities: [
					{
						name: 'change_tracking',
						description: 'Track and manage project changes',
						inputs: [
							{ name: 'changes', type: 'array', required: true, description: 'Project changes' }
						],
						outputs: [
							{ name: 'timeline', type: 'array', description: 'Change timeline' },
							{ name: 'versions', type: 'array', description: 'Version history' }
						]
					}
				],
				aiProvider: {
					provider: 'openai',
					model: 'gpt-3.5-turbo',
					temperature: 0.1,
				},
				priority: 3,
				isEnabled: true,
			}
		];
		// Initialize agents
		for (const config of agentConfigs) {
			let agent: BaseAgent;
			switch (config.type) {
				case 'planner':
					agent = new PlannerAgent(config, this.memoryGraph);
					break;
				case 'builder':
					agent = new BuilderAgent(config, this.memoryGraph);
					break;
				case 'designer':
					agent = new DesignerAgent(config, this.memoryGraph);
					break;
				case 'tester':
					agent = new TesterAgent(config, this.memoryGraph);
					break;
				case 'deployer':
					agent = new DeployerAgent(config, this.memoryGraph);
					break;
				case 'history':
					agent = new HistoryAgent(config, this.memoryGraph);
					break;
				default:
					throw new Error(`Unknown agent type: ${config.type}`);
			}

			// Set up agent message handling
			agent.onMessage((message) => {
				this.messageSubject.next(message);
			});

			await agent.initialize();
			this.agents.set(config.id, agent);
		}
	}

	/**
	 * Execute a task by finding the best agent for it
	 */
	async executeTask(task: Task): Promise<TaskResult> {
		// Find capable agents
		const capableAgents = Array.from(this.agents.values())
			.filter(agent => agent.canExecuteTask(task))
			.sort((a, b) => b.config.priority - a.config.priority);

		if (capableAgents.length === 0) {
			const error = `No capable agent found for task: ${task.title}`;
			this.taskSubject.next({ type: 'failed', task, error });
			throw new Error(error);
		}

		const selectedAgent = capableAgents[0];
		this.activeTasks.set(task.id, { ...task, status: 'in_progress', startedAt: new Date() });

		this.taskSubject.next({ type: 'started', task });

		try {
			const result = await selectedAgent.executeTask(task);
			this.activeTasks.delete(task.id);

			const completedTask = {
				...task,
				status: 'completed' as const,
				completedAt: new Date(),
				outputs: result.outputs,
			};

			this.taskSubject.next({ type: 'completed', task: completedTask, result });
			return result;
		} catch (error) {
			this.activeTasks.delete(task.id);

			const failedTask = {
				...task,
				status: 'failed' as const,
				completedAt: new Date(),
				error: error instanceof Error ? error.message : String(error),
			};

			this.taskSubject.next({ type: 'failed', task: failedTask, error: failedTask.error });
			throw error;
		}
	}

	/**
	 * Send a message to a specific agent
	 */
	async sendMessage(agentId: string, content: string, metadata?: Record<string, unknown>): Promise<void> {
		const agent = this.agents.get(agentId);
		if (!agent) {
			throw new Error(`Agent not found: ${agentId}`);
		}

		await agent.sendMessage({
			type: 'request',
			content,
			metadata,
		});
	}

	/**
	 * Get status of all agents
	 */
	getAgentStatuses(): Map<string, AgentStatus> {
		const statuses = new Map<string, AgentStatus>();
		for (const [id, agent] of this.agents) {
			statuses.set(id, agent.getStatus());
		}
		return statuses;
	}

	/**
	 * Get metrics for all agents
	 */
	getAgentMetrics(): Map<string, AgentMetrics> {
		const metrics = new Map<string, AgentMetrics>();
		for (const [id, agent] of this.agents) {
			metrics.set(id, agent.getMetrics());
		}
		return metrics;
	}

	/**
	 * Shutdown all agents
	 */
	async shutdown(): Promise<void> {
		for (const agent of this.agents.values()) {
			await agent.shutdown();
		}
		this.agents.clear();
	}

	/**
	 * Get active tasks
	 */
	getActiveTasks(): Task[] {
		return Array.from(this.activeTasks.values());
	}

	/**
	 * Cancel a task
	 */
	async cancelTask(taskId: string): Promise<void> {
		const task = this.activeTasks.get(taskId);
		if (task) {
			this.activeTasks.delete(taskId);
			this.taskSubject.next({
				type: 'failed',
				task: { ...task, status: 'cancelled' },
				error: 'Task cancelled by user'
			});
		}
	}

	/**
	 * Get an LLM service by provider
	 * @param provider Provider name
	 * @returns LLM service or undefined if not available
	 */
	getLLMService(provider: string): LLMService | undefined {
		return this.llmServices.get(provider);
	}

	/**
	 * Get available LLM providers
	 * @returns Array of provider names
	 */
	getAvailableLLMProviders(): string[] {
		return Array.from(this.llmServices.keys());
	}

	/**
	 * Add a new LLM service
	 * @param config LLM model configuration
	 * @returns The created service or undefined if failed
	 */
	addLLMService(config: LLMModelConfig): LLMService | undefined {
		try {
			const service = createLLMService(config);
			this.llmServices.set(config.provider, service);
			return service;
		} catch (error) {
			console.error(`Failed to add LLM service for ${config.provider}:`, error);
			return undefined;
		}
	}

	/**
	 * Complete a prompt using an LLM service
	 * @param agentId Agent ID requesting completion
	 * @param prompt User prompt
	 * @param systemPrompt Optional system prompt
	 * @returns LLM response
	 */
	async completeLLM(
		agentId: string,
		prompt: string,
		systemPrompt?: string
	): Promise<string> {
		const agent = this.agents.get(agentId);
		if (!agent) {
			throw new Error(`Agent ${agentId} not found`);
		}

		const provider = agent.config.aiProvider.provider;
		const service = this.llmServices.get(provider);

		if (!service) {
			throw new Error(`LLM service for provider ${provider} not available`);
		}

		try {
			const response = await service.complete({
				systemPrompt,
				messages: [{ role: 'user', content: prompt }],
				temperature: agent.config.aiProvider.temperature,
				maxTokens: agent.config.aiProvider.maxTokens
			});

			return response.content;
		} catch (error) {
			console.error(`Error completing LLM request for agent ${agentId}:`, error);
			throw new Error(`Failed to get LLM completion: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Send a chat message to an LLM service
	 * @param agentId Agent ID requesting the chat
	 * @param messages Array of chat messages
	 * @param systemPrompt Optional system prompt
	 * @param tools Optional tools for function calling
	 * @returns LLM response
	 */
	async chatWithLLM(
		agentId: string,
		messages: Array<{ role: 'user' | 'assistant' | 'system' | 'function' | 'tool'; content: string }>,
		systemPrompt?: string,
		tools?: any[]
	): Promise<any> {
		const agent = this.agents.get(agentId);
		if (!agent) {
			throw new Error(`Agent ${agentId} not found`);
		}

		const provider = agent.config.aiProvider.provider;
		const service = this.llmServices.get(provider);

		if (!service) {
			throw new Error(`LLM service for provider ${provider} not available`);
		}

		try {
			const response = await service.complete({
				systemPrompt,
				messages,
				tools,
				temperature: agent.config.aiProvider.temperature,
				maxTokens: agent.config.aiProvider.maxTokens
			});

			return response;
		} catch (error) {
			console.error(`Error in chat with LLM for agent ${agentId}:`, error);
			throw new Error(`Failed to complete chat: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Stream a chat response from an LLM service
	 * @param agentId Agent ID requesting the stream
	 * @param messages Array of chat messages
	 * @param systemPrompt Optional system prompt
	 * @param onContent Callback for content chunks
	 * @param onToolCall Callback for tool calls
	 * @param onError Callback for errors
	 * @param onComplete Callback when complete
	 */
	async streamChatWithLLM(
		agentId: string,
		messages: Array<{ role: 'user' | 'assistant' | 'system' | 'function' | 'tool'; content: string }>,
		systemPrompt?: string,
		onContent?: (content: string) => void,
		onToolCall?: (toolCall: any) => void,
		onError?: (error: Error) => void,
		onComplete?: () => void
	): Promise<void> {
		const agent = this.agents.get(agentId); if (!agent) {
			if (onError) {
				onError(new Error(`Agent ${agentId} not found`));
			}
			return;
		}

		const provider = agent.config.aiProvider.provider;
		const service = this.llmServices.get(provider);
		if (!service) {
			if (onError) {
				onError(new Error(`LLM service for provider ${provider} not available`));
			}
			return;
		}

		try {
			const stream = service.streamComplete({
				systemPrompt,
				messages,
				temperature: agent.config.aiProvider.temperature,
				maxTokens: agent.config.aiProvider.maxTokens
			});

			// Process streaming response
			for await (const chunk of stream) {
				if (chunk.content && onContent) {
					onContent(chunk.content);
				}

				if (chunk.toolCalls && chunk.toolCalls.length > 0 && onToolCall) {
					for (const toolCall of chunk.toolCalls) {
						onToolCall(toolCall);
					}
				}
			}

			if (onComplete) {
				onComplete();
			}
		} catch (error) {
			console.error(`Error streaming chat for agent ${agentId}:`, error);
			if (onError) {
				onError(error instanceof Error ? error : new Error(String(error)));
			}
		}
	}

	/**
	 * Start a new conversation with AI agents
	 */
	async startConversation(
		conversationId: string,
		userMessage: string,
		options?: {
			onMessageStream?: (agentId: string, chunk: string, complete: boolean) => void;
			onAgentStart?: (agentId: string) => void;
			onAgentComplete?: (agentId: string) => void;
		}
	): Promise<void> {
		try {
			// Create user message
			const message: AgentMessage = {
				id: `msg-${Date.now()}`,
				agentId: 'user',
				type: 'request',
				content: userMessage,
				timestamp: new Date(),
			};

			// Add to conversation
			let context = this.conversations.get(conversationId);
			if (!context) {
				context = {
					id: conversationId,
					userId: 'default',
					sessionId: `session-${Date.now()}`,
					messages: [],
					memoryGraphId: 'default',
					activeTasks: [],
					metadata: {},
					createdAt: new Date(),
					updatedAt: new Date(),
				};
				this.conversations.set(conversationId, context);
			}

			context.messages.push(message);
			this.messageSubject.next(message);

			// Determine which agents should respond
			const plannerAgent = this.agents.get('planner');
			if (plannerAgent) {
				options?.onAgentStart?.('planner');				// Stream response from planner
				let fullResponse = '';
				await this.streamChatWithLLM(
					'planner',
					[{ role: 'user', content: userMessage }],
					'You are a helpful AI planning agent. Help users plan their software development projects.',
					(content: string) => {
						fullResponse += content;
						options?.onMessageStream?.('planner', fullResponse, false);
					},
					undefined, // onToolCall
					(error: Error) => {
						console.error('Planner agent error:', error);
						options?.onAgentComplete?.('planner');
					},
					() => {
						// Create agent response message
						const agentMessage: AgentMessage = {
							id: `msg-${Date.now()}`,
							agentId: 'planner',
							type: 'response',
							content: fullResponse,
							timestamp: new Date(),
							parentMessageId: message.id,
						};

						context!.messages.push(agentMessage);
						this.messageSubject.next(agentMessage);

						options?.onMessageStream?.('planner', fullResponse, true);
						options?.onAgentComplete?.('planner');
					}
				);
			}
		} catch (error) {
			console.error('Failed to start conversation:', error);
			throw error;
		}
	}

	/**
	 * Get conversation context
	 */
	async getConversationContext(conversationId: string): Promise<ConversationContext | null> {
		return this.conversations.get(conversationId) || null;
	}

	/**
	 * Update conversation metadata
	 */
	async updateConversationMetadata(
		conversationId: string,
		metadata: Record<string, unknown>
	): Promise<void> {
		const context = this.conversations.get(conversationId);
		if (context) {
			context.metadata = { ...context.metadata, ...metadata };
			context.updatedAt = new Date();
		}
	}

	/**
	 * Get conversation history from memory graph
	 */
	async getConversationHistory(): Promise<ConversationContext[]> {
		// This would typically query the memory graph for persisted conversations
		// For now, return in-memory conversations
		return Array.from(this.conversations.values());
	}
}
