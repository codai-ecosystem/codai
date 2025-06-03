import * as vscode from 'vscode';
import { createLogger } from './loggerService';

/**
 * Memory Service for AIDE Extension
 * Manages conversation context, memory graph, and project state
 */

export interface MemoryNode {
	id: string;
	type: 'conversation' | 'file' | 'function' | 'concept' | 'decision';
	content: string;
	metadata: Record<string, any>;
	connections: string[];
	timestamp: number;
	weight: number;
}

export interface ConversationContext {
	id: string;
	messages: any[];
	projectContext: ProjectContext;
	activeFiles: string[];
	timestamp: number;
}

export interface ProjectContext {
	name: string;
	type: string;
	technologies: string[];
	structure: Record<string, any>;
	dependencies: string[];
}

export class MemoryService {
	private memoryGraph: Map<string, MemoryNode> = new Map();
	private conversations: Map<string, ConversationContext> = new Map();
	private context: vscode.ExtensionContext;
	private readonly logger = createLogger('MemoryService');

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
		this.loadMemoryFromStorage();
	}

	/**
	 * Add a new memory node to the graph
	 */
	addMemoryNode(node: MemoryNode): void {
		this.memoryGraph.set(node.id, node);
		this.saveMemoryToStorage();
	}

	/**
	 * Get a memory node by ID
	 */
	getMemoryNode(id: string): MemoryNode | undefined {
		return this.memoryGraph.get(id);
	}

	/**
	 * Find related memory nodes
	 */
	findRelatedNodes(nodeId: string, maxDepth: number = 2): MemoryNode[] {
		const visited = new Set<string>();
		const result: MemoryNode[] = [];

		const traverse = (id: string, depth: number) => {
			if (depth > maxDepth || visited.has(id)) return;

			visited.add(id);
			const node = this.memoryGraph.get(id);
			if (node) {
				result.push(node);
				node.connections.forEach(connId => traverse(connId, depth + 1));
			}
		};

		traverse(nodeId, 0);
		return result;
	}

	/**
	 * Store conversation context
	 */
	storeConversation(conversation: ConversationContext): void {
		this.conversations.set(conversation.id, conversation);

		// Create memory nodes for important conversation elements
		const conversationNode: MemoryNode = {
			id: `conv_${conversation.id}`,
			type: 'conversation',
			content: JSON.stringify(conversation.messages.slice(-3)), // Last 3 messages
			metadata: {
				projectName: conversation.projectContext.name,
				messageCount: conversation.messages.length
			},
			connections: [],
			timestamp: conversation.timestamp,
			weight: conversation.messages.length * 0.1
		};

		this.addMemoryNode(conversationNode);
	}

	/**
	 * Get conversation by ID
	 */
	getConversation(id: string): ConversationContext | undefined {
		return this.conversations.get(id);
	}

	/**
	 * Search memory by content
	 */
	searchMemory(query: string, type?: string): MemoryNode[] {
		const results: MemoryNode[] = [];

		for (const node of this.memoryGraph.values()) {
			if (type && node.type !== type) continue;

			if (node.content.toLowerCase().includes(query.toLowerCase()) ||
				JSON.stringify(node.metadata).toLowerCase().includes(query.toLowerCase())) {
				results.push(node);
			}
		}

		// Sort by relevance (weight and timestamp)
		return results.sort((a, b) => {
			const aScore = a.weight * (Date.now() - a.timestamp) / 1000000;
			const bScore = b.weight * (Date.now() - b.timestamp) / 1000000;
			return bScore - aScore;
		});
	}

	/**
	 * Update project context
	 */
	updateProjectContext(context: ProjectContext): void {
		const projectNode: MemoryNode = {
			id: `project_${context.name}`,
			type: 'concept',
			content: `Project: ${context.name} (${context.type})`,
			metadata: {
				technologies: context.technologies,
				dependencies: context.dependencies,
				structure: context.structure
			},
			connections: [],
			timestamp: Date.now(),
			weight: 1.0
		};

		this.addMemoryNode(projectNode);
	}

	/**
	 * Get memory statistics
	 */
	getMemoryStats(): any {
		const stats = {
			totalNodes: this.memoryGraph.size,
			conversations: this.conversations.size,
			nodesByType: {} as Record<string, number>,
			totalConnections: 0,
			avgWeight: 0
		};

		let totalWeight = 0;
		for (const node of this.memoryGraph.values()) {
			stats.nodesByType[node.type] = (stats.nodesByType[node.type] || 0) + 1;
			stats.totalConnections += node.connections.length;
			totalWeight += node.weight;
		}

		stats.avgWeight = stats.totalNodes > 0 ? totalWeight / stats.totalNodes : 0;
		return stats;
	}

	/**
	 * Export memory graph for visualization
	 */
	exportMemoryGraph(): any {
		const nodes = Array.from(this.memoryGraph.values()).map(node => ({
			id: node.id,
			type: node.type,
			label: node.content.substring(0, 50),
			weight: node.weight,
			timestamp: node.timestamp
		}));

		const edges = [];
		for (const node of this.memoryGraph.values()) {
			for (const connId of node.connections) {
				edges.push({ from: node.id, to: connId });
			}
		}

		return { nodes, edges };
	}

	/**
	 * Clear old memory nodes to prevent memory bloat
	 */
	cleanupOldMemory(maxAge: number = 30 * 24 * 60 * 60 * 1000): void { // 30 days
		const cutoff = Date.now() - maxAge;
		const toDelete: string[] = [];

		for (const [id, node] of this.memoryGraph.entries()) {
			if (node.timestamp < cutoff && node.weight < 0.5) {
				toDelete.push(id);
			}
		}

		toDelete.forEach(id => this.memoryGraph.delete(id));
		this.saveMemoryToStorage();
	}

	/**
	 * Load memory from VS Code storage
	 */
	private loadMemoryFromStorage(): void {
		try {
			const memoryData = this.context.globalState.get('aide_memory_graph');
			const conversationData = this.context.globalState.get('aide_conversations');

			if (memoryData) {
				this.memoryGraph = new Map(Object.entries(memoryData as any));
			}

			if (conversationData) {
				this.conversations = new Map(Object.entries(conversationData as any));
			}
		} catch (error) {
			this.logger.error('Failed to load memory from storage:', error);
		}
	}

	/**
	 * Save memory to VS Code storage
	 */
	private saveMemoryToStorage(): void {
		try {
			const memoryData = Object.fromEntries(this.memoryGraph);
			const conversationData = Object.fromEntries(this.conversations);

			this.context.globalState.update('aide_memory_graph', memoryData);
			this.context.globalState.update('aide_conversations', conversationData);
		} catch (error) {
			this.logger.error('Failed to save memory to storage:', error);
		}
	}
}
