import { IMemoryGraphEngine } from '../interfaces/IMemoryGraphEngine';
import { IMemoryGraph } from '../interfaces/IMemoryGraph';
import { v4 as uuidv4 } from 'uuid';

/**
 * Simple in-memory implementation of the memory graph for development
 * This provides basic functionality without React component dependencies
 */
export class SimpleMemoryGraph implements IMemoryGraph {
	private nodeMap: Map<string, any> = new Map();
	private edgeMap: Map<string, any> = new Map();
	private eventHandlers: Map<string, Function[]> = new Map();

	// IMemoryGraph interface implementation
	addNode(
		type: 'intent' | 'feature' | 'screen' | 'logic' | 'relationship' | 'decision',
		content: string,
		metadata?: Record<string, any>
	): string {
		const id = uuidv4();
		const node = {
			id,
			type,
			content,
			name: content.substring(0, 50), // Use first 50 chars as name
			description: content,
			metadata: metadata || {},
			version: 1,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		this.nodeMap.set(id, node);
		this.emit('nodeAdded', { nodeId: id, node });
		return id;
	}

	// IMemoryGraphEngine compatibility - delegates to IMemoryGraph method
	addNodeCompat(nodeData: any): string {
		if (typeof nodeData === 'object' && nodeData.type && nodeData.content) {
			return this.addNode(nodeData.type, nodeData.content, nodeData.metadata);
		}
		// Default fallback
		return this.addNode('logic', String(nodeData), {});
	}
	getNode(id: string): any {
		return this.nodeMap.get(id) || null;
	}

	updateNode(
		id: string,
		updates: Partial<{ content: string; metadata: Record<string, any> }>
	): boolean {
		const node = this.nodeMap.get(id);
		if (!node) return false;

		if (updates.content) {
			node.content = updates.content;
			node.description = updates.content;
		}
		if (updates.metadata) {
			node.metadata = { ...node.metadata, ...updates.metadata };
		}
		node.updatedAt = new Date();
		node.version++;

		this.nodeMap.set(id, node);
		this.emit('nodeUpdated', { nodeId: id, node, updates });
		return true;
	}
	removeNode(id: string): boolean {
		const existed = this.nodeMap.has(id);
		if (existed) {
			this.nodeMap.delete(id);
			// Remove associated edges
			for (const edgeId of Array.from(this.edgeMap.keys())) {
				const edge = this.edgeMap.get(edgeId);
				if (edge && (edge.fromNodeId === id || edge.toNodeId === id)) {
					this.edgeMap.delete(edgeId);
				}
			}
			this.emit('nodeRemoved', { nodeId: id });
		}
		return existed;
	}

	addEdge(
		fromId: string,
		toId: string,
		type?: string,
		weight?: number,
		metadata?: Record<string, any>
	): string {
		const id = uuidv4();
		const edge = {
			id,
			fromNodeId: fromId,
			toNodeId: toId,
			type: type || 'relates_to',
			strength: weight || 1.0,
			metadata: metadata || {},
			createdAt: new Date(),
		};
		this.edgeMap.set(id, edge);
		this.emit('edgeAdded', { edgeId: id, edge });
		return id;
	}

	getNodesByType(
		type: 'intent' | 'feature' | 'screen' | 'logic' | 'relationship' | 'decision'
	): any[] {
		return Array.from(this.nodeMap.values()).filter(node => node.type === type);
	}

	searchNodes(query: string): any[] {
		const lowercaseQuery = query.toLowerCase();
		return Array.from(this.nodeMap.values()).filter(
			node =>
				node.content.toLowerCase().includes(lowercaseQuery) ||
				node.name.toLowerCase().includes(lowercaseQuery) ||
				node.description.toLowerCase().includes(lowercaseQuery)
		);
	}
	getConnectedNodes(nodeId: string): any[] {
		const connectedNodeIds = new Set<string>();
		for (const edge of Array.from(this.edgeMap.values())) {
			if (edge.fromNodeId === nodeId) {
				connectedNodeIds.add(edge.toNodeId);
			} else if (edge.toNodeId === nodeId) {
				connectedNodeIds.add(edge.fromNodeId);
			}
		}
		return Array.from(connectedNodeIds)
			.map(id => this.nodeMap.get(id))
			.filter(Boolean);
	}

	getConnections(nodeId: string): any[] {
		return Array.from(this.edgeMap.values()).filter(
			edge => edge.fromNodeId === nodeId || edge.toNodeId === nodeId
		);
	}

	getGraphData(): { nodes: any[]; edges: any[] } {
		return {
			nodes: Array.from(this.nodeMap.values()),
			edges: Array.from(this.edgeMap.values()),
		};
	}

	getStats(): any {
		return {
			nodeCount: this.nodeMap.size,
			edgeCount: this.edgeMap.size,
			typeDistribution: this.getTypeDistribution(),
			complexity: this.calculateComplexity(),
		};
	}
	// IMemoryGraphEngine interface implementation (simplified)
	addRelationship(relationshipData: any): string {
		return this.addEdge(
			relationshipData.fromNodeId,
			relationshipData.toNodeId,
			relationshipData.type,
			relationshipData.strength,
			relationshipData.metadata
		);
	}

	removeRelationship(id: string): boolean {
		const existed = this.edgeMap.has(id);
		if (existed) {
			this.edgeMap.delete(id);
			this.emit('edgeRemoved', { edgeId: id });
		}
		return existed;
	}

	get nodes(): any[] {
		return Array.from(this.nodeMap.values());
	}

	get relationships(): any[] {
		return Array.from(this.edgeMap.values());
	}

	getGraph(): any {
		return this.getGraphData();
	}

	clear(): void {
		this.nodeMap.clear();
		this.edgeMap.clear();
		this.emit('graphCleared', {});
	}

	// Event handling
	on(event: string, handler: Function): void {
		if (!this.eventHandlers.has(event)) {
			this.eventHandlers.set(event, []);
		}
		this.eventHandlers.get(event)!.push(handler);
	}

	off(event: string, handler: Function): void {
		const handlers = this.eventHandlers.get(event);
		if (handlers) {
			const index = handlers.indexOf(handler);
			if (index > -1) {
				handlers.splice(index, 1);
			}
		}
	}

	private emit(event: string, data: any): void {
		const handlers = this.eventHandlers.get(event);
		if (handlers) {
			handlers.forEach(handler => {
				try {
					handler(data);
				} catch (error) {
					console.error(`Error in event handler for ${event}:`, error);
				}
			});
		}
	}

	// Storage operations (simplified for now)
	async saveToStorage(): Promise<void> {
		// For now, we'll just store in memory
		console.log('SimpleMemoryGraph: saveToStorage called (no-op for now)');
	}

	async loadFromStorage(): Promise<void> {
		// For now, we'll just load from memory
		console.log('SimpleMemoryGraph: loadFromStorage called (no-op for now)');
	} // Helper methods
	private getTypeDistribution(): Record<string, number> {
		const distribution: Record<string, number> = {};
		for (const node of Array.from(this.nodeMap.values())) {
			distribution[node.type] = (distribution[node.type] || 0) + 1;
		}
		return distribution;
	}

	private calculateComplexity(): number {
		const nodeCount = this.nodeMap.size;
		const edgeCount = this.edgeMap.size;
		return nodeCount > 0 ? edgeCount / nodeCount : 0;
	}
}
