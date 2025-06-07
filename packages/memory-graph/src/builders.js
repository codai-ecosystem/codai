import { v4 as uuidv4 } from 'uuid';
/**
 * Memory Graph Builder utilities
 * Provides fluent APIs for creating and manipulating memory graph elements
 */
/**
 * Base node builder with core functionality
 */
export class NodeBuilder {
    constructor() {
        this.node = {
            id: uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date(),
            version: '1.0.0'
        };
    }
    withName(name) {
        this.node.name = name;
        return this;
    }
    withDescription(description) {
        this.node.description = description;
        return this;
    }
    withMetadata(metadata) {
        this.node.metadata = metadata;
        return this;
    }
    withVersion(version) {
        this.node.version = version;
        return this;
    }
    build() {
        if (!this.node.name) {
            throw new Error('Node name is required');
        }
        return this.node;
    }
    // Create and add to graph
    addToGraph(graph) {
        const node = this.build();
        return graph.addNode(node);
    }
}
/**
 * Feature node builder
 */
export class FeatureBuilder extends NodeBuilder {
    constructor(name) {
        super();
        this.node.type = 'feature';
        this.node.name = name;
        this.node.status = 'planned';
        this.node.priority = 'medium';
    }
    withStatus(status) {
        this.node.status = status;
        return this;
    }
    withPriority(priority) {
        this.node.priority = priority;
        return this;
    }
    withRequirements(requirements) {
        this.node.requirements = requirements;
        return this;
    }
    withAcceptanceCriteria(criteria) {
        this.node.acceptanceCriteria = criteria;
        return this;
    }
    withComplexity(complexity) {
        this.node.estimatedComplexity = complexity;
        return this;
    }
}
/**
 * Screen node builder
 */
export class ScreenBuilder extends NodeBuilder {
    constructor(name) {
        super();
        this.node.type = 'screen';
        this.node.name = name;
        this.node.screenType = 'page';
    }
    withScreenType(screenType) {
        this.node.screenType = screenType;
        return this;
    }
    withRoute(route) {
        this.node.route = route;
        return this;
    }
    withWireframe(wireframe) {
        this.node.wireframe = wireframe;
        return this;
    }
    withDesignSystem(designSystem) {
        this.node.designSystem = designSystem;
        return this;
    }
    withResponsiveBreakpoints(breakpoints) {
        this.node.responsiveBreakpoints = breakpoints;
        return this;
    }
    withAccessibilityLevel(level) {
        this.node.accessibilityLevel = level;
        return this;
    }
}
/**
 * Logic node builder
 */
export class LogicBuilder extends NodeBuilder {
    constructor(name) {
        super();
        this.node.type = 'logic';
        this.node.name = name;
        this.node.logicType = 'function';
    }
    withLogicType(logicType) {
        this.node.logicType = logicType;
        return this;
    }
    withInputs(inputs) {
        this.node.inputs = inputs;
        return this;
    }
    withOutputs(outputs) {
        this.node.outputs = outputs;
        return this;
    }
    withComplexity(complexity) {
        this.node.complexity = complexity;
        return this;
    }
    withTestCoverage(coverage) {
        this.node.testCoverage = coverage;
        return this;
    }
}
/**
 * Data node builder
 */
export class DataBuilder extends NodeBuilder {
    constructor(name) {
        super();
        this.node.type = 'data';
        this.node.name = name;
        this.node.dataType = 'model';
        this.node.structure = {};
        this.node.persistence = false;
    }
    withDataType(dataType) {
        this.node.dataType = dataType;
        return this;
    }
    withStructure(structure) {
        this.node.structure = structure;
        return this;
    }
    withValidation(validation) {
        this.node.validation = validation;
        return this;
    }
    withPersistence(persistence) {
        this.node.persistence = persistence;
        return this;
    }
}
/**
 * API node builder
 */
export class ApiBuilder extends NodeBuilder {
    constructor(name) {
        super();
        this.node.type = 'api';
        this.node.name = name;
    }
    withMethod(method) {
        this.node.method = method;
        return this;
    }
    withPath(path) {
        this.node.path = path;
        return this;
    }
    withRequest(request) {
        this.node.request = request;
        return this;
    }
    withResponse(response) {
        this.node.response = response;
        return this;
    }
    withAuthentication(auth) {
        this.node.authentication = auth;
        return this;
    }
    withRateLimiting(enabled) {
        this.node.rateLimiting = enabled;
        return this;
    }
}
/**
 * Test node builder
 */
