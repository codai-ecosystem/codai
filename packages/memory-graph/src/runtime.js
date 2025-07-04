import { MemoryGraphEngine } from './engine';
import { GraphBuilders } from './builders';
/**
 * Agent Runtime Integration for Memory Graph
 * Provides high-level APIs for AI agents to interact with the memory graph
 */
export class AgentMemoryRuntime {
	constructor(initialGraph) {
		this.conversationHistory = [];
		this.currentConversationNodeId = null;
		this.engine = new MemoryGraphEngine(initialGraph);
		// Subscribe to graph changes for logging/debugging
		this.engine.changes$.subscribe(change => {
			this.logChange(change);
		});
	}
	// Core engine access
	get graph() {
		return this.engine;
	}
	get currentGraph() {
		return this.engine.graph;
	}
	/**
	 * Log a graph change (for debugging and history)
	 */
	logChange(change) {
		// We could persist this to a log file or send to telemetry
		console.log(
			`[MemoryGraph Change] ${change.type}`,
			change.node?.type || change.relationship?.type || '',
			change.node?.name || ''
		);
	}
	/**
	 * Record a conversation entry and link it to the memory graph
	 */
	recordConversation(entry) {
		const fullEntry = {
			...entry,
			timestamp: new Date(),
		};
		this.conversationHistory.push(fullEntry);
		// If we don't have a current conversation node or we have too many entries,
		// create a new conversation node
		if (!this.currentConversationNodeId || this.conversationHistory.length > 20) {
			this.startNewConversationNode();
		} else {
			// Otherwise, update the existing node with the new message
			const conversationNode = this.engine.getNodeById(this.currentConversationNodeId);
			if (conversationNode && conversationNode.type === 'conversation') {
				// Add the message to the existing conversation
				this.engine.updateNode(this.currentConversationNodeId, {
					messages: [...conversationNode.messages, fullEntry],
					updatedAt: new Date(),
				});
			}
		}
		return fullEntry.content;
	}
	/**
	 * Create a new conversation node in the memory graph
	 */
	startNewConversationNode() {
		const recentMessages = this.conversationHistory.slice(-10);
		// Summarize the conversation
		const userMessages = recentMessages
			.filter(msg => msg.role === 'user')
			.map(msg => msg.content)
			.join(' ');
		const summary =
			userMessages.length > 50
				? `${userMessages.substring(0, 47)}...`
				: userMessages || 'New conversation';
		// Create the conversation node
		const conversationNode = GraphBuilders.conversation(
			`Conversation: ${new Date().toLocaleString()}`
		)
			.withMessages(recentMessages)
			.withSummary(summary)
			.addToGraph(this.engine);
		this.currentConversationNodeId = conversationNode.id;
	}
	/**
	 * Record a user intent
	 */
	recordIntent(name, description, relatedToConversation = true) {
		const intentNode = GraphBuilders.intent(name)
			.withDescription(description)
			.withCategory('goal')
			.withStatus('active')
			.withPriority('medium')
			.addToGraph(this.engine);
		// Connect to current conversation if requested
		if (relatedToConversation && this.currentConversationNodeId) {
			GraphBuilders.relationship(
				this.currentConversationNodeId,
				intentNode.id,
				'derives_from'
			).addToGraph(this.engine);
		}
		return intentNode;
	}
	/**
	 * Record a feature based on user intent
	 */
	recordFeature(name, description, status = 'planned', priority = 'medium', relatedIntentId) {
		const featureNode = GraphBuilders.feature(name)
			.withDescription(description)
			.withStatus(status)
			.withPriority(priority)
			.addToGraph(this.engine);
		if (relatedIntentId) {
			GraphBuilders.relationship(relatedIntentId, featureNode.id, 'implements').addToGraph(
				this.engine
			);
		}
		return featureNode;
	}
	/**
	 * Record a UI screen or component
	 */
	recordScreen(name, description, screenType = 'page', route, relatedFeatureId) {
		const builder = GraphBuilders.screen(name)
			.withDescription(description)
			.withScreenType(screenType);
		if (route) {
			builder.withRoute(route);
		}
		const screenNode = builder.addToGraph(this.engine);
		if (relatedFeatureId) {
			GraphBuilders.relationship(screenNode.id, relatedFeatureId, 'implements').addToGraph(
				this.engine
			);
		}
		return screenNode;
	}
	/**
	 * Record logic (function, class, etc.)
	 */
	recordLogic(
		name,
		description,
		logicType = 'function',
		relatedNodeId,
		relationshipType = 'implements'
	) {
		const logicNode = GraphBuilders.logic(name)
			.withDescription(description)
			.withLogicType(logicType)
			.addToGraph(this.engine);
		if (relatedNodeId) {
			GraphBuilders.relationship(logicNode.id, relatedNodeId, relationshipType).addToGraph(
				this.engine
			);
		}
		return logicNode;
	}
	/**
	 * Record a data model
	 */
	recordDataModel(name, description, structure, isPersistent = false, relatedNodeId) {
		const dataNode = GraphBuilders.data(name)
			.withDescription(description)
			.withStructure(structure)
			.withPersistence(isPersistent)
			.addToGraph(this.engine);
		if (relatedNodeId) {
			GraphBuilders.relationship(dataNode.id, relatedNodeId, 'relates_to').addToGraph(this.engine);
		}
		return dataNode;
	}
	/**
	 * Record an API endpoint
	 */
	recordApi(name, description, method, path, relatedNodeId) {
		const apiNode = GraphBuilders.api(name)
			.withDescription(description)
			.withMethod(method)
			.withPath(path)
			.addToGraph(this.engine);
		if (relatedNodeId) {
			GraphBuilders.relationship(apiNode.id, relatedNodeId, 'implements').addToGraph(this.engine);
		}
		return apiNode;
	}
	/**
	 * Record a design decision with options, pros/cons
	 */
	recordDecision(name, description, options, selectedOptionIndex, rationale, impact = 'medium') {
		return GraphBuilders.decision(name)
			.withDescription(description)
			.withOptions(options)
			.withSelectedOption(selectedOptionIndex)
			.withRationale(rationale)
			.withImpact(impact)
			.addToGraph(this.engine);
	}
}
