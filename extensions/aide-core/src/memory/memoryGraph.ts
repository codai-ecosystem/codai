import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';

export interface MemoryNode {
	id: string;
	type: 'intent' | 'feature' | 'screen' | 'logic' | 'relationship' | 'decision';
	content: string;
	timestamp: Date;
	connections: string[]; // IDs of connected nodes
	metadata: Record<string, any>;
}

export interface MemoryEdge {
	id: string;
	from: string;
	to: string;
	type: 'implements' | 'depends_on' | 'relates_to' | 'derived_from';
	weight: number;
	metadata: Record<string, any>;
}

export class MemoryGraph {
	private nodes: Map<string, MemoryNode> = new Map();
	private edges: Map<string, MemoryEdge> = new Map();
	private context: vscode.ExtensionContext;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
		this.loadFromStorage();
	}

	/**
	 * Add a new node to the memory graph
	 */
	addNode(type: MemoryNode['type'], content: string, metadata: Record<string, any> = {}): string {
		const id = uuidv4();
		const node: MemoryNode = {
			id,
			type,
			content,
			timestamp: new Date(),
			connections: [],
			metadata
		};

		this.nodes.set(id, node);
		this.saveToStorage();
		return id;
	}

	/**
	 * Add an edge between two nodes
	 */
	addEdge(from: string, to: string, type: MemoryEdge['type'], weight: number = 1, metadata: Record<string, any> = {}): string {
		const id = uuidv4();
		const edge: MemoryEdge = {
			id,
			from,
			to,
			type,
			weight,
			metadata
		};

		this.edges.set(id, edge);

		// Update node connections
		const fromNode = this.nodes.get(from);
		const toNode = this.nodes.get(to);

		if (fromNode && !fromNode.connections.includes(to)) {
			fromNode.connections.push(to);
		}
		if (toNode && !toNode.connections.includes(from)) {
			toNode.connections.push(from);
		}

		this.saveToStorage();
		return id;
	}

	/**
	 * Get a node by ID
	 */
	getNode(id: string): MemoryNode | undefined {
		return this.nodes.get(id);
	}

	/**
	 * Get all nodes of a specific type
	 */
	getNodesByType(type: MemoryNode['type']): MemoryNode[] {
		return Array.from(this.nodes.values()).filter(node => node.type === type);
	}

	/**
	 * Search nodes by content
	 */
	searchNodes(query: string): MemoryNode[] {
		const lowercaseQuery = query.toLowerCase();
		return Array.from(this.nodes.values()).filter(node =>
			node.content.toLowerCase().includes(lowercaseQuery) ||
			Object.values(node.metadata).some(value =>
				typeof value === 'string' && value.toLowerCase().includes(lowercaseQuery)
			)
		);
	}

	/**
	 * Get connected nodes
	 */
	getConnectedNodes(nodeId: string): MemoryNode[] {
		const node = this.nodes.get(nodeId);
		if (!node) {
			return [];
		}

		return node.connections
			.map(id => this.nodes.get(id))
			.filter((node): node is MemoryNode => node !== undefined);
	}

	/**
	 * Get all nodes and edges for visualization
	 */
	getGraphData(): { nodes: MemoryNode[], edges: MemoryEdge[] } {
		return {
			nodes: Array.from(this.nodes.values()),
			edges: Array.from(this.edges.values())
		};
	}

	/**
	 * Update node content
	 */
	updateNode(id: string, updates: Partial<Pick<MemoryNode, 'content' | 'metadata'>>): boolean {
		const node = this.nodes.get(id);
		if (!node) {
			return false;
		}

		if (updates.content !== undefined) {
			node.content = updates.content;
		}
		if (updates.metadata !== undefined) {
			node.metadata = { ...node.metadata, ...updates.metadata };
		}

		this.saveToStorage();
		return true;
	}

	/**
	 * Remove a node and its edges
	 */
	removeNode(id: string): boolean {
		const node = this.nodes.get(id);
		if (!node) {
			return false;
		}

		// Remove all edges connected to this node
		for (const [edgeId, edge] of this.edges.entries()) {
			if (edge.from === id || edge.to === id) {
				this.edges.delete(edgeId);
			}
		}

		// Remove connections from other nodes
		for (const otherNode of this.nodes.values()) {
			otherNode.connections = otherNode.connections.filter(connId => connId !== id);
		}

		this.nodes.delete(id);
		this.saveToStorage();
		return true;
	}

	/**
	 * Save memory graph to VS Code storage
	 */
	private saveToStorage(): void {
		const data = {
			nodes: Array.from(this.nodes.entries()),
			edges: Array.from(this.edges.entries()),
			timestamp: new Date().toISOString()
		};

		this.context.globalState.update('aide.memoryGraph', data);
	}

	/**
	 * Load memory graph from VS Code storage
	 */
	private loadFromStorage(): void {
		const data = this.context.globalState.get<{
			nodes: [string, MemoryNode][];
			edges: [string, MemoryEdge][];
			timestamp: string;
		}>('aide.memoryGraph');

		if (data) {
			this.nodes = new Map(data.nodes);
			this.edges = new Map(data.edges);

			// Convert timestamp strings back to Date objects
			for (const node of this.nodes.values()) {
				node.timestamp = new Date(node.timestamp);
			}
		}
	}

	/**
	 * Clear all memory (useful for debugging)
	 */
	clear(): void {
		this.nodes.clear();
		this.edges.clear();
		this.saveToStorage();
	}
}
