import { v4 as uuidv4 } from 'uuid';
import { Subject, BehaviorSubject, Observable, bufferTime, filter } from 'rxjs';
import {
	AnyNode,
	Relationship,
	MemoryGraph,
	MemoryGraphSchema,
	AnyNodeSchema,
	RelationshipSchema,
	GraphChange,
	NodeChange,
	RelationshipChange,
} from './schemas.js';
import {
	PersistenceAdapter,
	PersistenceOptions,
	createPersistenceAdapter,
} from './persistence/index.js';
import { MigrationSystem, createMigrationSystem } from './migrations/index.js';

/**
 * Memory Graph Engine - Core state management for AIDE
 * Provides reactive, immutable graph operations with event streaming
 */
export class MemoryGraphEngine {
	private _graph: BehaviorSubject<MemoryGraph>;
	private _changes: Subject<GraphChange>;
	private _bufferedChanges: Observable<GraphChange[]>;
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
					complexity: 0,
				},
			},
			settings: {
				autoSave: true,
				persistLocation: 'local',
			},
			...initialGraph,
		};

		this._graph = new BehaviorSubject(MemoryGraphSchema.parse(defaultGraph));
		this._changes = new Subject<GraphChange>();

		// Buffer changes to improve performance with high-frequency updates
		this._bufferedChanges = this._changes.pipe(
			bufferTime(300), // Buffer changes for 300ms
			filter(changes => changes.length > 0) // Only emit when there are changes
		);

		this._migrationSystem = createMigrationSystem();

		// Use provided adapter or create a default one
		this._persistenceAdapter =
			persistenceAdapter || createPersistenceAdapter('auto', persistenceOptions);

		// Setup auto-save if enabled
		if (this._autosaveEnabled) {
			this.setupAutoSave();
		}
	}

	// Configure auto-save behavior
	private setupAutoSave(intervalMinutes = 5): void {
		if (this._backupInterval) {
			clearInterval(this._backupInterval);
		}

		if (this._autosaveEnabled) {
			this._backupInterval = setInterval(
				() => {
					this.saveGraph().catch(err => console.error('Auto-save failed:', err));
				},
				intervalMinutes * 60 * 1000
			);
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
				autoSave: enabled,
			},
		}));
	}

	// Getter for graph changes observable
	get changes$(): Observable<GraphChange> {
		return this._changes.asObservable();
	}

	// Getter for buffered changes observable (more performant for UI updates)
	get bufferedChanges$(): Observable<GraphChange[]> {
		return this._bufferedChanges;
	}

	// Getter for the current graph
	get graph(): MemoryGraph {
		return this._graph.getValue();
	}

	// Getter for graph as observable
	get graph$(): Observable<MemoryGraph> {
		return this._graph.asObservable();
	}

	// Getters for current graph properties
	get nodes(): AnyNode[] {
		return this.graph.nodes;
	}

	get relationships(): Relationship[] {
		return this.graph.relationships;
	}

	get metadata() {
		return this.graph.metadata;
	}

	// Update graph utility method
	private updateGraph(updateFn: (graph: MemoryGraph) => MemoryGraph): void {
		const currentGraph = this._graph.getValue();
		const updatedGraph = updateFn(currentGraph);

		// Validate graph with schema before updating
		try {
			const validGraph = MemoryGraphSchema.parse(updatedGraph);
			this._graph.next(validGraph);
		} catch (error) {
			console.error('Invalid graph update:', error);
			throw new Error('Invalid graph structure after update');
		}
	}

	// Helper to update metadata stats
	private updateGraphMetadata(): void {
		this.updateGraph((graph: MemoryGraph) => ({
			...graph,
			updatedAt: new Date(),
			metadata: {
				...graph.metadata,
				lastInteractionAt: new Date(),
				stats: {
					nodeCount: graph.nodes.length,
					edgeCount: graph.relationships.length,
					complexity: this.calculateGraphComplexity(),
				},
			},
		}));
	}
	// Persistence operations
	async saveGraph(location?: string): Promise<boolean> {
		try {
			const result = await this._persistenceAdapter.save(this.graph);
			return result;
		} catch (error) {
			console.error('Failed to save graph:', error);
			return false;
		}
	}
	async loadGraph(location?: string): Promise<boolean> {
		try {
			const loadedGraph = await this._persistenceAdapter.load(location);

			if (loadedGraph) {
				// Check for version migration needs
				const needsMigration = this._migrationSystem.needsMigration(
					loadedGraph,
					this._currentSchemaVersion
				);
				const finalGraph = needsMigration
					? await this._migrationSystem.migrateGraph(loadedGraph, this._currentSchemaVersion)
					: loadedGraph;

				// Update the current graph
				this._graph.next(finalGraph);
				this.updateGraphMetadata();
				return true;
			}
			return false;
		} catch (error) {
			console.error('Failed to load graph:', error);
			return false;
		}
	}

	// Graph complexity calculation
	calculateGraphComplexity(): number {
		// Basic complexity - square root of (nodes * relationships)
		const nodeCount = this.nodes.length;
		const relCount = this.relationships.length;
		const rawComplexity = Math.sqrt(nodeCount * (relCount + 1));

		// Normalize to a 0-100 scale
		return Math.min(Math.round(rawComplexity * 5), 100);
	}

	// Node operations
	addNode(nodeData: Omit<AnyNode, 'id'>): AnyNode {
		const newNode: AnyNode = AnyNodeSchema.parse({
			...nodeData,
			id: uuidv4(),
			createdAt: nodeData.createdAt || new Date(),
			updatedAt: nodeData.updatedAt || new Date(),
			version: nodeData.version || '0.1.0',
		});

		this.updateGraph((graph: MemoryGraph) => ({
			...graph,
			nodes: [...graph.nodes, newNode],
			updatedAt: new Date(),
		}));

		const nodeChange: NodeChange = {
			type: 'add',
			node: newNode,
		};

		this._changes.next(nodeChange);
		this.updateGraphMetadata();
		return newNode;
	}

	updateNode(nodeId: string, updates: Partial<AnyNode>): AnyNode | null {
		const nodeIndex = this.nodes.findIndex(n => n.id === nodeId);
		if (nodeIndex === -1) return null;

		const currentNode = this.nodes[nodeIndex];
		if (!currentNode) return null;

		const updatedNode: AnyNode = AnyNodeSchema.parse({
			...currentNode,
			...updates,
			id: nodeId, // Preserve ID
			updatedAt: new Date(),
			version: this.incrementVersion(currentNode.version),
		});

		this.updateGraph((graph: MemoryGraph) => ({
			...graph,
			nodes: graph.nodes.map(n => (n.id === nodeId ? updatedNode : n)),
			updatedAt: new Date(),
		}));

		const nodeChange: NodeChange = {
			type: 'update',
			node: updatedNode,
			previousNode: currentNode,
		};

		this._changes.next(nodeChange);
		this.updateGraphMetadata();
		return updatedNode;
	}

	removeNode(nodeId: string): boolean {
		const nodeIndex = this.nodes.findIndex(n => n.id === nodeId);
		if (nodeIndex === -1) return false;

		const nodeToRemove = this.nodes[nodeIndex];
		if (!nodeToRemove) return false;

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

		const nodeChange: NodeChange = {
			type: 'remove',
			node: nodeToRemove,
		};

		this._changes.next(nodeChange);
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

		const relChange: RelationshipChange = {
			type: 'add',
			relationship: newRelationship,
		};

		this._changes.next(relChange);
		this.updateGraphMetadata();
		return newRelationship;
	}

	updateRelationship(relationshipId: string, updates: Partial<Relationship>): Relationship | null {
		const relIndex = this.relationships.findIndex(r => r.id === relationshipId);
		if (relIndex === -1) return null;

		const currentRel = this.relationships[relIndex];
		if (!currentRel) return null;

		const updatedRel: Relationship = RelationshipSchema.parse({
			...currentRel,
			...updates,
			id: relationshipId, // Preserve ID
		});

		this.updateGraph((graph: MemoryGraph) => ({
			...graph,
			relationships: graph.relationships.map(r => (r.id === relationshipId ? updatedRel : r)),
			updatedAt: new Date(),
		}));

		const relChange: RelationshipChange = {
			type: 'update',
			relationship: updatedRel,
			previousRelationship: currentRel,
		};

		this._changes.next(relChange);
		this.updateGraphMetadata();
		return updatedRel;
	}

	removeRelationship(relationshipId: string): boolean {
		const relIndex = this.relationships.findIndex(r => r.id === relationshipId);
		if (relIndex === -1) return false;

		const relToRemove = this.relationships[relIndex];
		if (!relToRemove) return false;

		this.updateGraph((graph: MemoryGraph) => ({
			...graph,
			relationships: graph.relationships.filter(r => r.id !== relationshipId),
			updatedAt: new Date(),
		}));

		const relChange: RelationshipChange = {
			type: 'remove',
			relationship: relToRemove,
		};

		this._changes.next(relChange);
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

	getRelationshipsForNode(nodeId: string): Relationship[] {
		return this.relationships.filter(r => r.fromNodeId === nodeId || r.toNodeId === nodeId);
	}

	getConnectedNodes(nodeId: string): AnyNode[] {
		const nodeRelationships = this.getRelationshipsForNode(nodeId);
		const connectedNodeIds = new Set<string>();

		for (const rel of nodeRelationships) {
			if (rel.fromNodeId === nodeId) {
				connectedNodeIds.add(rel.toNodeId);
			} else {
				connectedNodeIds.add(rel.fromNodeId);
			}
		}

		return this.nodes.filter(node => connectedNodeIds.has(node.id));
	}

	// Version control helpers
	private incrementVersion(version: string): string {
		if (!version) {
			return '0.0.1';
		}

		const parts = version.split('.');
		const lastPartIndex = parts.length - 1;

		if (lastPartIndex < 0 || !parts[lastPartIndex]) {
			// If version is empty or invalid, return a default
			return '0.0.1';
		}

		const lastPart = parseInt(parts[lastPartIndex], 10);

		if (isNaN(lastPart)) {
			// If version can't be parsed, just append .1
			return `${version}.1`;
		}

		parts[lastPartIndex] = (lastPart + 1).toString();
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
			return JSON.stringify(this.graph);
		} catch (error) {
			console.error('Failed to convert graph to JSON', error);
			return '{}';
		}
	}
}
