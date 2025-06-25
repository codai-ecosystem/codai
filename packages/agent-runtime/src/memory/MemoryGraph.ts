/**
 * Memory Graph System for AIDE Agent Runtime
 * Provides persistent memory, context sharing, and pattern recognition across agent workflows
 */

export interface MemoryNode {
	id: string;
	type: 'workflow' | 'context' | 'artifact' | 'pattern' | 'decision';
	data: any;
	timestamp: number;
	relationships: string[];
	metadata: {
		agent?: string;
		phase?: string;
		priority?: 'low' | 'medium' | 'high';
		tags?: string[];
		version?: string;
	};
}

export interface MemoryEdge {
	id: string;
	from: string;
	to: string;
	type: 'dependency' | 'sequence' | 'reference' | 'similarity' | 'causation';
	weight: number;
	metadata: {
		strength?: number;
		confidence?: number;
		bidirectional?: boolean;
	};
}

export interface WorkflowStep {
	phase: string;
	agent: string;
	input: any;
	output: any;
	timestamp: number;
	duration: number;
	success: boolean;
	error?: string;
}

export interface ContextData {
	projectId: string;
	framework?: string;
	language?: string;
	preferences?: Record<string, any>;
	constraints?: string[];
	requirements?: string[];
	[key: string]: any;
}

export interface SystemState {
	integrity: number; // 0-1 score
	consistency: boolean;
	nodeCount: number;
	edgeCount: number;
	lastUpdate: number;
	version: string;
}

export class MemoryGraph {
	private nodes: Map<string, MemoryNode> = new Map();
	private edges: Map<string, MemoryEdge> = new Map();
	private workflowHistory: Map<string, WorkflowStep[]> = new Map();
	private contextStore: Map<string, ContextData> = new Map();
	private patternCache: Map<string, any[]> = new Map();

	constructor() {
		this.initializeGraph();
	}

	/**
	 * Initialize the memory graph with basic structure
	 */
	private initializeGraph(): void {
		// Create root system node
		this.addNode({
			id: 'system-root',
			type: 'context',
			data: {
				name: 'AIDE Agent Runtime',
				version: '1.0.0',
				initialized: Date.now(),
			},
			timestamp: Date.now(),
			relationships: [],
			metadata: {
				priority: 'high',
				tags: ['system', 'root'],
			},
		});
	}

	/**
	 * Add a new node to the memory graph
	 */
	addNode(node: MemoryNode): void {
		this.nodes.set(node.id, node);
		this.updateSystemIntegrity();
	}

	/**
	 * Add a new edge to the memory graph
	 */
	addEdge(edge: MemoryEdge): void {
		// Verify both nodes exist
		if (!this.nodes.has(edge.from) || !this.nodes.has(edge.to)) {
			throw new Error(
				`Cannot create edge: one or both nodes do not exist (${edge.from}, ${edge.to})`
			);
		}

		this.edges.set(edge.id, edge);

		// Update node relationships
		const fromNode = this.nodes.get(edge.from)!;
		const toNode = this.nodes.get(edge.to)!;

		fromNode.relationships.push(edge.to);
		if (edge.metadata.bidirectional) {
			toNode.relationships.push(edge.from);
		}

		this.updateSystemIntegrity();
	}

	/**
	 * Record a workflow step in the memory graph
	 */ recordWorkflowStep(workflowId: string, step: Partial<WorkflowStep>): void {
		const fullStep: WorkflowStep = {
			phase: step.phase || 'unknown',
			agent: step.agent || 'unknown',
			input: step.input || {},
			output: step.output || {},
			timestamp: step.timestamp || Date.now(),
			duration: step.duration || 0,
			success: step.success !== false,
			...(step.error !== undefined && { error: step.error }),
		};

		if (!this.workflowHistory.has(workflowId)) {
			this.workflowHistory.set(workflowId, []);
		}

		this.workflowHistory.get(workflowId)!.push(fullStep);

		// Create memory node for this workflow step
		const nodeId = `${workflowId}-${fullStep.phase}-${fullStep.timestamp}`;
		this.addNode({
			id: nodeId,
			type: 'workflow',
			data: fullStep,
			timestamp: fullStep.timestamp,
			relationships: [],
			metadata: {
				agent: fullStep.agent,
				phase: fullStep.phase,
				priority: 'medium',
				tags: ['workflow', 'step'],
			},
		});

		// Link to previous step if exists
		const steps = this.workflowHistory.get(workflowId)!;
		if (steps.length > 1) {
			const prevStep = steps[steps.length - 2];
			const prevNodeId = `${workflowId}-${prevStep.phase}-${prevStep.timestamp}`;

			this.addEdge({
				id: `${prevNodeId}-to-${nodeId}`,
				from: prevNodeId,
				to: nodeId,
				type: 'sequence',
				weight: 1.0,
				metadata: {
					strength: 1.0,
					confidence: 1.0,
					bidirectional: false,
				},
			});
		}
	}

