/**
 * Agent Coordinator for AIDE Agent Runtime
 * Handles agent registration, workflow orchestration, and communication coordination
 */

import { MemoryGraph, MemoryNode, WorkflowStep } from '../memory/MemoryGraph';
import { AgentRequest, AgentResponse, AgentCapability } from '../types';

// Extended AgentCapability for coordination
export interface CoordinationCapability extends AgentCapability {
	domain: string;
	actions: string[];
	priority: 'low' | 'medium' | 'high';
}

export interface Agent {
	getId(): string;
	getCapabilities(): CoordinationCapability[];
	execute(request: AgentRequest): Promise<AgentResponse>;
}

export interface CoordinationWorkflowStep {
	agent: string;
	dependency: string | null;
}

export interface CoordinationStrategy {
	type: 'sequential' | 'parallel' | 'conditional' | 'hybrid';
	rules: CoordinationRule[];
}

export interface CoordinationRule {
	condition: string;
	action: 'continue' | 'retry' | 'fallback' | 'abort';
	parameters?: Record<string, any>;
}

export interface WorkflowExecution {
	id: string;
	steps: CoordinationWorkflowStep[];
	strategy: CoordinationStrategy;
	status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
	results: Map<string, AgentResponse>;
	errors: Array<{ agent: string; error: any; timestamp: number }>;
	startTime: number;
	endTime?: number;
	metadata: Record<string, any>;
}

export interface RecoveryResponse extends AgentResponse {
	recovery?: {
		attempted: boolean;
		strategy: string;
		attempts: number;
		success: boolean;
	};
}

export class AgentCoordinator {
	private agents: Map<string, Agent> = new Map();
	private capabilities: Map<string, CoordinationCapability[]> = new Map();
	private activeWorkflows: Map<string, WorkflowExecution> = new Map();
	private memoryGraph: MemoryGraph;

	constructor(memoryGraph: MemoryGraph) {
		this.memoryGraph = memoryGraph;
	}

	/**
	 * Register an agent with the coordinator
	 */
	registerAgent(name: string, agent: Agent): void {
		this.agents.set(name, agent);
		this.capabilities.set(name, agent.getCapabilities());

		// Record agent registration in memory graph
		this.memoryGraph.addNode({
			id: `agent-${name}`,
			type: 'context',
			data: {
				name,
				capabilities: agent.getCapabilities(),
				registered: Date.now(),
			},
			timestamp: Date.now(),
			relationships: [],
			metadata: {
				priority: 'high',
				tags: ['agent', 'registration'],
			},
		});
	}

	/**
	 * Execute a workflow with a single agent
	 */
	async executeWorkflow(agentName: string, request: AgentRequest): Promise<AgentResponse> {
		const agent = this.agents.get(agentName);
		if (!agent) {
			return {
				id: request.id,
				success: false,
				result: null,
				error: {
					type: 'agent_not_found',
					message: `Agent '${agentName}' not found`,
					details: { availableAgents: Array.from(this.agents.keys()) },
				},
				timestamp: Date.now(),
				duration: 0,
				metadata: {},
			};
		}

		const startTime = Date.now();

		try {
			// Store request context in memory graph
			this.memoryGraph.storeContext(request.id, {
				projectId: request.id,
				agentName,
				requestType: request.type,
				payload: request.payload,
				timestamp: startTime,
			});

			const response = await agent.execute(request);
			const duration = Date.now() - startTime; // Record workflow step in memory graph
			this.memoryGraph.recordWorkflowStep(request.id, {
				phase: request.type,
				agent: agentName,
				input: request.payload,
				output: response.result,
				timestamp: startTime,
				duration,
				success: response.success,
				...(response.error?.message && { error: response.error.message }),
			});

			return {
				...response,
				duration,
			};
		} catch (error) {
			const duration = Date.now() - startTime;

			// Record failure in memory graph
			this.memoryGraph.recordWorkflowStep(request.id, {
				phase: request.type,
				agent: agentName,
				input: request.payload,
				output: null,
				timestamp: startTime,
				duration,
				success: false,
				error: error instanceof Error ? error.message : String(error),
			});

			return {
				id: request.id,
				success: false,
				result: null,
				error: {
					type: 'execution_error',
					message: error instanceof Error ? error.message : String(error),
					details: { agent: agentName, duration },
				},
				timestamp: Date.now(),
				duration,
				metadata: {},
			};
		}
	}
	/**
	 * Execute a sequential workflow with multiple agents
	 */
	async executeSequentialWorkflow(
		steps: CoordinationWorkflowStep[],
		baseRequest: AgentRequest
	): Promise<AgentResponse & { executionOrder: string[] }> {
		const executionOrder: string[] = [];
		const results: Record<string, any> = {};
		let currentRequest = { ...baseRequest };

		for (const step of steps) {
			// Check dependency
			if (step.dependency && !results[step.dependency]) {
				return {
					id: baseRequest.id,
					success: false,
					result: null,
					error: {
						type: 'dependency_error',
						message: `Dependency '${step.dependency}' not satisfied for agent '${step.agent}'`,
						details: { step, availableResults: Object.keys(results) },
					},
					timestamp: Date.now(),
					duration: 0,
					metadata: {},
					executionOrder,
				};
			}

			// Execute agent
			const response = await this.executeWorkflow(step.agent, currentRequest);
			executionOrder.push(step.agent);

			if (!response.success) {
				return {
					...response,
					executionOrder,
				};
			}

			results[step.agent] = response.result;

			// Update request payload for next agent (chain results)
			currentRequest = {
				...currentRequest,
				payload: {
					...currentRequest.payload,
					previousResults: results,
					lastAgent: step.agent,
					lastResult: response.result,
				},
			};
		}

		return {
			id: baseRequest.id,
			success: true,
			result: results,
			timestamp: Date.now(),
			duration: Date.now() - baseRequest.timestamp,
			metadata: { executionOrder },
			executionOrder,
		};
	}

