import { v4 as uuidv4 } from 'uuid';
import {
	AnyNode,
	FeatureNode,
	ScreenNode,
	LogicNode,
	DataNode,
	ApiNode,
	TestNode,
	DecisionNode,
	IntentNode,
	ConversationNode,
	Relationship
} from './schemas.js';
import { MemoryGraphEngine } from './engine.js';

/**
 * Memory Graph Builder utilities
 * Provides fluent APIs for creating and manipulating memory graph elements
 */

/**
 * Base node builder with core functionality
 */
export abstract class NodeBuilder<T extends AnyNode> {
	protected node: Partial<T>;

	constructor() {
		this.node = {
			id: uuidv4(),
			createdAt: new Date(),
			updatedAt: new Date(),
			version: '1.0.0'
		} as Partial<T>;
	}

	withName(name: string): this {
		this.node.name = name;
		return this;
	}

	withDescription(description: string): this {
		this.node.description = description;
		return this;
	}

	withMetadata(metadata: Record<string, unknown>): this {
		this.node.metadata = metadata;
		return this;
	}

	withVersion(version: string): this {
		this.node.version = version;
		return this;
	}

	build(): T {
		if (!this.node.name) {
			throw new Error('Node name is required');
		}
		return this.node as T;
	}

	// Create and add to graph
	addToGraph(graph: MemoryGraphEngine): T {
		const node = this.build();
		return graph.addNode(node as AnyNode) as T;
	}
}

/**
 * Feature node builder
 */
export class FeatureBuilder extends NodeBuilder<FeatureNode> {
	constructor(name: string) {
		super();
		this.node.type = 'feature';
		this.node.name = name;
		this.node.status = 'planned';
		this.node.priority = 'medium';
	}

	withStatus(status: FeatureNode['status']): this {
		this.node.status = status;
		return this;
	}

	withPriority(priority: FeatureNode['priority']): this {
		this.node.priority = priority;
		return this;
	}

	withRequirements(requirements: string[]): this {
		this.node.requirements = requirements;
		return this;
	}

	withAcceptanceCriteria(criteria: string[]): this {
		this.node.acceptanceCriteria = criteria;
		return this;
	}

	withComplexity(complexity: number): this {
		this.node.estimatedComplexity = complexity;
		return this;
	}
}

/**
 * Screen node builder
 */
export class ScreenBuilder extends NodeBuilder<ScreenNode> {
	constructor(name: string) {
		super();
		this.node.type = 'screen';
		this.node.name = name;
		this.node.screenType = 'page';
	}

	withScreenType(screenType: ScreenNode['screenType']): this {
		this.node.screenType = screenType;
		return this;
	}

	withRoute(route: string): this {
		this.node.route = route;
		return this;
	}

	withWireframe(wireframe: string): this {
		this.node.wireframe = wireframe;
		return this;
	}

	withDesignSystem(designSystem: Record<string, unknown>): this {
		this.node.designSystem = designSystem;
		return this;
	}

	withResponsiveBreakpoints(breakpoints: string[]): this {
		this.node.responsiveBreakpoints = breakpoints;
		return this;
	}

	withAccessibilityLevel(level: ScreenNode['accessibilityLevel']): this {
		this.node.accessibilityLevel = level;
		return this;
	}
}

/**
 * Logic node builder
 */
export class LogicBuilder extends NodeBuilder<LogicNode> {
	constructor(name: string) {
		super();
		this.node.type = 'logic';
		this.node.name = name;
		this.node.logicType = 'function';
	}

	withLogicType(logicType: LogicNode['logicType']): this {
		this.node.logicType = logicType;
		return this;
	}

	withInputs(inputs: LogicNode['inputs']): this {
		this.node.inputs = inputs;
		return this;
	}

	withOutputs(outputs: LogicNode['outputs']): this {
		this.node.outputs = outputs;
		return this;
	}

	withComplexity(complexity: number): this {
		this.node.complexity = complexity;
		return this;
	}

	withTestCoverage(coverage: number): this {
		this.node.testCoverage = coverage;
		return this;
	}
}

/**
 * Data node builder
 */
export class DataBuilder extends NodeBuilder<DataNode> {
	constructor(name: string) {
		super();
		this.node.type = 'data';
		this.node.name = name;
		this.node.dataType = 'model';
		this.node.structure = {};
		this.node.persistence = false;
	}

	withDataType(dataType: DataNode['dataType']): this {
		this.node.dataType = dataType;
		return this;
	}

	withStructure(structure: Record<string, unknown>): this {
		this.node.structure = structure;
		return this;
	}

	withValidation(validation: string[]): this {
		this.node.validation = validation;
		return this;
	}

	withPersistence(persistence: boolean): this {
		this.node.persistence = persistence;
		return this;
	}
}

/**
 * API node builder
 */
export class ApiBuilder extends NodeBuilder<ApiNode> {
	constructor(name: string) {
		super();
		this.node.type = 'api';
		this.node.name = name;
	}

	withMethod(method: ApiNode['method']): this {
		this.node.method = method;
		return this;
	}

	withPath(path: string): this {
		this.node.path = path;
		return this;
	}

	withRequest(request: Record<string, unknown>): this {
		this.node.request = request;
		return this;
	}

