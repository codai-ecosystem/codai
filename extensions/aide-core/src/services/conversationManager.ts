import * as vscode from 'vscode';
import { AgentManager } from '../agents/agentManager';
import { IMemoryGraph } from '../interfaces/IMemoryGraph';
import { createLogger } from '../services/loggerService';
import { AIService } from '../services/aiService';

export interface ConversationSession {
	id: string;
	startTime: Date;
	lastActivity: Date;
	title: string;
	context: string[];
	intentHistory: string[];
	agentHistory: { agent: string; timestamp: Date; action: string }[];
	status: 'active' | 'paused' | 'completed';
}

export interface ConversationContext {
	sessionId: string;
	currentIntent: string;
	relatedIntents: string[];
	activeAgent: string;
	contextWindow: string[];
	userPreferences: Record<string, any>;
}

/**
 * Enhanced conversation manager for Phase 2
 * Provides better session management, context tracking, and agent coordination
 */
export class ConversationManager {
	private logger = createLogger('ConversationManager');
	private agentManager: AgentManager;
	private memoryGraph: IMemoryGraph;
	private aiService: AIService;
	private activeSessions: Map<string, ConversationSession> = new Map();
	private currentSession: ConversationSession | null = null;

	constructor(
		agentManager: AgentManager,
		memoryGraph: IMemoryGraph,
		aiService: AIService
	) {
		this.agentManager = agentManager;
		this.memoryGraph = memoryGraph;
		this.aiService = aiService;
	}

	/**
	 * Start a new conversation session
	 */
	async startSession(initialMessage?: string): Promise<string> {
		const sessionId = this.generateSessionId();
		const session: ConversationSession = {
			id: sessionId,
			startTime: new Date(),
			lastActivity: new Date(),
			title: initialMessage ? this.generateSessionTitle(initialMessage) : 'New Conversation',
			context: [],
			intentHistory: [],
			agentHistory: [],
			status: 'active'
		};

		this.activeSessions.set(sessionId, session);
		this.currentSession = session;

		this.logger.info(`Started new conversation session: ${sessionId}`);
		// Add session to memory graph
		this.memoryGraph.addNode(
			'intent',
			`Conversation session started: ${session.title}`,
			{
				sessionId,
				startTime: session.startTime.toISOString(),
				status: session.status,
				type: 'conversation_session'
			}
		);

		return sessionId;
	}

	/**
	 * Resume an existing session
	 */
	async resumeSession(sessionId: string): Promise<boolean> {
		const session = this.activeSessions.get(sessionId);
		if (!session) {
			this.logger.warn(`Attempted to resume non-existent session: ${sessionId}`);
			return false;
		}

		this.currentSession = session;
		session.status = 'active';
		session.lastActivity = new Date();

		this.logger.info(`Resumed conversation session: ${sessionId}`);
		return true;
	}

	/**
	 * Process a message with enhanced context management
	 */
	async processMessage(message: string): Promise<string> {
		if (!this.currentSession) {
			await this.startSession(message);
		}

		const session = this.currentSession!;
		session.lastActivity = new Date();

		try {
			// Analyze intent with better context
			const context = await this.buildEnhancedContext(message, session);
			const intent = await this.analyzeIntentWithContext(message, context);

			// Update session tracking
			session.intentHistory.push(intent);
			session.context.push(`User: ${message}`);			// Add message to memory graph
			const messageNodeId = this.memoryGraph.addNode(
				'intent',
				message,
				{
					sessionId: session.id,
					timestamp: new Date().toISOString(),
					intent: intent,
					type: 'user_message'
				}
			);			// Link to session (Note: Session node ID would need to be tracked)
			// this.memoryGraph.addEdge(`session:${session.id}`, messageNodeId, 'contains');

			// Route to appropriate agent with enhanced context
			const agentResponse = await this.routeToAgentWithContext(intent, message, context);

			// Update session with response
			session.context.push(`Agent: ${agentResponse}`);

			// Add response to memory graph
			const responseNodeId = this.memoryGraph.addNode(
				'intent',
				agentResponse,
				{
					sessionId: session.id,
					timestamp: new Date().toISOString(),
					intent: intent,
					type: 'agent_response'
				}
			);

			// Link message to response
			this.memoryGraph.addEdge(messageNodeId, responseNodeId, 'generates');

			return agentResponse;

		} catch (error) {
			this.logger.error('Error processing message:', error);
			return `I apologize, but I encountered an error processing your message. Please try again or rephrase your request.`;
		}
	}

	/**
	 * Build enhanced context from session history and memory graph
	 */
	private async buildEnhancedContext(message: string, session: ConversationSession): Promise<ConversationContext> {
		// Get related context from memory graph
		const relatedNodes = this.memoryGraph.searchNodes(message);
		const relatedIntents = session.intentHistory.slice(-3); // Last 3 intents

		// Build context window (last 5 exchanges)
		const contextWindow = session.context.slice(-10); // Last 10 messages (5 exchanges)

		// Determine active agent based on recent history
		const recentAgentActivity = session.agentHistory.slice(-1);
		const activeAgent = recentAgentActivity.length > 0 ? recentAgentActivity[0].agent : 'planner';

		return {
			sessionId: session.id,
			currentIntent: '',
			relatedIntents,
			activeAgent,
			contextWindow,
			userPreferences: await this.getUserPreferences()
		};
	}

