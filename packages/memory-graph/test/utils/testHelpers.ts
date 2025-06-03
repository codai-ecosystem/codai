/**
 * Test utilities for creating test data for memory graph components
 */
import { vi } from 'vitest';
import type { AnyNode, FeatureNode, ScreenNode, LogicNode, DataModel, ApiNode, TestNode, Relationship } from '../../src/schemas';

const createBaseNodeData = () => ({
	createdAt: new Date('2024-01-01'),
	updatedAt: new Date('2024-01-01'),
	version: '1.0.0',
});

export const createFeatureNode = (overrides: Partial<FeatureNode> = {}): FeatureNode => ({
	...createBaseNodeData(),
	id: 'feature-1',
	type: 'feature',
	name: 'User Authentication',
	description: 'Complete user authentication system',
	status: 'in_progress',
	priority: 'high',
	requirements: ['Login page', 'JWT tokens', 'Password reset'],
	...overrides,
});

export const createScreenNode = (overrides: Partial<ScreenNode> = {}): ScreenNode => ({
	...createBaseNodeData(),
	id: 'screen-1',
	type: 'screen',
	name: 'Login Page',
	description: 'User login interface',
	screenType: 'page',
	route: '/login',
	...overrides,
});

export const createLogicNode = (overrides: Partial<LogicNode> = {}): LogicNode => ({
	...createBaseNodeData(),
	id: 'logic-1',
	type: 'logic',
	name: 'AuthService',
	description: 'Authentication business logic',
	logicType: 'service',
	...overrides,
});

export const createDataModelNode = (overrides: Partial<DataModel> = {}): DataModel => ({
	...createBaseNodeData(),
	id: 'data-1',
	type: 'data_model',
	name: 'User',
	description: 'User data model',
	modelType: 'entity',
	fields: [
		{
			name: 'id',
			type: 'string',
			required: true,
			unique: true,
		},
		{
			name: 'email',
			type: 'string',
			required: true,
			unique: true,
		},
	],
	...overrides,
});

export const createApiNode = (overrides: Partial<ApiNode> = {}): ApiNode => ({
	...createBaseNodeData(),
	id: 'api-1',
	type: 'api',
	name: 'Auth API',
	description: 'Authentication API endpoints',
	method: 'POST',
	path: '/api/auth/login',
	...overrides,
});

export const createTestNode = (overrides: Partial<TestNode> = {}): TestNode => ({
	...createBaseNodeData(),
	id: 'test-1',
	type: 'test',
	name: 'Auth Tests',
	description: 'Authentication unit tests',
	testType: 'unit',
	testCases: [
		{
			name: 'should authenticate valid user',
			description: 'Test successful authentication',
			action: 'login with valid credentials',
			expected: 'returns auth token',
		},
	],
	coverage: 85,
	...overrides,
});

export const createMockNodeUpdateHandler = () => {
	const handler = vi.fn();
	return handler;
};

export const createRelationship = (overrides: Partial<Relationship> = {}): Relationship => ({
	id: 'rel-1',
	fromNodeId: 'node-1',
	toNodeId: 'node-2',
	type: 'contains',
	...overrides,
});

// Re-export vi for convenience
export { vi } from 'vitest';
