/**
 * Memory Graph React Components
 * Provides visualization and interaction with the memory graph
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Import ReactFlow types
import type { Edge, Node, NodeTypes, NodeMouseHandler, EdgeMouseHandler } from 'reactflow';
// Import ReactFlow components
import ReactFlow, {
	Background,
	Controls,
	MiniMap,
	ReactFlowProvider,
	useNodesState,
	useEdgesState,
	useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
// Import RxJS hooks
import type { Observable } from 'rxjs';
import { useObservable } from 'rxjs-hooks';
import { MemoryGraphEngine } from '../engine';
import { AnyNode, Relationship } from '../schemas';
import { NodeDetails } from './NodeDetails';
import { EdgeDetails } from './EdgeDetails';
import { NodeCard } from './NodeCard';
import { GraphControls } from './GraphControls';
import { GraphLegend } from './GraphLegend';
import { GraphMetrics } from './GraphMetrics';
import './MemoryGraphVisualization.css';

type NodePosition = {
	x: number;
	y: number;
};

// Node type styles
const NODE_TYPE_COLORS: Record<string, string> = {
	feature: '#1976d2',
	screen: '#388e3c',
	logic: '#d32f2f',
	data: '#7b1fa2',
	api: '#f57c00',
	test: '#0097a7',
	decision: '#5d4037',
	intent: '#c2185b',
	conversation: '#00796b',
};

// Node type icons
const NODE_TYPE_ICONS: Record<string, string> = {
	feature: '✨',
	screen: '📱',
	logic: '⚙️',
	data: '💾',
	api: '🔌',
	test: '🧪',
	decision: '🔀',
	intent: '🎯',
	conversation: '💬',
};

// Custom node components - wrap NodeCard for ReactFlow compatibility
const ReactFlowNodeCard: React.FC<any> = props => {
	const { data, selected, id } = props;
	return (
		<NodeCard
			node={data.node}
			position={data.position}
			isSelected={selected || false}
			isEditable={data.isEditable || false}
			onClick={data.onClick || (() => {})}
			onUpdate={data.onUpdate || (() => {})}
			id={id}
			selected={selected}
			data={data}
		/>
	);
};

const nodeTypes: NodeTypes = {
	default: ReactFlowNodeCard,
	// Can add specialized node types here
};

/**
 * Convert Memory Graph nodes to ReactFlow nodes
 */
const mapNodesToFlowNodes = (nodes: AnyNode[], selectedNodeId?: string): Node[] => {
	return nodes.map(node => {
		// Get position from metadata or default to random position
		const metadata = node.metadata || {};
		const position = (metadata.position as NodePosition) || {
			x: Math.random() * 500,
			y: Math.random() * 500,
		};

		return {
			id: node.id,
			type: 'default',
			data: {
				...node,
				label: node.name,
				icon: NODE_TYPE_ICONS[node.type] || '📄',
				color: NODE_TYPE_COLORS[node.type] || '#607d8b',
				selected: node.id === selectedNodeId,
			},
			position: {
				x: position.x,
				y: position.y,
			},
			style: {
				borderColor: node.id === selectedNodeId ? '#ff9800' : undefined,
				borderWidth: node.id === selectedNodeId ? 2 : undefined,
			},
		};
	});
};

/**
 * Convert Memory Graph relationships to ReactFlow edges
 */
const mapRelationshipsToFlowEdges = (
	relationships: Relationship[],
	selectedEdgeId?: string
): Edge[] => {
	return relationships.map(rel => ({
		id: rel.id,
		source: rel.fromNodeId,
		target: rel.toNodeId,
		type: 'smoothstep',
		label: rel.type.replace('_', ' '),
		data: rel,
		animated: rel.type === 'depends_on' || rel.type === 'derives_from',
		style: {
			stroke: selectedEdgeId === rel.id ? '#ff9800' : undefined,
			strokeWidth: selectedEdgeId === rel.id ? 3 : rel.strength ? rel.strength * 3 : 1,
		},
	}));
};

interface MemoryGraphViewProps {
	memoryGraph: MemoryGraphEngine;
	width?: string | number;
	height?: string | number;
	readOnly?: boolean;
	onNodeSelect?: (node: AnyNode | null) => void;
	onRelationshipSelect?: (relationship: Relationship | null) => void;
}

/**
 * Memory Graph Visualization Component
 */