	/**
	 * Execute workflow with error recovery
	 */
	async executeWorkflowWithRecovery(
		agentName: string,
		request: AgentRequest,
		maxRetries: number = 3
	): Promise<RecoveryResponse> {
		let attempts = 0;
		let lastError: any = null;

		while (attempts < maxRetries) {
			attempts++;

			const response = await this.executeWorkflow(agentName, request);

			if (response.success) {
				return {
					...response,
					recovery: {
						attempted: attempts > 1,
						strategy: 'retry',
						attempts,
						success: true,
					},
				};
			}

			lastError = response.error;

			// Apply recovery strategy
			const recoveryStrategy = this.determineRecoveryStrategy(response.error, attempts);

			if (recoveryStrategy === 'abort') {
				break;
			}

			if (recoveryStrategy === 'fallback') {
				// Try to find an alternative agent
				const fallbackAgent = this.findFallbackAgent(agentName, request);
				if (fallbackAgent) {
					const fallbackResponse = await this.executeWorkflow(fallbackAgent, request);
					return {
						...fallbackResponse,
						recovery: {
							attempted: true,
							strategy: 'fallback',
							attempts,
							success: fallbackResponse.success,
						},
					};
				}
			}

			// Wait before retry
			if (attempts < maxRetries) {
				await this.sleep(Math.pow(2, attempts) * 1000); // Exponential backoff
			}
		}

		return {
			id: request.id,
			success: false,
			result: null,
			error: lastError,
			timestamp: Date.now(),
			duration: 0,
			metadata: {},
			recovery: {
				attempted: true,
				strategy: 'retry_with_fallback',
				attempts,
				success: false,
			},
		};
	}
	/**
	 * Find available agents by capability
	 */
	findAgentsByCapability(capability: CoordinationCapability): string[] {
		const matchingAgents: string[] = [];

		for (const [agentName, capabilities] of this.capabilities.entries()) {
			if (
				capabilities.some(
					cap =>
						cap.domain === capability.domain &&
						cap.actions.some((action: string) => capability.actions.includes(action))
				)
			) {
				matchingAgents.push(agentName);
			}
		}

		return matchingAgents;
	}

	/**
	 * Get agent capabilities
	 */
	getAgentCapabilities(agentName: string): CoordinationCapability[] {
		return this.capabilities.get(agentName) || [];
	}

	/**
	 * Get all registered agents
	 */
	getRegisteredAgents(): string[] {
		return Array.from(this.agents.keys());
	}

	/**
	 * Determine recovery strategy based on error type
	 */
	private determineRecoveryStrategy(error: any, attempts: number): 'retry' | 'fallback' | 'abort' {
		if (!error) return 'abort';

		switch (error.type) {
			case 'validation_error':
				return attempts < 2 ? 'retry' : 'abort';
			case 'timeout_error':
				return attempts < 3 ? 'retry' : 'fallback';
			case 'resource_error':
				return 'fallback';
			case 'agent_not_found':
				return 'fallback';
			default:
				return attempts < 2 ? 'retry' : 'fallback';
		}
	}
	/**
	 * Find a fallback agent for the given agent and request
	 */
	private findFallbackAgent(originalAgent: string, request: AgentRequest): string | null {
		// Try to infer capability from request type
		const requestCapability: CoordinationCapability = {
			name: request.type,
			description: `Execute ${request.type} request`,
			inputs: [],
			outputs: [],
			domain: request.type,
			actions: ['execute'],
			priority: 'medium',
		};

		const candidates = this.findAgentsByCapability(requestCapability).filter(
			agent => agent !== originalAgent
		);

		return candidates.length > 0 ? candidates[0] : null;
	}

	/**
	 * Sleep utility for retry delays
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Get workflow execution status
	 */
	getWorkflowStatus(workflowId: string): WorkflowExecution | null {
		return this.activeWorkflows.get(workflowId) || null;
	}

	/**
	 * Cancel an active workflow
	 */
	cancelWorkflow(workflowId: string): boolean {
		const workflow = this.activeWorkflows.get(workflowId);
		if (workflow && workflow.status === 'running') {
			workflow.status = 'cancelled';
			workflow.endTime = Date.now();
			return true;
		}
		return false;
	}

	/**
	 * Get coordination statistics
	 */
	getCoordinationStats(): {
		totalAgents: number;
		activeWorkflows: number;
		completedWorkflows: number;
		averageExecutionTime: number;
		successRate: number;
	} {
		const workflowHistory = this.memoryGraph.getNodesByType('workflow');
		const completedWorkflows = workflowHistory.filter(node => node.data.success !== undefined);

		const successfulWorkflows = completedWorkflows.filter(node => node.data.success);
		const totalDuration = completedWorkflows.reduce(
			(sum, node) => sum + (node.data.duration || 0),
			0
		);

		return {
			totalAgents: this.agents.size,
			activeWorkflows: this.activeWorkflows.size,
			completedWorkflows: completedWorkflows.length,
			averageExecutionTime:
				completedWorkflows.length > 0 ? totalDuration / completedWorkflows.length : 0,
			successRate:
				completedWorkflows.length > 0 ? successfulWorkflows.length / completedWorkflows.length : 0,
		};
	}
}
