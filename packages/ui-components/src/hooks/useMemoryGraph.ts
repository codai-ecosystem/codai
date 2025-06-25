import { useState, useCallback } from 'react';

export interface MemoryNode {
	id: string;
	type: 'intent' | 'state' | 'context' | 'action';
	content: any;
	connections: string[];
	timestamp: Date;
	metadata?: Record<string, any>;
}

export interface MemoryGraphState {
	nodes: Map<string, MemoryNode>;
	selectedNode: string | null;
	filters: {
		types: string[];
		timeRange: [Date, Date] | null;
	};
}

export interface UseMemoryGraphReturn {
	state: MemoryGraphState;
	addNode: (node: Omit<MemoryNode, 'id' | 'timestamp'>) => string;
	removeNode: (id: string) => void;
	updateNode: (id: string, updates: Partial<MemoryNode>) => void;
	selectNode: (id: string | null) => void;
	setFilters: (filters: Partial<MemoryGraphState['filters']>) => void;
	getConnectedNodes: (id: string, depth?: number) => MemoryNode[];
}

export function useMemoryGraph(): UseMemoryGraphReturn {
	const [state, setState] = useState<MemoryGraphState>({
		nodes: new Map(),
		selectedNode: null,
		filters: {
			types: [],
			timeRange: null,
		},
	});

	const addNode = useCallback((nodeData: Omit<MemoryNode, 'id' | 'timestamp'>) => {
		const id = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const node: MemoryNode = {
			...nodeData,
			id,
			timestamp: new Date(),
		};

		setState(prev => ({
			...prev,
			nodes: new Map(prev.nodes).set(id, node),
		}));

		return id;
	}, []);

	const removeNode = useCallback((id: string) => {
		setState(prev => {
			const newNodes = new Map(prev.nodes);
			newNodes.delete(id);

			// Remove connections to this node
			newNodes.forEach(node => {
				if (node.connections.includes(id)) {
					node.connections = node.connections.filter(conn => conn !== id);
				}
			});

			return {
				...prev,
				nodes: newNodes,
				selectedNode: prev.selectedNode === id ? null : prev.selectedNode,
			};
		});
	}, []);

	const updateNode = useCallback((id: string, updates: Partial<MemoryNode>) => {
		setState(prev => {
			const newNodes = new Map(prev.nodes);
			const existingNode = newNodes.get(id);
			if (existingNode) {
				newNodes.set(id, { ...existingNode, ...updates });
			}
			return {
				...prev,
				nodes: newNodes,
			};
		});
	}, []);

	const selectNode = useCallback((id: string | null) => {
		setState(prev => ({
			...prev,
			selectedNode: id,
		}));
	}, []);

	const setFilters = useCallback((filters: Partial<MemoryGraphState['filters']>) => {
		setState(prev => ({
			...prev,
			filters: { ...prev.filters, ...filters },
		}));
	}, []);

	const getConnectedNodes = useCallback(
		(id: string, depth: number = 1): MemoryNode[] => {
			const visited = new Set<string>();
			const result: MemoryNode[] = [];

			const traverse = (nodeId: string, currentDepth: number) => {
				if (currentDepth > depth || visited.has(nodeId)) return;

				visited.add(nodeId);
				const node = state.nodes.get(nodeId);
				if (node && nodeId !== id) {
					result.push(node);
				}

				if (node && currentDepth < depth) {
					node.connections.forEach(connId => traverse(connId, currentDepth + 1));
				}
			};

			const rootNode = state.nodes.get(id);
			if (rootNode) {
				rootNode.connections.forEach(connId => traverse(connId, 0));
			}

			return result;
		},
		[state.nodes]
	);

	return {
		state,
		addNode,
		removeNode,
		updateNode,
		selectNode,
		setFilters,
		getConnectedNodes,
	};
}