	/**
	 * Get workflow history for a specific workflow
	 */
	getWorkflowHistory(workflowId: string): WorkflowStep[] {
		return this.workflowHistory.get(workflowId) || [];
	}

	/**
	 * Store context data that can be shared between agents
	 */
	storeContext(contextId: string, data: ContextData): void {
		this.contextStore.set(contextId, data);

		// Create memory node for context
		this.addNode({
			id: `context-${contextId}`,
			type: 'context',
			data: data,
			timestamp: Date.now(),
			relationships: [],
			metadata: {
				priority: 'high',
				tags: ['context', 'shared'],
			},
		});
	}

	/**
	 * Retrieve context data
	 */
	getContext(contextId: string): ContextData | undefined {
		return this.contextStore.get(contextId);
	}

	/**
	 * Identify patterns based on tags or keywords
	 */
	identifyPatterns(keywords: string[]): any[] {
		const cacheKey = keywords.join('-');

		if (this.patternCache.has(cacheKey)) {
			return this.patternCache.get(cacheKey)!;
		}

		const patterns: any[] = [];

		// Search through workflow history for patterns
		for (const [workflowId, steps] of this.workflowHistory.entries()) {
			const workflowData = this.extractWorkflowData(steps);

			// Check if workflow matches keywords
			const matchScore = this.calculatePatternMatch(workflowData, keywords);
			if (matchScore > 0.5) {
				patterns.push({
					workflowId,
					data: workflowData,
					matchScore,
					frequency: this.calculatePatternFrequency(workflowData),
				});
			}
		}

		// Sort by match score and frequency
		patterns.sort((a, b) => b.matchScore * b.frequency - a.matchScore * a.frequency);

		this.patternCache.set(cacheKey, patterns);
		return patterns;
	}

	/**
	 * Extract structured data from workflow steps
	 */
	private extractWorkflowData(steps: WorkflowStep[]): any {
		const data: any = {
			phases: steps.map(s => s.phase),
			agents: [...new Set(steps.map(s => s.agent))],
			duration: steps.reduce((sum, s) => sum + s.duration, 0),
			success: steps.every(s => s.success),
			technologies: [],
			patterns: [],
		};

		// Extract technologies and patterns from inputs/outputs
		steps.forEach(step => {
			if (step.input) {
				this.extractTechnologies(step.input, data.technologies);
			}
			if (step.output) {
				this.extractTechnologies(step.output, data.technologies);
			}
		});

		data.technologies = [...new Set(data.technologies)];
		return data;
	}

	/**
	 * Extract technology references from data
	 */
	private extractTechnologies(data: any, technologies: string[]): void {
		if (typeof data === 'string') {
			// Look for common technology patterns
			const techPatterns = [
				/react/i,
				/vue/i,
				/angular/i,
				/typescript/i,
				/javascript/i,
				/python/i,
				/java/i,
				/c#/i,
				/go/i,
				/rust/i,
				/docker/i,
				/kubernetes/i,
				/aws/i,
				/azure/i,
				/gcp/i,
				/jest/i,
				/vitest/i,
				/cypress/i,
				/playwright/i,
			];

			techPatterns.forEach(pattern => {
				const match = data.match(pattern);
				if (match) {
					technologies.push(match[0].toLowerCase());
				}
			});
		} else if (typeof data === 'object' && data !== null) {
			Object.values(data).forEach(value => {
				this.extractTechnologies(value, technologies);
			});
		}
	}

	/**
	 * Calculate how well a workflow matches given keywords
	 */
	private calculatePatternMatch(workflowData: any, keywords: string[]): number {
		let matches = 0;
		let total = keywords.length;

		keywords.forEach(keyword => {
			const keywordLower = keyword.toLowerCase();

			// Check in technologies
			if (workflowData.technologies.some((tech: string) => tech.includes(keywordLower))) {
				matches++;
			}
			// Check in phases
			else if (
				workflowData.phases.some((phase: string) => phase.toLowerCase().includes(keywordLower))
			) {
				matches++;
			}
			// Check in agents
			else if (
				workflowData.agents.some((agent: string) => agent.toLowerCase().includes(keywordLower))
			) {
				matches++;
			}
		});

		return matches / total;
	}

