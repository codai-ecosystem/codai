import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MemoryGraph, AnyNode } from '../schemas';
import { NodeCard } from './NodeCard';
import { RelationshipEdge } from './RelationshipEdge';
import { GraphControls } from './GraphControls';
import clsx from 'clsx';
import './MemoryGraphVisualization.css';

export interface MemoryGraphVisualizationProps {
	/** The memory graph to visualize */
	graph: MemoryGraph;
	/** Optional CSS class name */
	className?: string;
	/** Callback for when a node is selected */
	onNodeSelect?: (node: AnyNode | null) => void;
	/** Callback for when a node is updated */
	onNodeUpdate?: (nodeId: string, updates: Partial<AnyNode>) => void;
	/** Callback for when a relationship is created */
	onRelationshipCreate?: (fromId: string, toId: string, type: string) => void;
	/** Callback for when a relationship is deleted */
	onRelationshipDelete?: (edgeId: string) => void;
	/** Whether the graph is in edit mode */
	isEditable?: boolean;
	/** Layout algorithm to use */
	layout?: 'force' | 'hierarchical' | 'circular';
}

interface NodePosition {
	id: string;
	x: number;
	y: number;
}

export const MemoryGraphVisualization: React.FC<MemoryGraphVisualizationProps> = ({
	graph,
	className,
	onNodeSelect,
	onNodeUpdate,
	onRelationshipDelete,
	isEditable = false,
	layout = 'force',
}) => {
	const [selectedNode, setSelectedNode] = useState<AnyNode | null>(null);
	const [nodePositions, setNodePositions] = useState<Map<string, NodePosition>>(new Map());
	const [zoomLevel, setZoomLevel] = useState(1);
	const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
	const [nodeFilter, setNodeFilter] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// Update transform using ref instead of inline styles
	useEffect(() => {
		if (containerRef.current) {
			containerRef.current.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`;
		}
	}, [panOffset, zoomLevel]);

	// Initialize node positions
	useEffect(() => {
		if (nodePositions.size === 0 && graph.nodes.length > 0) {
			calculateLayout();
		}
	}, [graph.nodes, layout]);
	const calculateLayout = useCallback(() => {
		const newPositions = new Map<string, NodePosition>();

		switch (layout) {
			case 'force':
				calculateForceLayout(newPositions);
				break;
			case 'hierarchical':
				calculateHierarchicalLayout(newPositions);
				break;
			case 'circular':
				calculateCircularLayout(newPositions);
				break;
		}

		setNodePositions(newPositions);
	}, [graph, layout]);

	const calculateForceLayout = (positions: Map<string, NodePosition>) => {
		// Simple force-directed layout simulation
		const centerX = 400;
		const centerY = 300;
		const nodes = graph.nodes;

		nodes.forEach((node, index) => {
			const angle = (index / nodes.length) * 2 * Math.PI;
			const radius = 150 + Math.random() * 100;
			positions.set(node.id, {
				id: node.id,
				x: centerX + Math.cos(angle) * radius,
				y: centerY + Math.sin(angle) * radius,
			});
		});

		// Simple force simulation (simplified)
		for (let iteration = 0; iteration < 50; iteration++) {
			nodes.forEach(node => {
				const pos = positions.get(node.id)!;
				let fx = 0,
					fy = 0;

				// Repulsion between nodes
				nodes.forEach(otherNode => {
					if (node.id !== otherNode.id) {
						const otherPos = positions.get(otherNode.id)!;
						const dx = pos.x - otherPos.x;
						const dy = pos.y - otherPos.y;
						const distance = Math.sqrt(dx * dx + dy * dy);
						if (distance > 0) {
							const force = 1000 / (distance * distance);
							fx += (dx / distance) * force;
							fy += (dy / distance) * force;
						}
					}
				}); // Attraction from relationships
				graph.relationships.forEach(edge => {
					if (edge.fromNodeId === node.id || edge.toNodeId === node.id) {
						const otherNodeId = edge.fromNodeId === node.id ? edge.toNodeId : edge.fromNodeId;
						const otherPos = positions.get(otherNodeId);
						if (otherPos) {
							const dx = otherPos.x - pos.x;
							const dy = otherPos.y - pos.y;
							const distance = Math.sqrt(dx * dx + dy * dy);
							if (distance > 0) {
								const force = distance * 0.01;
								fx += (dx / distance) * force;
								fy += (dy / distance) * force;
							}
						}
					}
				});

				// Center attraction
				const centerDx = centerX - pos.x;
				const centerDy = centerY - pos.y;
				fx += centerDx * 0.001;
				fy += centerDy * 0.001;

				// Update position
				pos.x += fx * 0.1;
				pos.y += fy * 0.1;
			});
		}
	};

	const calculateHierarchicalLayout = (positions: Map<string, NodePosition>) => {
		const levels = new Map<string, number>();
		const visited = new Set<string>();

		// Calculate node levels using BFS
		const calculateLevels = (startNodeId: string, level: number) => {
			if (visited.has(startNodeId)) return;
			visited.add(startNodeId);
			levels.set(startNodeId, level);
			graph.relationships
				.filter(edge => edge.fromNodeId === startNodeId)
				.forEach(edge => {
					if (!visited.has(edge.toNodeId)) {
						calculateLevels(edge.toNodeId, level + 1);
					}
				});
		};

		// Find root nodes (nodes with no incoming edges)
		const incomingCount = new Map<string, number>();
		graph.nodes.forEach(node => incomingCount.set(node.id, 0));
		graph.relationships.forEach(edge => {
			incomingCount.set(edge.toNodeId, (incomingCount.get(edge.toNodeId) || 0) + 1);
		});

		const rootNodes = graph.nodes.filter(node => incomingCount.get(node.id) === 0);
		rootNodes.forEach(node => calculateLevels(node.id, 0));

		// Position remaining nodes
		graph.nodes.forEach(node => {
			if (!levels.has(node.id)) {
				levels.set(node.id, 0);
			}
		});

		// Layout nodes by level
		const nodesByLevel = new Map<number, string[]>();
		levels.forEach((level, nodeId) => {
			if (!nodesByLevel.has(level)) {
				nodesByLevel.set(level, []);
			}
			nodesByLevel.get(level)!.push(nodeId);
		});

		const levelHeight = 150;
		const nodeWidth = 200;

		nodesByLevel.forEach((nodeIds, level) => {
			const y = level * levelHeight + 100;
			nodeIds.forEach((nodeId, index) => {
				const x = (index - (nodeIds.length - 1) / 2) * nodeWidth + 400;
				positions.set(nodeId, { id: nodeId, x, y });
			});
		});
	};

	const calculateCircularLayout = (positions: Map<string, NodePosition>) => {
		const centerX = 400;
		const centerY = 300;
		const radius = 200;

		graph.nodes.forEach((node, index) => {
			const angle = (index / graph.nodes.length) * 2 * Math.PI;
			positions.set(node.id, {
				id: node.id,
				x: centerX + Math.cos(angle) * radius,
				y: centerY + Math.sin(angle) * radius,
			});
		});
	};
	const handleNodeClick = useCallback(
		(node: AnyNode) => {
			setSelectedNode(node);
			onNodeSelect?.(node);
		},
		[onNodeSelect]
	);

	const handleNodeUpdate = useCallback(
		(nodeId: string, updates: Partial<AnyNode>) => {
			onNodeUpdate?.(nodeId, updates);
			if (selectedNode?.id === nodeId) {
				setSelectedNode({ ...selectedNode, ...updates } as AnyNode);
			}
		},
		[onNodeUpdate, selectedNode]
	);

	const handleZoom = useCallback((delta: number) => {
		setZoomLevel(prev => Math.max(0.1, Math.min(3, prev + delta)));
	}, []);
	return (
		<div
			className={clsx('memory-graph-visualization relative overflow-hidden bg-gray-50', className)}
		>
			<GraphControls
				onFilterChange={type => {
					setNodeFilter(type);
				}}
				currentFilter={nodeFilter}
				nodeTypes={Array.from(new Set(graph.nodes.map(node => node.type)))}
				className="absolute top-4 left-4 z-10"
			/>
			<div
				ref={containerRef}
				className="graph-container"
				onMouseDown={e => {
					const startX = e.clientX;
					const startY = e.clientY;
					const startPanX = panOffset.x;
					const startPanY = panOffset.y;

					const handleMouseMove = (e: MouseEvent) => {
						const deltaX = e.clientX - startX;
						const deltaY = e.clientY - startY;
						setPanOffset({
							x: startPanX + deltaX,
							y: startPanY + deltaY,
						});
					};

					const handleMouseUp = () => {
						document.removeEventListener('mousemove', handleMouseMove);
						document.removeEventListener('mouseup', handleMouseUp);
					};

					document.addEventListener('mousemove', handleMouseMove);
					document.addEventListener('mouseup', handleMouseUp);
				}}
				onWheel={e => {
					e.preventDefault();
					handleZoom(e.deltaY > 0 ? -0.1 : 0.1);
				}}
			>
				{' '}
				{/* Render relationships first (behind nodes) */}{' '}
				<svg className="graph-svg">
					{graph.relationships
						.filter(edge => {
							if (!nodeFilter) return true;
							const fromNode = graph.nodes.find(n => n.id === edge.fromNodeId);
							const toNode = graph.nodes.find(n => n.id === edge.toNodeId);
							return fromNode?.type === nodeFilter && toNode?.type === nodeFilter;
						})
						.map(edge => {
							const fromPos = nodePositions.get(edge.fromNodeId);
							const toPos = nodePositions.get(edge.toNodeId);
							if (!fromPos || !toPos) return null;
							const deleteHandler =
								isEditable && onRelationshipDelete
									? () => onRelationshipDelete(edge.id)
									: undefined;
							return (
								<RelationshipEdge
									key={edge.id}
									edge={edge}
									fromPosition={fromPos}
									toPosition={toPos}
									isSelected={false}
									{...(deleteHandler && { onDelete: deleteHandler })}
								/>
							);
						})}
				</svg>{' '}
				{/* Render nodes */}
				{graph.nodes
					.filter(node => !nodeFilter || node.type === nodeFilter)
					.map(node => {
						const position = nodePositions.get(node.id);
						if (!position) return null;
						return (
							<NodeCard
								key={node.id}
								node={node}
								position={position}
								isSelected={selectedNode?.id === node.id}
								isEditable={isEditable}
								onClick={() => handleNodeClick(node)}
								onUpdate={(updates: Partial<AnyNode>) => handleNodeUpdate(node.id, updates)}
							/>
						);
					})}
			</div>

			{/* Node details panel */}
			{selectedNode && (
				<div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg p-4 z-20">
					<h3 className="text-lg font-semibold mb-2">Node Details</h3>
					<div className="space-y-2">
						<div>
							<label className="text-sm font-medium text-gray-600">Type:</label>
							<p className="text-sm">{selectedNode.type}</p>
						</div>{' '}
						<div>
							<label className="text-sm font-medium text-gray-600">Name:</label>
							<p className="text-sm">{selectedNode.name}</p>
						</div>
						{selectedNode.description && (
							<div>
								<label className="text-sm font-medium text-gray-600">Description:</label>
								<p className="text-sm">{selectedNode.description}</p>
							</div>
						)}
						<div>
							<label className="text-sm font-medium text-gray-600">Created:</label>
							<p className="text-sm">{new Date(selectedNode.createdAt).toLocaleString()}</p>
						</div>
						<div>
							<label className="text-sm font-medium text-gray-600">Updated:</label>
							<p className="text-sm">{new Date(selectedNode.updatedAt).toLocaleString()}</p>
						</div>
					</div>
					<button
						className="mt-4 text-sm text-blue-600 hover:text-blue-800"
						onClick={() => setSelectedNode(null)}
					>
						Close
					</button>
				</div>
			)}
		</div>
	);
};
