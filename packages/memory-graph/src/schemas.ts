import { z } from 'zod';

/**
 * Core memory graph schemas for AIDE
 * This replaces traditional source files with a structured intent graph
 */

// Base node schema
export const NodeSchema = z.object({
	id: z.string(),
	type: z.string(),
	name: z.string(),
	description: z.string().optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
	version: z.string(),
	metadata: z.record(z.unknown()).optional(),
});

// Relationship schema
export const RelationshipSchema = z.object({
	id: z.string(),
	fromNodeId: z.string(),
	toNodeId: z.string(),
	type: z.enum(['contains', 'depends_on', 'implements', 'extends', 'uses', 'configures', 'tests', 'derives_from', 'relates_to', 'influences']),
	strength: z.number().min(0).max(1).default(1), // Relationship strength/confidence
	metadata: z.record(z.unknown()).optional(),
	createdAt: z.date().default(() => new Date()),
});

// Intent node - user intentions and goals
export const IntentNodeSchema = NodeSchema.extend({
	type: z.literal('intent'),
	category: z.enum(['goal', 'requirement', 'constraint', 'preference']),
	priority: z.enum(['low', 'medium', 'high', 'critical']),
	status: z.enum(['active', 'completed', 'deferred', 'abandoned']),
	context: z.string().optional(),
});

// Feature node - high-level functionality
export const FeatureNodeSchema = NodeSchema.extend({
	type: z.literal('feature'),
	status: z.enum(['planned', 'in_progress', 'implemented', 'tested', 'deployed']),
	priority: z.enum(['low', 'medium', 'high', 'critical']),
	requirements: z.array(z.string()).optional(),
	acceptanceCriteria: z.array(z.string()).optional(),
	estimatedComplexity: z.number().min(1).max(10).optional(),
});

// Screen/UI node - user interface components
export const ScreenNodeSchema = NodeSchema.extend({
	type: z.literal('screen'),
	screenType: z.enum(['page', 'component', 'modal', 'layout']),
	route: z.string().optional(),
	wireframe: z.string().optional(), // Base64 encoded image or SVG
	designSystem: z.record(z.unknown()).optional(),
	responsiveBreakpoints: z.array(z.string()).optional(),
	accessibilityLevel: z.enum(['A', 'AA', 'AAA']).optional(),
});

// Logic node - business logic and functions
export const LogicNodeSchema = NodeSchema.extend({
	type: z.literal('logic'),
	logicType: z.enum(['function', 'class', 'hook', 'service', 'utility', 'middleware']),
	inputs: z.array(z.object({
		name: z.string(),
		type: z.string(),
		required: z.boolean().default(true),
		description: z.string().optional(),
	})).optional(),
	outputs: z.array(z.object({
		name: z.string(),
		type: z.string(),
		description: z.string().optional(),
	})).optional(),
	complexity: z.number().min(1).max(10).optional(),
	testCoverage: z.number().min(0).max(100).optional(),
});

// Data node - data structures and models
export const DataNodeSchema = NodeSchema.extend({
	type: z.literal('data'),
	dataType: z.enum(['model', 'schema', 'enum', 'type', 'interface', 'dto']),
	structure: z.record(z.unknown()),
	validation: z.array(z.string()).optional(),
	persistence: z.boolean().default(false),
});

// Decision node - design decisions and trade-offs
export const DecisionNodeSchema = NodeSchema.extend({
	type: z.literal('decision'),
	options: z.array(z.object({
		description: z.string(),
		pros: z.array(z.string()),
		cons: z.array(z.string()),
	})),
	selectedOption: z.number(),
	rationale: z.string(),
	impact: z.enum(['low', 'medium', 'high', 'critical']),
	stakeholders: z.array(z.string()).optional(),
});

// Conversation node - key parts of the development conversation
export const ConversationNodeSchema = NodeSchema.extend({
	type: z.literal('conversation'),
	messages: z.array(z.object({
		role: z.enum(['user', 'assistant', 'system']),
		content: z.string(),
		timestamp: z.date(),
	})),
	summary: z.string(),
	tags: z.array(z.string()).optional(),
});

// Test node - test cases
export const TestNodeSchema = NodeSchema.extend({
	type: z.literal('test'),
	testType: z.enum(['unit', 'integration', 'e2e', 'performance', 'accessibility']),
	status: z.enum(['pending', 'passing', 'failing', 'skipped']),
	coverage: z.array(z.string()).optional(), // IDs of nodes being tested
	implementation: z.string().optional(), // Actual test code
});

// API node - external interfaces
export const ApiNodeSchema = NodeSchema.extend({
	type: z.literal('api'),
	method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']).optional(),
	path: z.string().optional(),
	request: z.record(z.unknown()).optional(),
	response: z.record(z.unknown()).optional(),
	authentication: z.string().optional(),
	rateLimiting: z.boolean().default(false),
});

// Union type for all node types
export const AnyNodeSchema = z.discriminatedUnion('type', [
	FeatureNodeSchema,
	ScreenNodeSchema,
	LogicNodeSchema,
	DataNodeSchema,
	ApiNodeSchema,
	TestNodeSchema,
	DecisionNodeSchema,
	IntentNodeSchema,
	ConversationNodeSchema,
]);

// Memory graph structure
export const MemoryGraphSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().optional(),
	version: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
	projectType: z.enum(['web', 'mobile', 'desktop', 'backend', 'fullstack', 'library']).optional(),
	nodes: z.array(AnyNodeSchema),
	relationships: z.array(RelationshipSchema),
	metadata: z.object({
		aiProvider: z.string().optional(),
		lastInteractionAt: z.date().optional(),
		tags: z.array(z.string()).optional(),
		stats: z.object({
			nodeCount: z.number().optional(),
			edgeCount: z.number().optional(),
			complexity: z.number().optional(),
		}).optional(),
		collaborators: z.array(z.string()).optional(),
		repositoryUrl: z.string().optional(),
	}).optional(),
	settings: z.object({
		autoSave: z.boolean().default(true),
		persistLocation: z.string().optional(),
		backupFrequency: z.number().optional(), // Minutes
	}).optional(),
});

// Export types from schemas
export type MemoryGraph = z.infer<typeof MemoryGraphSchema>;
export type Relationship = z.infer<typeof RelationshipSchema>;
export type AnyNode = z.infer<typeof AnyNodeSchema>;
export type FeatureNode = z.infer<typeof FeatureNodeSchema>;
export type ScreenNode = z.infer<typeof ScreenNodeSchema>;
export type LogicNode = z.infer<typeof LogicNodeSchema>;
export type DataNode = z.infer<typeof DataNodeSchema>;
export type ApiNode = z.infer<typeof ApiNodeSchema>;
export type TestNode = z.infer<typeof TestNodeSchema>;
export type DecisionNode = z.infer<typeof DecisionNodeSchema>;
export type IntentNode = z.infer<typeof IntentNodeSchema>;
export type ConversationNode = z.infer<typeof ConversationNodeSchema>;

// Graph change event types
export type NodeChangeType = 'add' | 'update' | 'remove';
export type RelationshipChangeType = 'add' | 'update' | 'remove';

export interface NodeChange {
	type: NodeChangeType;
	node: AnyNode;
	previousNode?: AnyNode | null;
}

export interface RelationshipChange {
	type: RelationshipChangeType;
	relationship: Relationship;
	previousRelationship?: Relationship | null;
}

export type GraphChange = NodeChange | RelationshipChange;