	withResponse(response: Record<string, unknown>): this {
		this.node.response = response;
		return this;
	}

	withAuthentication(auth: string): this {
		this.node.authentication = auth;
		return this;
	}

	withRateLimiting(enabled: boolean): this {
		this.node.rateLimiting = enabled;
		return this;
	}
}

/**
 * Test node builder
 */
export class TestBuilder extends NodeBuilder<TestNode> {
	constructor(name: string) {
		super();
		this.node.type = 'test';
		this.node.name = name;
		this.node.testType = 'unit';
		this.node.status = 'pending';
	}

	withTestType(testType: TestNode['testType']): this {
		this.node.testType = testType;
		return this;
	}

	withStatus(status: TestNode['status']): this {
		this.node.status = status;
		return this;
	}

	withCoverage(coverage: string[]): this {
		this.node.coverage = coverage;
		return this;
	}

	withImplementation(implementation: string): this {
		this.node.implementation = implementation;
		return this;
	}
}

/**
 * Decision node builder
 */
export class DecisionBuilder extends NodeBuilder<DecisionNode> {
	constructor(name: string) {
		super();
		this.node.type = 'decision';
		this.node.name = name;
		this.node.options = [];
		this.node.selectedOption = 0;
		this.node.rationale = '';
		this.node.impact = 'medium';
	}

	withOptions(options: DecisionNode['options']): this {
		this.node.options = options;
		return this;
	}

	withSelectedOption(index: number): this {
		this.node.selectedOption = index;
		return this;
	}

	withRationale(rationale: string): this {
		this.node.rationale = rationale;
		return this;
	}

	withImpact(impact: DecisionNode['impact']): this {
		this.node.impact = impact;
		return this;
	}

	withStakeholders(stakeholders: string[]): this {
		this.node.stakeholders = stakeholders;
		return this;
	}
}

/**
 * Intent node builder
 */
export class IntentBuilder extends NodeBuilder<IntentNode> {
	constructor(name: string) {
		super();
		this.node.type = 'intent';
		this.node.name = name;
		this.node.category = 'goal';
		this.node.priority = 'medium';
		this.node.status = 'active';
	}

	withCategory(category: IntentNode['category']): this {
		this.node.category = category;
		return this;
	}

	withPriority(priority: IntentNode['priority']): this {
		this.node.priority = priority;
		return this;
	}

	withStatus(status: IntentNode['status']): this {
		this.node.status = status;
		return this;
	}

	withContext(context: string): this {
		this.node.context = context;
		return this;
	}
}

/**
 * Conversation node builder
 */
export class ConversationBuilder extends NodeBuilder<ConversationNode> {
	constructor(name: string) {
		super();
		this.node.type = 'conversation';
		this.node.name = name;
		this.node.messages = [];
		this.node.summary = '';
	}

	withMessages(messages: ConversationNode['messages']): this {
		this.node.messages = messages;
		return this;
	}

	addMessage(role: 'user' | 'assistant' | 'system', content: string): this {
		this.node.messages = [
			...(this.node.messages || []),
			{
				role,
				content,
				timestamp: new Date()
			}
		];
		return this;
	}

	withSummary(summary: string): this {
		this.node.summary = summary;
		return this;
	}

	withTags(tags: string[]): this {
		this.node.tags = tags;
		return this;
	}
}

/**
 * Relationship builder
 */
export class RelationshipBuilder {
	private relationship: Partial<Relationship> = {
		id: uuidv4()
	};

	constructor(fromNodeId: string, toNodeId: string, type: Relationship['type']) {
		this.relationship.fromNodeId = fromNodeId;
		this.relationship.toNodeId = toNodeId;
		this.relationship.type = type;
		this.relationship.createdAt = new Date();
	}

	withStrength(strength: number): this {
		this.relationship.strength = strength;
		return this;
	}

	withMetadata(metadata: Record<string, unknown>): this {
		this.relationship.metadata = metadata;
		return this;
	}

	build(): Relationship {
		return this.relationship as Relationship;
	}

	// Create and add to graph
	addToGraph(graph: MemoryGraphEngine): Relationship {
		const relationship = this.build();
		return graph.addRelationship(relationship);
	}
}

/**
 * Factory for creating builders
 */
export class GraphBuilders {
	static feature(name: string): FeatureBuilder {
		return new FeatureBuilder(name);
	}

	static screen(name: string): ScreenBuilder {
		return new ScreenBuilder(name);
	}

	static logic(name: string): LogicBuilder {
		return new LogicBuilder(name);
	}

	static data(name: string): DataBuilder {
		return new DataBuilder(name);
	}

	static api(name: string): ApiBuilder {
		return new ApiBuilder(name);
	}

	static test(name: string): TestBuilder {
		return new TestBuilder(name);
	}

	static decision(name: string): DecisionBuilder {
		return new DecisionBuilder(name);
	}

	static intent(name: string): IntentBuilder {
		return new IntentBuilder(name);
	}

	static conversation(name: string): ConversationBuilder {
		return new ConversationBuilder(name);
	}

	static relationship(
		fromNodeId: string,
		toNodeId: string,
		type: Relationship['type']
	): RelationshipBuilder {
		return new RelationshipBuilder(fromNodeId, toNodeId, type);
	}
}
