/**
 * Minimal interface for MemoryGraphEngine functionality
 * This allows us to avoid TypeScript compilation issues while maintaining type safety
 */
export interface IMemoryGraphEngine {
	// Basic graph management
	addNode(nodeData: any): string;
	removeNode(id: string): boolean;
	updateNode(id: string, updates: any): boolean;
	getNode(id: string): any;

	// Relationship management
	addRelationship(relationshipData: any): string;
	removeRelationship(id: string): boolean;

	// Data access
	get nodes(): any[];
	get relationships(): any[];

	// Graph operations
	getGraph(): any;
	clear(): void;

	// Event handling
	on(event: string, handler: Function): void;
	off(event: string, handler: Function): void;

	// Persistence
	saveToStorage(): Promise<void>;
	loadFromStorage(): Promise<void>;
}