export class TestBuilder extends NodeBuilder {
    constructor(name) {
        super();
        this.node.type = 'test';
        this.node.name = name;
        this.node.testType = 'unit';
        this.node.status = 'pending';
    }
    withTestType(testType) {
        this.node.testType = testType;
        return this;
    }
    withStatus(status) {
        this.node.status = status;
        return this;
    }
    withCoverage(coverage) {
        this.node.coverage = coverage;
        return this;
    }
    withImplementation(implementation) {
        this.node.implementation = implementation;
        return this;
    }
}
/**
 * Decision node builder
 */
export class DecisionBuilder extends NodeBuilder {
    constructor(name) {
        super();
        this.node.type = 'decision';
        this.node.name = name;
        this.node.options = [];
        this.node.selectedOption = 0;
        this.node.rationale = '';
        this.node.impact = 'medium';
    }
    withOptions(options) {
        this.node.options = options;
        return this;
    }
    withSelectedOption(index) {
        this.node.selectedOption = index;
        return this;
    }
    withRationale(rationale) {
        this.node.rationale = rationale;
        return this;
    }
    withImpact(impact) {
        this.node.impact = impact;
        return this;
    }
    withStakeholders(stakeholders) {
        this.node.stakeholders = stakeholders;
        return this;
    }
}
/**
 * Intent node builder
 */
export class IntentBuilder extends NodeBuilder {
    constructor(name) {
        super();
        this.node.type = 'intent';
        this.node.name = name;
        this.node.category = 'goal';
        this.node.priority = 'medium';
        this.node.status = 'active';
    }
    withCategory(category) {
        this.node.category = category;
        return this;
    }
    withPriority(priority) {
        this.node.priority = priority;
        return this;
    }
    withStatus(status) {
        this.node.status = status;
        return this;
    }
    withContext(context) {
        this.node.context = context;
        return this;
    }
}
/**
 * Conversation node builder
 */
export class ConversationBuilder extends NodeBuilder {
    constructor(name) {
        super();
        this.node.type = 'conversation';
        this.node.name = name;
        this.node.messages = [];
        this.node.summary = '';
    }
    withMessages(messages) {
        this.node.messages = messages;
        return this;
    }
    addMessage(role, content) {
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
    withSummary(summary) {
        this.node.summary = summary;
        return this;
    }
    withTags(tags) {
        this.node.tags = tags;
        return this;
    }
}
/**
 * Relationship builder
 */
export class RelationshipBuilder {
    constructor(fromNodeId, toNodeId, type) {
        this.relationship = {
            id: uuidv4()
        };
        this.relationship.fromNodeId = fromNodeId;
        this.relationship.toNodeId = toNodeId;
        this.relationship.type = type;
        this.relationship.createdAt = new Date();
    }
    withStrength(strength) {
        this.relationship.strength = strength;
        return this;
    }
    withMetadata(metadata) {
        this.relationship.metadata = metadata;
        return this;
    }
    build() {
        return this.relationship;
    }
    // Create and add to graph
    addToGraph(graph) {
        const relationship = this.build();
        return graph.addRelationship(relationship);
    }
}
/**
 * Factory for creating builders
 */
export class GraphBuilders {
    static feature(name) {
        return new FeatureBuilder(name);
    }
    static screen(name) {
        return new ScreenBuilder(name);
    }
    static logic(name) {
        return new LogicBuilder(name);
    }
    static data(name) {
        return new DataBuilder(name);
    }
    static api(name) {
        return new ApiBuilder(name);
    }
    static test(name) {
        return new TestBuilder(name);
    }
    static decision(name) {
        return new DecisionBuilder(name);
    }
    static intent(name) {
        return new IntentBuilder(name);
    }
    static conversation(name) {
        return new ConversationBuilder(name);
    }
    static relationship(fromNodeId, toNodeId, type) {
        return new RelationshipBuilder(fromNodeId, toNodeId, type);
    }
}
