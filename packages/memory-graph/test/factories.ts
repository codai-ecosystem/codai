/**
 * Test factory functions to create valid nodes and relationships for tests
 */

import { FeatureNode, TestNode, LogicNode, DataNode, ApiNode, Relationship } from '../src/schemas';

/**
 * Creates a feature node with all required properties
 */
export function createFeatureNode(
	overrides: Partial<Omit<FeatureNode, 'id'>> = {}
): Omit<FeatureNode, 'id'> {
	return {
		type: 'feature',
		name: 'Test Feature',
		status: 'planned',
		priority: 'medium',
		createdAt: new Date(),
		updatedAt: new Date(),
		version: '0.1.0',
		...overrides,
	};
}

/**
 * Creates a test node with all required properties
 */
export function createTestNode(
	overrides: Partial<Omit<TestNode, 'id'>> = {}
): Omit<TestNode, 'id'> {
	return {
		type: 'test',
		name: 'Test Case',
		testType: 'unit',
		status: 'pending',
		createdAt: new Date(),
		updatedAt: new Date(),
		version: '0.1.0',
		coverage: [],
		...overrides,
	};
}

/**
 * Creates a logic node with all required properties
 */
export function createLogicNode(
	overrides: Partial<Omit<LogicNode, 'id'>> = {}
): Omit<LogicNode, 'id'> {
	return {
		type: 'logic',
		name: 'Test Logic',
		logicType: 'function',
		createdAt: new Date(),
		updatedAt: new Date(),
		version: '0.1.0',
		...overrides,
	};
}

/**
 * Creates a data node with all required properties
 */
export function createDataNode(
	overrides: Partial<Omit<DataNode, 'id'>> = {}
): Omit<DataNode, 'id'> {
	return {
		type: 'data',
		name: 'Test Data',
		dataType: 'model',
		structure: {},
		persistence: false,
		createdAt: new Date(),
		updatedAt: new Date(),
		version: '0.1.0',
		...overrides,
	};
}

/**
 * Creates an API node with all required properties
 */
export function createApiNode(overrides: Partial<Omit<ApiNode, 'id'>> = {}): Omit<ApiNode, 'id'> {
	return {
		type: 'api',
		name: 'Test API',
		rateLimiting: false,
		createdAt: new Date(),
		updatedAt: new Date(),
		version: '0.1.0',
		...overrides,
	};
}

/**
 * Creates a relationship with required properties
 */
export function createRelationship(
	overrides: Partial<Omit<Relationship, 'id'>>
): Omit<Relationship, 'id'> {
	return {
		fromNodeId: 'test-from-id',
		toNodeId: 'test-to-id',
		type: 'relates_to',
		strength: 1.0,
		createdAt: new Date(),
		...overrides,
	};
}
