import { v4 as uuidv4 } from 'uuid';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import {
	AnyNode,
	Relationship,
	MemoryGraph,
	MemoryGraphSchema,
	AnyNodeSchema,
	RelationshipSchema,
	GraphChange
} from './schemas';
import {
	PersistenceAdapter,
	PersistenceOptions,
	createPersistenceAdapter
} from './persistence';
import {
	MigrationSystem,
	createMigrationSystem
} from './migrations';

/**
 * Memory Graph Engine - Core state management for AIDE
 * Provides reactive, immutable graph operations with event streaming
 */
export class MemoryGraphEngine {
	private _graph: BehaviorSubject<MemoryGraph>;
	private _changes: Subject<GraphChange>;
	private _persistenceAdapter: PersistenceAdapter;
	private _migrationSystem: MigrationSystem;
	private _autosaveEnabled: boolean = true;
	private _backupInterval: NodeJS.Timeout | null = null;
	private _currentSchemaVersion = '0.2.0'; // Current schema version
	constructor(
		initialGraph?: Partial<MemoryGraph>,
		persistenceAdapter?: PersistenceAdapter,
		persistenceOptions?: PersistenceOptions
	) {
		const defaultGraph: MemoryGraph = {
			id: uuidv4(),
			name: 'New AIDE Project',
			version: this._currentSchemaVersion, // Use current schema version
			createdAt: new Date(),
			updatedAt: new Date(),
			nodes: [],
			relationships: [],
			metadata: {
				aiProvider: 'openai',
				lastInteractionAt: new Date(),
				tags: [],
				stats: {
					nodeCount: 0,
					edgeCount: 0,
					complexity: 0
				}
			},
			settings: {
				autoSave: true,
				persistLocation: 'local'
			},
			...initialGraph,
		};

		this._graph = new BehaviorSubject(MemoryGraphSchema.parse(defaultGraph));
		this._changes = new Subject<GraphChange>();
		this._migrationSystem = createMigrationSystem();

		// Use provided adapter or create a default one
		this._persistenceAdapter = persistenceAdapter || createPersistenceAdapter('auto', persistenceOptions);

		// Setup auto-save if enabled
		if (this._autosaveEnabled) {
			this.setupAutoSave();
		}
	}

	// Configure auto-save behavior
	private setupAutoSave(intervalMinutes = 5) {
		if (this._backupInterval) {
			clearInterval(this._backupInterval);
		}

		if (this._autosaveEnabled) {
			this._backupInterval = setInterval(() => {
				this.saveGraph().catch(err => console.error('Auto-save failed:', err));
			}, intervalMinutes * 60 * 1000);
		}
	}

	setAutosave(enabled: boolean): void {
		this._autosaveEnabled = enabled;

		if (enabled) {
			this.setupAutoSave();
		} else if (this._backupInterval) {
			clearInterval(this._backupInterval);
			this._backupInterval = null;
		}

		// Update graph settings
		this.updateGraph((graph: MemoryGraph) => ({
			...graph,
			settings: {
				...graph.settings,
				autoSave: enabled
			}
		}));
	}

	// Observable streams
	get graph$(): Observable<MemoryGraph> {
		return this._graph.asObservable();
	}

	get changes$(): Observable<GraphChange> {
		return this._changes.asObservable();
	}

	// Current state accessors
	get currentGraph(): MemoryGraph {
		return this._graph.value;
	}

	get nodes(): AnyNode[] {
		return this.currentGraph.nodes;
	}

	get relationships(): Relationship[] {
		return this.currentGraph.relationships;
	}

	// Graph update helper
	private updateGraph(updateFn: (graph: MemoryGraph) => MemoryGraph): void {
		const updatedGraph = updateFn(this.currentGraph);
		this._graph.next(MemoryGraphSchema.parse(updatedGraph));
	}

