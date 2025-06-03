import { IMemoryGraph } from '../interfaces/IMemoryGraph';
import { AgentResponse } from './agentManager';
import { AIService, AIMessage } from '../services/aiService';

export abstract class BaseAgent {
	protected memoryGraph: IMemoryGraph;
	protected agentType: string;
	protected aiService: AIService;

	constructor(memoryGraph: IMemoryGraph, agentType: string, aiService: AIService) {
		this.memoryGraph = memoryGraph;
		this.agentType = agentType;
		this.aiService = aiService;
	}

	/**
	 * Process a message and return a response
	 */
	abstract process(message: string, intentId: string): Promise<AgentResponse>;

	/**
	 * Get current status of this agent
	 */
	abstract getStatus(): Promise<Record<string, any>>;

	/**
	 * Add a decision to the memory graph
	 */
	protected addDecision(decision: string, reasoning: string, intentId?: string): string {
		const decisionId = this.memoryGraph.addNode('decision', decision, {
			agent: this.agentType,
			reasoning,
			timestamp: new Date().toISOString()
		});

		if (intentId) {
			this.memoryGraph.addEdge(intentId, decisionId, 'derived_from');
		}

		return decisionId;
	}

	/**
	 * Add a feature to the memory graph
	 */
	protected addFeature(featureName: string, description: string, intentId?: string): string {
		const featureId = this.memoryGraph.addNode('feature', featureName, {
			description,
			agent: this.agentType,
			status: 'planned',
			timestamp: new Date().toISOString()
		});

		if (intentId) {
			this.memoryGraph.addEdge(intentId, featureId, 'implements');
		}

		return featureId;
	}

	/**
	 * Get related context from memory graph
	 */
	protected getRelatedContext(query: string): string[] {
		const nodes = this.memoryGraph.searchNodes(query);
		return nodes.map(node => `${node.type}: ${node.content}`);
	}
	/**
	 * Generate AI response using the configured AI service
	 */
	protected async generateAIResponse(prompt: string, context: string[] = [], systemPrompt?: string): Promise<string> {
		try {
			const messages: AIMessage[] = [];

			// Add system prompt if provided
			if (systemPrompt) {
				messages.push({ role: 'system', content: systemPrompt });
			}

			// Add context if available
			if (context.length > 0) {
				const contextStr = context.join('\n\n');
				messages.push({
					role: 'system',
					content: `Relevant context from memory:\n${contextStr}`
				});
			}

			// Add the main prompt
			messages.push({ role: 'user', content: prompt });

			const response = await this.aiService.generateResponse(messages, 2000, 0.7);
			return response.content;

		} catch (error) {
			// Fallback to a helpful error message if AI is not configured
			return `I'm unable to process your request because the AI service is not properly configured. Please set up your API keys in the AIDE settings. Error: ${error}`;
		}
	}
}
