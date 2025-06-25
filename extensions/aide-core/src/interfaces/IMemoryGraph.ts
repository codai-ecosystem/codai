/**
 * Interface for memory graph functionality expected by agents
 * This allows both the legacy MemoryGraph and new MemoryGraphAdapter to be used interchangeably
 */
export interface IMemoryGraph {
	// Core node operations
	addNode(
		type: 'intent' | 'feature' | 'screen' | 'logic' | 'relationship' | 'decision',
		content: string,
		metadata?: Record<string, any>
	): string;
	getNode(id: string): any;
	updateNode(
		id: string,
		updates: Partial<{ content: string; metadata: Record<string, any> }>
	): boolean;
	removeNode(id: string): boolean;

	// Core edge operations
	addEdge(
		fromId: string,
		toId: string,
		type?: string,
		weight?: number,
		metadata?: Record<string, any>
	): string;

	// Query operations
	getNodesByType(
		type: 'intent' | 'feature' | 'screen' | 'logic' | 'relationship' | 'decision'
	): any[];
	searchNodes(query: string): any[];
	getConnectedNodes(nodeId: string): any[];
	getConnections(nodeId: string): any[];

	// Data access
	getGraphData(): { nodes: any[]; edges: any[] };
	getStats(): any;

	// Storage operations
	saveToStorage(): Promise<void>;
	loadFromStorage(): Promise<void>;
	clear(): void;
}