export const MemoryGraphView: React.FC<MemoryGraphViewProps> = ({
	memoryGraph,
	width = '100%',
	height = 600,
	readOnly = false,
	onNodeSelect,
	onRelationshipSelect,
}) => {
	// Graph data from Observable
	const graph = useObservable(
		() =>
			memoryGraph.graph$ as Observable<{
				nodes: AnyNode[];
				relationships: Relationship[];
				metadata?: Record<string, any>;
			}>
	);

	// State for nodes and edges
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);
	const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
	const [selectedEdgeId, setSelectedEdgeId] = useState<string | undefined>();
	const [filterType, setFilterType] = useState<string | null>(null);

	const reactFlowInstance = useReactFlow();

	// Update ReactFlow nodes and edges when the graph changes
	useEffect(() => {
		if (!graph) return;

		let filteredNodes = graph.nodes;

		// Apply node type filter if set
		if (filterType) {
			filteredNodes = filteredNodes.filter((n: AnyNode) => n.type === filterType);
		}

		const flowNodes = mapNodesToFlowNodes(filteredNodes, selectedNodeId);

		// Only include edges for visible nodes
		const nodeIds = new Set(filteredNodes.map((n: AnyNode) => n.id));
		const filteredRelationships = graph.relationships.filter(
			(r: Relationship) => nodeIds.has(r.fromNodeId) && nodeIds.has(r.toNodeId)
		);

		const flowEdges = mapRelationshipsToFlowEdges(filteredRelationships, selectedEdgeId);

		setNodes(flowNodes);
		setEdges(flowEdges);

		// Use the layout algorithm
		reactFlowInstance?.fitView();
	}, [graph, filterType, selectedNodeId, selectedEdgeId, reactFlowInstance]);

	// Handle node selection
	const handleNodeClick: NodeMouseHandler = useCallback(
		(_event: React.MouseEvent, node: Node) => {
			const graphNode = memoryGraph.getNodeById(node.id);
			setSelectedNodeId(node.id);
			setSelectedEdgeId(undefined);
			if (onNodeSelect && graphNode) {
				onNodeSelect(graphNode);
			}
		},
		[memoryGraph, onNodeSelect]
	);

	// Handle edge selection
	const handleEdgeClick: EdgeMouseHandler = useCallback(
		(_event: React.MouseEvent, edge: Edge) => {
			const graphRel = memoryGraph.getRelationshipById(edge.id);
			setSelectedEdgeId(edge.id);
			setSelectedNodeId(undefined);
			if (onRelationshipSelect && graphRel) {
				onRelationshipSelect(graphRel);
			}
		},
		[memoryGraph, onRelationshipSelect]
	);

	// Handle background click (deselect)
	const handlePaneClick = useCallback(() => {
		setSelectedNodeId(undefined);
		setSelectedEdgeId(undefined);
		if (onNodeSelect) onNodeSelect(null);
		if (onRelationshipSelect) onRelationshipSelect(null);
	}, [onNodeSelect, onRelationshipSelect]);

	// Handle node drag end (save position)
	const handleNodeDragStop: NodeMouseHandler = useCallback(
		(_event: React.MouseEvent, node: Node) => {
			const graphNode = memoryGraph.getNodeById(node.id);
			if (graphNode) {
				memoryGraph.updateNode(node.id, {
					metadata: {
						...graphNode.metadata,
						position: {
							x: node.position.x,
							y: node.position.y,
						},
					},
				});
			}
		},
		[memoryGraph]
	);

	// Calculate metrics for the graph
	const metrics = useMemo(() => {
		if (!graph) return { nodeCount: 0, edgeCount: 0, complexity: 0 };

		return {
			nodeCount: graph.nodes.length,
			edgeCount: graph.relationships.length,
			nodeTypeDistribution: graph.nodes.reduce(
				(acc: Record<string, number>, node: AnyNode) => {
					acc[node.type] = (acc[node.type] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>
			),
			complexity: graph.metadata?.stats?.complexity || 0,
		};
	}, [graph]);

	// Filter node types
	const handleFilterChange = useCallback((type: string | null) => {
		setFilterType(type);
	}, []);

	// Details panel for selected entities
	const detailsPanel = useMemo(() => {
		if (selectedNodeId) {
			const node = memoryGraph.getNodeById(selectedNodeId);
			if (node) {
				return <NodeDetails node={node} readOnly={readOnly} />;
			}
		} else if (selectedEdgeId) {
			const edge = memoryGraph.getRelationshipById(selectedEdgeId);
			if (edge) {
				return <EdgeDetails relationship={edge} readOnly={readOnly} />;
			}
		}
		return null;
	}, [selectedNodeId, selectedEdgeId, memoryGraph, readOnly]);

	if (!graph) return <div>Loading graph...</div>;

	// Calculate width and height classes
	const getWidthClass = () => {
		if (typeof width === 'number') {
			return `memory-graph-view--width-px-${width}`;
		}
		return 'memory-graph-view--width-full';
	};

	const getHeightClass = () => {
		if (typeof height === 'number') {
			return `memory-graph-view--height-px-${height}`;
		}
		return 'memory-graph-view--height-full';
	};

	return (
		<div className={`memory-graph-view ${getWidthClass()} ${getHeightClass()}`}>
			<div className="memory-graph-view__header">
				<GraphControls
					onFilterChange={handleFilterChange}
					currentFilter={filterType}
					nodeTypes={Object.keys(NODE_TYPE_COLORS)}
					nodeTypeIcons={NODE_TYPE_ICONS}
				/>
				<GraphMetrics metrics={metrics} />
			</div>

			<div className="memory-graph-view__content">
				<ReactFlowProvider>
					<ReactFlow
						nodes={nodes}
						edges={edges}
						onNodesChange={onNodesChange}
						onEdgesChange={onEdgesChange}
						nodeTypes={nodeTypes}
						onNodeClick={handleNodeClick}
						onEdgeClick={handleEdgeClick}
						onPaneClick={handlePaneClick}
						onNodeDragStop={handleNodeDragStop}
						fitView
						attributionPosition="bottom-left"
					>
						<Background />
						<Controls />
						<MiniMap />
						<GraphLegend nodeTypes={NODE_TYPE_COLORS} nodeIcons={NODE_TYPE_ICONS} />
					</ReactFlow>
				</ReactFlowProvider>
			</div>

			{detailsPanel && <div className="memory-graph-details-panel">{detailsPanel}</div>}
		</div>
	);
};

/**
 * Standalone wrapper for Memory Graph View
 */
export const StandaloneMemoryGraphView: React.FC<MemoryGraphViewProps> = props => {
	return (
		<ReactFlowProvider>
			<MemoryGraphView {...props} />
		</ReactFlowProvider>
	);
};