	/**
	 * Analyze intent with enhanced context awareness
	 */
	private async analyzeIntentWithContext(message: string, context: ConversationContext): Promise<string> {
		const systemPrompt = `You are an intent analyzer for a development assistant. Analyze the user's message and determine their intent based on:

1. The current message
2. Recent conversation history
3. Related previous intents
4. Current session context

Return a single intent classification from: plan, build, design, test, deploy, code, clarify, help`;

		const prompt = `Analyze this message for intent: "${message}"

Recent intents: ${context.relatedIntents.join(', ')}
Conversation context: ${context.contextWindow.slice(-4).join('\n')}
Active agent: ${context.activeAgent}

What is the primary intent of this message?`;

		try {
			const aiResponse = await this.aiService.generateResponse([
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: prompt }
			]);

			// Extract intent from response
			const intent = this.extractIntent(aiResponse.content);
			return intent;
		} catch (error) {
			this.logger.warn('Failed to analyze intent with AI, using fallback:', error);
			return this.fallbackIntentAnalysis(message);
		}
	}

	/**
	 * Route to agent with enhanced context
	 */
	private async routeToAgentWithContext(intent: string, message: string, context: ConversationContext): Promise<string> {
		// Track agent activity
		this.currentSession!.agentHistory.push({
			agent: intent,
			timestamp: new Date(),
			action: 'process_message'
		});

		// Pass enhanced context to agent
		const enhancedContext = [
			...context.contextWindow,
			`Session ID: ${context.sessionId}`,
			`Related intents: ${context.relatedIntents.join(', ')}`,
			`Previous agent: ${context.activeAgent}`
		];

		const responses = await this.agentManager.processMessage(message, {
			intent,
			contextWindow: enhancedContext,
			sessionId: context.sessionId,
			relatedIntents: context.relatedIntents,
			activeAgent: context.activeAgent
		});

		// Return the first response or combine multiple responses
		return responses.length > 0 ? responses[0].message : 'No response generated';
	}

	/**
	 * Extract intent from AI response
	 */
	private extractIntent(response: string): string {
		const validIntents = ['plan', 'build', 'design', 'test', 'deploy', 'code', 'clarify', 'help'];
		const lowercaseResponse = response.toLowerCase();

		for (const intent of validIntents) {
			if (lowercaseResponse.includes(intent)) {
				return intent;
			}
		}

		return 'clarify'; // Default fallback
	}

	/**
	 * Fallback intent analysis without AI
	 */
	private fallbackIntentAnalysis(message: string): string {
		const lowerMessage = message.toLowerCase();

		if (lowerMessage.includes('plan') || lowerMessage.includes('strategy')) return 'plan';
		if (lowerMessage.includes('build') || lowerMessage.includes('create') || lowerMessage.includes('implement')) return 'build';
		if (lowerMessage.includes('design') || lowerMessage.includes('ui') || lowerMessage.includes('ux')) return 'design';
		if (lowerMessage.includes('test') || lowerMessage.includes('verify')) return 'test';
		if (lowerMessage.includes('deploy') || lowerMessage.includes('release')) return 'deploy';
		if (lowerMessage.includes('code') || lowerMessage.includes('function') || lowerMessage.includes('class')) return 'code';
		if (lowerMessage.includes('help') || lowerMessage.includes('how')) return 'help';

		return 'clarify';
	}

	/**
	 * Get user preferences from workspace configuration
	 */
	private async getUserPreferences(): Promise<Record<string, any>> {
		const config = vscode.workspace.getConfiguration('aide');
		return {
			preferredLanguage: config.get('preferredLanguage', 'typescript'),
			framework: config.get('framework', 'react'),
			testingFramework: config.get('testingFramework', 'jest'),
			deploymentTarget: config.get('deploymentTarget', 'vercel')
		};
	}

	/**
	 * Generate a unique session ID
	 */
	private generateSessionId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Generate a meaningful session title from the initial message
	 */
	private generateSessionTitle(message: string): string {
		// Take first 50 characters and clean up
		let title = message.substring(0, 50).trim();
		if (message.length > 50) {
			title += '...';
		}
		return title;
	}

	/**
	 * Get all active sessions
	 */
	getActiveSessions(): ConversationSession[] {
		return Array.from(this.activeSessions.values())
			.filter(session => session.status === 'active')
			.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
	}

	/**
	 * Get current session
	 */
	getCurrentSession(): ConversationSession | null {
		return this.currentSession;
	}

	/**
	 * End current session
	 */
	endCurrentSession(): void {
		if (this.currentSession) {
			this.currentSession.status = 'completed';
			this.logger.info(`Ended conversation session: ${this.currentSession.id}`);
			this.currentSession = null;
		}
	}

	/**
	 * Pause current session
	 */
	pauseCurrentSession(): void {
		if (this.currentSession) {
			this.currentSession.status = 'paused';
			this.logger.info(`Paused conversation session: ${this.currentSession.id}`);
		}
	}
}
