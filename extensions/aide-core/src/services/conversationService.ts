import * as vscode from 'vscode';
import { MemoryService, ConversationContext } from './memoryService';
import { createLogger } from './loggerService';

/**
 * Conversation Service for AIDE Extension
 * Manages AI conversations, context switching, and conversation history
 */

export interface Message {
	id: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp: number;
	metadata?: Record<string, any>;
}

export interface ConversationSession {
	id: string;
	title: string;
	messages: Message[];
	projectContext?: string;
	isActive: boolean;
	createdAt: number;
	lastActivityAt: number;
}

export class ConversationService {
	private sessions: Map<string, ConversationSession> = new Map();
	private activeSessionId: string | null = null;
	private memoryService: MemoryService;
	private context: vscode.ExtensionContext;
	private readonly logger = createLogger('ConversationService');

	constructor(context: vscode.ExtensionContext, memoryService: MemoryService) {
		this.context = context;
		this.memoryService = memoryService;
		this.loadSessionsFromStorage();
	}

	/**
	 * Create a new conversation session
	 */
	createSession(title?: string, projectContext?: string): ConversationSession {
		const session: ConversationSession = {
			id: this.generateSessionId(),
			title: title || `Conversation ${this.sessions.size + 1}`,
			messages: [],
			projectContext,
			isActive: false,
			createdAt: Date.now(),
			lastActivityAt: Date.now()
		};

		this.sessions.set(session.id, session);
		this.saveSessionsToStorage();
		return session;
	}

	/**
	 * Get session by ID
	 */
	getSession(sessionId: string): ConversationSession | undefined {
		return this.sessions.get(sessionId);
	}

	/**
	 * Get all sessions
	 */
	getAllSessions(): ConversationSession[] {
		return Array.from(this.sessions.values()).sort((a, b) => b.lastActivityAt - a.lastActivityAt);
	}

	/**
	 * Set active session
	 */
	setActiveSession(sessionId: string): boolean {
		const session = this.sessions.get(sessionId);
		if (!session) return false;

		// Deactivate current session
		if (this.activeSessionId) {
			const currentSession = this.sessions.get(this.activeSessionId);
			if (currentSession) {
				currentSession.isActive = false;
			}
		}

		// Activate new session
		session.isActive = true;
		this.activeSessionId = sessionId;
		this.saveSessionsToStorage();
		return true;
	}

	/**
	 * Get active session
	 */
	getActiveSession(): ConversationSession | null {
		if (!this.activeSessionId) return null;
		return this.sessions.get(this.activeSessionId) || null;
	}

	/**
	 * Add message to session
	 */
	addMessage(sessionId: string, message: Omit<Message, 'id' | 'timestamp'>): Message {
		const session = this.sessions.get(sessionId);
		if (!session) {
			throw new Error(`Session ${sessionId} not found`);
		}

		const fullMessage: Message = {
			...message,
			id: this.generateMessageId(),
			timestamp: Date.now()
		};

		session.messages.push(fullMessage);
		session.lastActivityAt = Date.now();

		// Update memory service
		this.updateMemoryFromSession(session);
		this.saveSessionsToStorage();

		return fullMessage;
	}

	/**
	 * Update session title
	 */
	updateSessionTitle(sessionId: string, title: string): boolean {
		const session = this.sessions.get(sessionId);
		if (!session) return false;

		session.title = title;
		this.saveSessionsToStorage();
		return true;
	}

	/**
	 * Delete session
	 */
	deleteSession(sessionId: string): boolean {
		const deleted = this.sessions.delete(sessionId);
		if (deleted) {
			if (this.activeSessionId === sessionId) {
				this.activeSessionId = null;
			}
			this.saveSessionsToStorage();
		}
		return deleted;
	}

	/**
	 * Clear all messages from session
	 */
	clearSession(sessionId: string): boolean {
		const session = this.sessions.get(sessionId);
		if (!session) return false;

		session.messages = [];
		session.lastActivityAt = Date.now();
		this.saveSessionsToStorage();
		return true;
	}

	/**
	 * Search messages across all sessions
	 */
	searchMessages(query: string, sessionId?: string): Array<{ session: ConversationSession; message: Message }> {
		const results: Array<{ session: ConversationSession; message: Message }> = [];
		const sessions = sessionId ? [this.sessions.get(sessionId)].filter(Boolean) : Array.from(this.sessions.values());

		for (const session of sessions) {
			if (!session) continue;

			for (const message of session.messages) {
				if (message.content.toLowerCase().includes(query.toLowerCase())) {
					results.push({ session, message });
				}
			}
		}

		return results.sort((a, b) => b.message.timestamp - a.message.timestamp);
	}