	// Persistence methods
	async saveGraph(): Promise<boolean> {
		try {
			const result = await this._persistenceAdapter.save(this.currentGraph);
			return result;
		} catch (error) {
			console.error('Failed to save graph', error);
			return false;
		}
	}
	async loadGraph(graphId?: string): Promise<boolean> {
		try {
			const loadedGraph = await this._persistenceAdapter.load(graphId);
			if (loadedGraph) {
				// Check if migration is needed
				if (loadedGraph.version !== this._currentSchemaVersion) {
					console.log(`Migrating graph from version ${loadedGraph.version} to ${this._currentSchemaVersion}`);

					// Apply migrations
					const migratedGraph = this._migrationSystem.migrateGraph(loadedGraph, this._currentSchemaVersion);

					// Update and save migrated graph
					this._graph.next(migratedGraph);
					await this.saveGraph(); // Save the migrated version
				} else {
					// No migration needed
					this._graph.next(loadedGraph);
				}
				return true;
			}
			return false;
		} catch (error) {
			console.error('Failed to load graph', error);
			return false;
		}
	}
	async exportGraph(format = 'json'): Promise<string> {
		try {
			return await this._persistenceAdapter.exportGraph(format);
		} catch (error) {
			console.error('Failed to export graph', error);
			throw new Error(`Graph export failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	async importGraph(data: string, format = 'json'): Promise<boolean> {
		try {
			const importedGraph = await this._persistenceAdapter.importGraph(data, format);
			if (importedGraph) {
				this._graph.next(importedGraph);
				return true;
			}
			return false;
		} catch (error) {
			console.error('Failed to import graph', error);
			return false;
		}
	}

	// Graph statistics and metadata
	updateGraphMetadata(): void {
		const nodeCount = this.nodes.length;
		const edgeCount = this.relationships.length;
		// Calculate graph complexity based on node and edge counts and types
		const complexity = this.calculateGraphComplexity();

		this.updateGraph((graph: MemoryGraph) => ({
			...graph,
			metadata: {
				...graph.metadata,
				lastInteractionAt: new Date(),
				stats: {
					nodeCount,
					edgeCount,
					complexity
				}
			}
		}));
	}

	private calculateGraphComplexity(): number {
		// Basic complexity measure based on number of nodes, edges, and their types
		const nodeComplexity = this.nodes.reduce((sum, node) => {
			// Different node types contribute differently to complexity
			switch (node.type) {
				case 'logic': return sum + 2;
				case 'data': return sum + 1.5;
				case 'screen': return sum + 1.5;
				case 'api': return sum + 1.8;
				default: return sum + 1;
			}
		}, 0);

		const edgeComplexity = this.relationships.length * 0.5;

		// Calculate connected components as a measure of cohesion
		const connectedSets = this.findConnectedComponents();
		const cohesionFactor = connectedSets.length > 0 ?
			1 + (0.2 * (1 - (connectedSets.length / this.nodes.length))) : 1;

		return (nodeComplexity + edgeComplexity) * cohesionFactor;
	}

	// Find connected components in the graph
	private findConnectedComponents(): Set<string>[] {
		const visited = new Set<string>();
		const components: Set<string>[] = [];

		// For each node, if not visited, do a traversal to find its connected component
		for (const node of this.nodes) {
			if (!visited.has(node.id)) {
				const component = new Set<string>();
				this.depthFirstTraversal(node.id, visited, component);
				components.push(component);
			}
		}

		return components;
	}

	// DFS traversal helper
	private depthFirstTraversal(
		nodeId: string,
		visited: Set<string>,
		component: Set<string>
	): void {
		visited.add(nodeId);
		component.add(nodeId);

		// Find all relationships involving this node
		const connectedEdges = this.relationships.filter(
			r => r.fromNodeId === nodeId || r.toNodeId === nodeId
		);

		// Visit all connected nodes
		for (const edge of connectedEdges) {
			const connectedNodeId = edge.fromNodeId === nodeId ? edge.toNodeId : edge.fromNodeId;
			if (!visited.has(connectedNodeId)) {
				this.depthFirstTraversal(connectedNodeId, visited, component);
			}
		}
	}

	// Node operations
	addNode(node: Omit<AnyNode, 'id' | 'createdAt' | 'updatedAt' | 'version'>): AnyNode {
		const newNode: AnyNode = AnyNodeSchema.parse({
			...node,
			id: uuidv4(),
			createdAt: new Date(),
			updatedAt: new Date(),
			version: '1.0.0',
		});

		this.updateGraph((graph: MemoryGraph) => ({
			...graph,
			nodes: [...graph.nodes, newNode],
			updatedAt: new Date(),
		}));

		this._changes.next({
			type: 'add',
			node: newNode,
		});

		this.updateGraphMetadata();
		return newNode;
	}

	updateNode(nodeId: string, updates: Partial<AnyNode>): AnyNode | null {
		const nodeIndex = this.nodes.findIndex(n => n.id === nodeId);
		if (nodeIndex === -1) return null;

		const currentNode = this.nodes[nodeIndex];
		const updatedNode: AnyNode = AnyNodeSchema.parse({
			...currentNode,
			...updates,
			id: nodeId, // Preserve ID
			updatedAt: new Date(),
			version: this.incrementVersion(currentNode.version),
		});

		this.updateGraph((graph: MemoryGraph) => ({
			...graph,
			nodes: graph.nodes.map(n => n.id === nodeId ? updatedNode : n),
			updatedAt: new Date(),
		}));

		this._changes.next({
			type: 'update',
			node: updatedNode,
			previousNode: currentNode,
		});

		this.updateGraphMetadata();
		return updatedNode;
	}

	removeNode(nodeId: string): boolean {
		const nodeIndex = this.nodes.findIndex(n => n.id === nodeId);
		if (nodeIndex === -1) return false;

		const nodeToRemove = this.nodes[nodeIndex];

		// Also remove any relationships involving this node
		const remainingRelationships = this.relationships.filter(
			r => r.fromNodeId !== nodeId && r.toNodeId !== nodeId
		);

		this.updateGraph((graph: MemoryGraph) => ({
			...graph,
			nodes: graph.nodes.filter(n => n.id !== nodeId),
			relationships: remainingRelationships,
			updatedAt: new Date(),
		}));

		this._changes.next({
			type: 'remove',
			node: nodeToRemove,
		});

		this.updateGraphMetadata();
		return true;
	}

	// Relationship operations
	addRelationship(relationship: Omit<Relationship, 'id'>): Relationship {
		const newRelationship: Relationship = RelationshipSchema.parse({
			...relationship,
			id: uuidv4(),
		});

		this.updateGraph((graph: MemoryGraph) => ({
			...graph,
			relationships: [...graph.relationships, newRelationship],
			updatedAt: new Date(),
		}));

		this._changes.next({
			type: 'add',
			relationship: newRelationship,
		});

		this.updateGraphMetadata();
		return newRelationship;
	}

	updateRelationship(relationshipId: string, updates: Partial<Relationship>): Relationship | null {
		const relIndex = this.relationships.findIndex(r => r.id === relationshipId);
		if (relIndex === -1) return null;

		const currentRel = this.relationships[relIndex];
		const updatedRel: Relationship = RelationshipSchema.parse({
			...currentRel,
			...updates,
			id: relationshipId, // Preserve ID
		});

		this.updateGraph((graph: MemoryGraph) => ({
			...graph,
			relationships: graph.relationships.map(r => r.id === relationshipId ? updatedRel : r),
			updatedAt: new Date(),
		}));

		this._changes.next({
			type: 'update',
			relationship: updatedRel,
			previousRelationship: currentRel,
		});

		this.updateGraphMetadata();
		return updatedRel;
	}

	removeRelationship(relationshipId: string): boolean {
		const relIndex = this.relationships.findIndex(r => r.id === relationshipId);
		if (relIndex === -1) return false;

		const relToRemove = this.relationships[relIndex];

		this.updateGraph((graph: MemoryGraph) => ({
			...graph,
			relationships: graph.relationships.filter(r => r.id !== relationshipId),
			updatedAt: new Date(),
		}));

		this._changes.next({
			type: 'remove',
			relationship: relToRemove,
		});

		this.updateGraphMetadata();
		return true;
	}

	// Query methods
	getNodeById(nodeId: string): AnyNode | undefined {
		return this.nodes.find(n => n.id === nodeId);
	}

	getNodesByType(nodeType: string): AnyNode[] {
		return this.nodes.filter(n => n.type === nodeType);
	}

	getRelationshipById(relationshipId: string): Relationship | undefined {
		return this.relationships.find(r => r.id === relationshipId);
	}

	getRelationshipsByType(relType: string): Relationship[] {
		return this.relationships.filter(r => r.type === relType);
	}

	getRelationshipsForNode(nodeId: string): Relationship[] {
		return this.relationships.filter(r => r.fromNodeId === nodeId || r.toNodeId === nodeId);
	}

	// Connected nodes
	getConnectedNodes(nodeId: string): AnyNode[] {
		const rels = this.getRelationshipsForNode(nodeId);
		const connectedNodeIds = rels.flatMap(r => {
			if (r.fromNodeId === nodeId) return [r.toNodeId];
			return [r.fromNodeId];
		});

		return this.nodes.filter(n => connectedNodeIds.includes(n.id));
	}

	// Get subgraph
	getSubgraph(nodeIds: string[]): { nodes: AnyNode[], relationships: Relationship[] } {
		// Get all nodes in the set
		const nodes = this.nodes.filter(n => nodeIds.includes(n.id));

		// Get all relationships between these nodes
		const relationships = this.relationships.filter(
			r => nodeIds.includes(r.fromNodeId) && nodeIds.includes(r.toNodeId)
		);

		return { nodes, relationships };
	}

	// Similar nodes based on connections and type
	findSimilarNodes(nodeId: string, limit = 5): AnyNode[] {
		const sourceNode = this.getNodeById(nodeId);
		if (!sourceNode) return [];

		// Get nodes of same type
		const sameTypeNodes = this.getNodesByType(sourceNode.type)
			.filter(n => n.id !== nodeId);

		// Get connected nodes
		const directlyConnected = this.getConnectedNodes(nodeId);

		// Calculate similarity score for each node
		const scoredNodes = sameTypeNodes.map(node => {
			// Start with base score
			let score = 0;

			// Increase score for shared connections
			const nodeConnections = this.getConnectedNodes(node.id);
			const sharedConnections = nodeConnections.filter(
				conn => directlyConnected.some(dc => dc.id === conn.id)
			);

			score += sharedConnections.length * 2;

			// Increase score for same name pattern
			if (node.name.includes(sourceNode.name) ||
				sourceNode.name.includes(node.name)) {
				score += 1;
			}

			return { node, score };
		});

		// Sort by score and take top results
		return scoredNodes
			.sort((a, b) => b.score - a.score)
			.slice(0, limit)
			.map(item => item.node);
	}

	// Search nodes by name or description
	searchNodes(query: string): AnyNode[] {
		const lowerQuery = query.toLowerCase();
		return this.nodes.filter(node =>
			node.name.toLowerCase().includes(lowerQuery) ||
			(node.description && node.description.toLowerCase().includes(lowerQuery))
		);
	}

	// Version helper
	private incrementVersion(version: string): string {
		const parts = version.split('.');
		const lastPart = parseInt(parts[parts.length - 1], 10);
		parts[parts.length - 1] = (lastPart + 1).toString();
		return parts.join('.');
	}

	// Clear graph
	clearGraph(): void {
		this.updateGraph((graph: MemoryGraph) => ({
			...graph,
			nodes: [],
			relationships: [],
			updatedAt: new Date(),
		}));

		this.updateGraphMetadata();
	}

	// Set project details
	setProjectInfo(name: string, description?: string): void {
		this.updateGraph((graph: MemoryGraph) => ({
			...graph,
			name,
			description,
			updatedAt: new Date(),
		}));
	}

	// Graph as JSON
	toJSON(): string {
		try {
			return JSON.stringify(this.currentGraph);
		} catch (error) {
			console.error('Failed to convert graph to JSON', error);
			return '{}';
		}
	}
}
