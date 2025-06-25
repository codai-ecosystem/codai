import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryGraphEngine } from '../src/engine';
import { createFeatureNode, createTestNode } from './factories';

// Mock the persistence adapter to avoid actual file operations in tests
vi.mock('../src/persistence', () => {
	return {
		createPersistenceAdapter: () => ({
			save: vi.fn().mockResolvedValue(true),
			load: vi.fn().mockResolvedValue({
				id: 'test-id',
				name: 'Persistent Feature',
				version: '0.2.0',
				createdAt: new Date(),
				updatedAt: new Date(),
				nodes: [
					{
						id: 'node-1',
						type: 'feature',
						name: 'Persistent Feature',
						status: 'planned',
						priority: 'high',
						createdAt: new Date(),
						updatedAt: new Date(),
						version: '1.0.0',
					},
				],
				relationships: [],
				metadata: {
					aiProvider: 'test',
					lastInteractionAt: new Date(),
					tags: [],
					stats: { nodeCount: 1, edgeCount: 0, complexity: 0 },
				},
				settings: { autoSave: true },
			}),
			exportGraph: vi.fn().mockResolvedValue('{}'),
			importGraph: vi.fn().mockResolvedValue(true),
		}),
	};
});

// Mock the migration system
vi.mock('../src/migrations', () => {
	return {
		createMigrationSystem: () => ({
			needsMigration: vi.fn().mockReturnValue(false),
			migrateGraph: vi.fn().mockImplementation(graph => graph),
		}),
	};
});

describe('MemoryGraphEngine', () => {
	let engine: MemoryGraphEngine;

	beforeEach(() => {
		// Create a new engine instance for each test
		engine = new MemoryGraphEngine();
	});

	it('should create a default graph when initialized', () => {
		const graph = engine.graph;

		expect(graph).toBeDefined();
		expect(graph.id).toBeDefined();
		expect(graph.name).toBe('New AIDE Project');
		expect(graph.nodes).toEqual([]);
		expect(graph.relationships).toEqual([]);
		expect(graph.version).toBe('0.2.0');
	});
	it('should add and retrieve nodes', () => {
		// Add a feature node
		const newNode = engine.addNode(
			createFeatureNode({
				name: 'Test Feature',
			})
		);

		// Check that the node was added
		expect(newNode).toBeDefined();
		expect(newNode.id).toBeDefined();
		expect(newNode.name).toBe('Test Feature');
		expect(newNode.type).toBe('feature');

		// Check that we can retrieve the node
		const retrievedNode = engine.getNodeById(newNode.id);
		expect(retrievedNode).toEqual(newNode);

		// Check that the graph was updated
		expect(engine.nodes.length).toBe(1);
		expect(engine.nodes[0]).toEqual(newNode);
	});
	it('should update nodes correctly', () => {
		// Add a node first
		const node = engine.addNode(
			createFeatureNode({
				name: 'Original Feature',
			})
		);

		// Now update it
		const updatedNode = engine.updateNode(node.id, {
			name: 'Updated Feature',
			priority: 'high' as const,
		});

		// Check the update worked
		expect(updatedNode).toBeDefined();
		if (updatedNode && updatedNode.type === 'feature') {
			// TypeScript check
			expect(updatedNode.name).toBe('Updated Feature');
			expect(updatedNode.priority).toBe('high');
			expect(updatedNode.version).not.toBe(node.version); // Version should be incremented
		}

		// Check the stored node was updated
		const retrievedNode = engine.getNodeById(node.id);
		expect(retrievedNode?.name).toBe('Updated Feature');
	});
	it('should remove nodes', () => {
		// Add a node
		const node = engine.addNode(
			createFeatureNode({
				name: 'Feature to Remove',
			})
		);

		// Verify it exists
		expect(engine.nodes.length).toBe(1);

		// Remove it
		const result = engine.removeNode(node.id);

		// Check it was removed
		expect(result).toBe(true);
		expect(engine.nodes.length).toBe(0);
		expect(engine.getNodeById(node.id)).toBeUndefined();
	});
	it('should handle version incrementing correctly', () => {
		// Test with standard version
		const node = engine.addNode(
			createFeatureNode({
				name: 'Version Test',
				version: '1.2.3',
			})
		);

		const updated = engine.updateNode(node.id, { name: 'Updated' });
		if (updated) {
			expect(updated.version).toBe('1.2.4');
		}

		// Update again to test multiple increments
		const updatedAgain = engine.updateNode(node.id, { name: 'Updated Again' });
		if (updatedAgain) {
			expect(updatedAgain.version).toBe('1.2.5');
		}
	});
	it('should handle relationships between nodes', () => {
		// Add two nodes
		const featureNode = engine.addNode(
			createFeatureNode({
				name: 'Parent Feature',
				priority: 'high',
			})
		);

		const testNode = engine.addNode(
			createTestNode({
				name: 'Feature Test',
				testType: 'unit',
				status: 'pending',
				coverage: ['feature-1'],
			})
		);

		// Create a relationship
		const relationship = engine.addRelationship({
			fromNodeId: testNode.id,
			toNodeId: featureNode.id,
			type: 'tests' as const,
			strength: 1.0,
			createdAt: new Date(),
		});

		// Verify the relationship
		expect(relationship).toBeDefined();
		expect(relationship.id).toBeDefined();
		expect(relationship.type).toBe('tests');
		expect(relationship.fromNodeId).toBe(testNode.id);
		expect(relationship.toNodeId).toBe(featureNode.id);

		// Check the relationships were stored
		expect(engine.relationships.length).toBe(1);

		// Test finding relationships
		const relatedToFeature = engine.getRelationshipsForNode(featureNode.id);
		expect(relatedToFeature.length).toBe(1);
		expect(relatedToFeature[0].id).toBe(relationship.id);
	});

	it('should handle loading the graph', async () => {
		// Load the graph using our mocked persistence adapter
		const loaded = await engine.loadGraph();
		expect(loaded).toBe(true);

		// Check the data was loaded
		expect(engine.nodes.length).toBe(1);
		expect(engine.nodes[0].name).toBe('Persistent Feature');
	});
	it('should calculate graph complexity', () => {
		// Add some data
		engine.addNode(
			createFeatureNode({
				name: 'Feature 1',
				status: 'planned',
				priority: 'high',
			})
		);

		engine.addNode(
			createFeatureNode({
				name: 'Feature 2',
				status: 'planned',
				priority: 'medium',
			})
		);

		// Complexity should be calculated
		const complexity = engine.calculateGraphComplexity();
		expect(complexity).toBeGreaterThanOrEqual(0);
		expect(complexity).toBeLessThanOrEqual(100);
	});
});