	/**
	 * Get conversation context for AI
	 */
	getConversationContext(sessionId: string, maxMessages: number = 10): Message[] {
		const session = this.sessions.get(sessionId);
		if (!session) return [];

		// Get recent messages
		const recentMessages = session.messages.slice(-maxMessages);

		// Add system context if available
		const workspace = vscode.workspace.workspaceFolders?.[0];
		if (workspace && recentMessages.length > 0 && recentMessages[0].role !== 'system') {
			const systemMessage: Message = {
				id: 'system_context',
				role: 'system',
				content: `You are AIDE, an AI-native development environment. Current workspace: ${workspace.name}. Help with coding, project planning, and development tasks.`,
				timestamp: Date.now()
			};
			recentMessages.unshift(systemMessage);
		}

		return recentMessages;
	}

	/**
	 * Get session statistics
	 */
	getSessionStats(sessionId: string): any {
		const session = this.sessions.get(sessionId);
		if (!session) return null;

		const stats = {
			messageCount: session.messages.length,
			userMessages: session.messages.filter(m => m.role === 'user').length,
			assistantMessages: session.messages.filter(m => m.role === 'assistant').length,
			duration: session.lastActivityAt - session.createdAt,
			avgMessageLength: 0,
			lastActivity: session.lastActivityAt
		};

		if (session.messages.length > 0) {
			const totalLength = session.messages.reduce((sum, msg) => sum + msg.content.length, 0);
			stats.avgMessageLength = Math.round(totalLength / session.messages.length);
		}

		return stats;
	}

	/**
	 * Export session for sharing or backup
	 */
	exportSession(sessionId: string): any {
		const session = this.sessions.get(sessionId);
		if (!session) return null;

		return {
			id: session.id,
			title: session.title,
			messages: session.messages,
			projectContext: session.projectContext,
			createdAt: session.createdAt,
			lastActivityAt: session.lastActivityAt,
			stats: this.getSessionStats(sessionId)
		};
	}

	/**
	 * Import session from exported data
	 */
	importSession(sessionData: any): string | null {
		try {
			const session: ConversationSession = {
				id: sessionData.id || this.generateSessionId(),
				title: sessionData.title || 'Imported Session',
				messages: sessionData.messages || [],
				projectContext: sessionData.projectContext,
				isActive: false,
				createdAt: sessionData.createdAt || Date.now(),
				lastActivityAt: sessionData.lastActivityAt || Date.now()
			};

			this.sessions.set(session.id, session);
			this.saveSessionsToStorage();
			return session.id;
		} catch (error) {
			this.logger.error('Failed to import session:', error);
			return null;
		}
	}

	/**
	 * Get recent activity across all sessions
	 */
	getRecentActivity(limit: number = 5): Array<{ session: ConversationSession; lastMessage: Message }> {
		const activities: Array<{ session: ConversationSession; lastMessage: Message }> = [];

		for (const session of this.sessions.values()) {
			if (session.messages.length > 0) {
				const lastMessage = session.messages[session.messages.length - 1];
				activities.push({ session, lastMessage });
			}
		}

		return activities
			.sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp)
			.slice(0, limit);
	}

	/**
	 * Update memory service with session data
	 */
	private updateMemoryFromSession(session: ConversationSession): void {
		const conversationContext: ConversationContext = {
			id: session.id,
			messages: session.messages.slice(-5), // Last 5 messages
			projectContext: {
				name: session.projectContext || 'Unknown',
				type: 'general',
				technologies: [],
				structure: {},
				dependencies: []
			},
			activeFiles: [],
			timestamp: session.lastActivityAt
		};

		this.memoryService.storeConversation(conversationContext);
	}

	/**
	 * Generate unique session ID
	 */
	private generateSessionId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Generate unique message ID
	 */
	private generateMessageId(): string {
		return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Load sessions from VS Code storage
	 */
	private loadSessionsFromStorage(): void {
		try {
			const sessionsData = this.context.globalState.get('aide_conversations');
			const activeSessionData = this.context.globalState.get('aide_active_session');

			if (sessionsData) {
				this.sessions = new Map(Object.entries(sessionsData as any));
			}

			if (activeSessionData) {
				this.activeSessionId = activeSessionData as string;
			}
		} catch (error) {
			this.logger.error('Failed to load sessions from storage:', error);
		}
	}

	/**
	 * Save sessions to VS Code storage
	 */
	private saveSessionsToStorage(): void {
		try {
			const sessionsData = Object.fromEntries(this.sessions);
			this.context.globalState.update('aide_conversations', sessionsData);
			this.context.globalState.update('aide_active_session', this.activeSessionId);
		} catch (error) {
			this.logger.error('Failed to save sessions to storage:', error);
		}
	}
}