	/**
	 * Calculate how frequently a pattern appears
	 */
	private calculatePatternFrequency(workflowData: any): number {
		let frequency = 0;

		// Count similar workflows
		for (const [, steps] of this.workflowHistory.entries()) {
			const otherData = this.extractWorkflowData(steps);
			const similarity = this.calculateSimilarity(workflowData, otherData);
			if (similarity > 0.7) {
				frequency++;
			}
		}

		return Math.min(frequency / this.workflowHistory.size, 1.0);
	}

	/**
	 * Calculate similarity between two workflow data objects
	 */
	private calculateSimilarity(data1: any, data2: any): number {
		const tech1 = new Set(data1.technologies || []);
		const tech2 = new Set(data2.technologies || []);
		const techIntersection = new Set([...tech1].filter(x => tech2.has(x)));
		const techUnion = new Set([...tech1, ...tech2]);

		const techSimilarity = techUnion.size > 0 ? techIntersection.size / techUnion.size : 0;

		const phase1 = new Set(data1.phases || []);
		const phase2 = new Set(data2.phases || []);
		const phaseIntersection = new Set([...phase1].filter(x => phase2.has(x)));
		const phaseUnion = new Set([...phase1, ...phase2]);

		const phaseSimilarity = phaseUnion.size > 0 ? phaseIntersection.size / phaseUnion.size : 0;

		return (techSimilarity + phaseSimilarity) / 2;
	}

	/**
	 * Get nodes by type
	 */
	getNodesByType(type: MemoryNode['type']): MemoryNode[] {
		return Array.from(this.nodes.values()).filter(node => node.type === type);
	}

	/**
	 * Get connected nodes for a given node
	 */
	getConnectedNodes(nodeId: string): MemoryNode[] {
		const node = this.nodes.get(nodeId);
		if (!node) return [];

		return node.relationships.map(relId => this.nodes.get(relId)).filter(Boolean) as MemoryNode[];
	}

	/**
	 * Search nodes by tags
	 */
	searchByTags(tags: string[]): MemoryNode[] {
		return Array.from(this.nodes.values()).filter(node => {
			const nodeTags = node.metadata.tags || [];
			return tags.some(tag => nodeTags.includes(tag));
		});
	}

	/**
	 * Get current system state
	 */
	getSystemState(): SystemState {
		return {
			integrity: this.calculateIntegrity(),
			consistency: this.checkConsistency(),
			nodeCount: this.nodes.size,
			edgeCount: this.edges.size,
			lastUpdate: Date.now(),
			version: '1.0.0',
		};
	}

	/**
	 * Calculate system integrity score
	 */
	private calculateIntegrity(): number {
		const totalNodes = this.nodes.size;
		const connectedNodes = Array.from(this.nodes.values()).filter(
			node => node.relationships.length > 0
		).length;

		return totalNodes > 0 ? connectedNodes / totalNodes : 1.0;
	}

	/**
	 * Check system consistency
	 */
	private checkConsistency(): boolean {
		// Verify all edge references exist
		for (const edge of this.edges.values()) {
			if (!this.nodes.has(edge.from) || !this.nodes.has(edge.to)) {
				return false;
			}
		}

		// Verify all node relationships have corresponding edges
		for (const node of this.nodes.values()) {
			for (const relationId of node.relationships) {
				if (!this.nodes.has(relationId)) {
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * Update system integrity after modifications
	 */
	private updateSystemIntegrity(): void {
		// Cleanup broken references
		for (const [nodeId, node] of this.nodes.entries()) {
			node.relationships = node.relationships.filter(relId => this.nodes.has(relId));
		}

		// Remove edges with missing nodes
		for (const [edgeId, edge] of this.edges.entries()) {
			if (!this.nodes.has(edge.from) || !this.nodes.has(edge.to)) {
				this.edges.delete(edgeId);
			}
		}
	}

	/**
	 * Export graph data for persistence
	 */
	export(): { nodes: MemoryNode[]; edges: MemoryEdge[]; metadata: any } {
		return {
			nodes: Array.from(this.nodes.values()),
			edges: Array.from(this.edges.values()),
			metadata: {
				version: '1.0.0',
				exported: Date.now(),
				nodeCount: this.nodes.size,
				edgeCount: this.edges.size,
			},
		};
	}

	/**
	 * Import graph data from persistence
	 */
	import(data: { nodes: MemoryNode[]; edges: MemoryEdge[] }): void {
		this.nodes.clear();
		this.edges.clear();

		// Import nodes first
		data.nodes.forEach(node => this.nodes.set(node.id, node));

		// Then import edges
		data.edges.forEach(edge => this.edges.set(edge.id, edge));

		this.updateSystemIntegrity();
	}
}
