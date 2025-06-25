/**
 * Agent Adapter to bridge existing BaseAgent implementation with new coordination system
 */

import { BaseAgent, AgentConfig, Task, TaskResult } from '../types';
import { Agent, CoordinationCapability } from '../coordination/AgentCoordinator';
import { AgentRequest, AgentResponse } from '../types';

export class AgentAdapter implements Agent {
	private baseAgent: BaseAgent;
	private agentName: string;

	constructor(baseAgent: BaseAgent, agentName: string) {
		this.baseAgent = baseAgent;
		this.agentName = agentName;
	}

	getId(): string {
		return this.agentName;
	}

	getCapabilities(): CoordinationCapability[] {
		// Map BaseAgent capabilities to CoordinationCapabilities
		const baseCapabilities = this.baseAgent.config.capabilities;

		return baseCapabilities.map(cap => ({
			...cap,
			domain: this.agentName,
			actions: cap.outputs.map(output => output.name),
			priority: 'medium' as const,
		}));
	}

	async execute(request: AgentRequest): Promise<AgentResponse> {
		const startTime = Date.now();

		try {
			// Convert AgentRequest to Task
			const task: Task = {
				id: request.id,
				title: `${request.type} task`,
				description:
					typeof request.payload === 'string'
						? request.payload
						: request.payload?.description || `Execute ${request.type}`,
				agentId: this.agentName,
				status: 'in_progress',
				priority: request.priority,
				inputs: request.payload,
				dependencies: [],
				createdAt: new Date(request.timestamp),
				progress: 0,
			};

			// Check if agent can execute the task
			if (!this.baseAgent.canExecuteTask(task)) {
				return {
					id: request.id,
					success: false,
					result: null,
					error: {
						type: 'capability_mismatch',
						message: `Agent ${this.agentName} cannot execute task of type ${request.type}`,
						details: { agentId: this.agentName, taskType: request.type },
					},
					timestamp: Date.now(),
					duration: Date.now() - startTime,
					metadata: {},
				};
			} // Execute the task
			const result: TaskResult = await this.baseAgent.executeTask(task);

			const response: AgentResponse = {
				id: request.id,
				success: result.success,
				result: result.outputs || result,
				timestamp: Date.now(),
				duration: result.duration,
				metadata: {
					memoryChanges: result.memoryChanges || [],
					agentId: this.agentName,
				},
			};

			// Add error field only if there's an error
			if (result.error) {
				response.error = {
					type: 'execution_error',
					message: result.error,
					details: { agentId: this.agentName },
				};
			}

			return response;
		} catch (error) {
			return {
				id: request.id,
				success: false,
				result: null,
				error: {
					type: 'execution_error',
					message: error instanceof Error ? error.message : String(error),
					details: { agentId: this.agentName },
				},
				timestamp: Date.now(),
				duration: Date.now() - startTime,
				metadata: {},
			};
		}
	}
}
