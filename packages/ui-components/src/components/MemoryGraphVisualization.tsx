import React, { useEffect, useRef, useState, MouseEvent, WheelEvent, KeyboardEvent } from 'react';
import { Search, Filter, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { AnyNode, Relationship } from '@aide/memory-graph';
import { NodeCard } from './NodeCard';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { PositionedNode } from './PositionedNode';
import { TransformedContainer } from './TransformedContainer';
import { MemoryGraphVisualizationProps } from '../types';
import { getRelationshipTypeClass } from './utils/graph-helpers';
import './styles/MemoryGraphVisualization.css';

/**
 * Interactive memory graph visualization
 * Shows the project's memory structure as connected nodes
 */
export const MemoryGraphVisualization: React.FC<MemoryGraphVisualizationProps> = ({
	nodes,
	relationships,
	selectedNodeId,
	onNodeSelect,
	onNodeEdit,
	layout = 'force',
	className = '',
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [filterType, setFilterType] = useState<string>('all');
	const [zoom, setZoom] = useState(1);
	const [pan, setPan] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

	// Filter nodes based on search and type filter
	const filteredNodes = nodes.filter((node) => {
		const matchesSearch = searchTerm === '' ||
			node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			node.description?.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesType = filterType === 'all' || node.type === filterType;

		return matchesSearch && matchesType;
	});

	// Get unique node types for filter
	const nodeTypes = Array.from(new Set(nodes.map(n => n.type)));

	// Calculate node positions based on layout
	const getNodePositions = () => {
		const positions = new Map<string, { x: number; y: number }>();

		if (layout === 'hierarchical') {
			// Group nodes by type and arrange hierarchically
			const typeGroups = new Map<string, AnyNode[]>();
			filteredNodes.forEach(node => {
				const group = typeGroups.get(node.type) || [];
				group.push(node);
				typeGroups.set(node.type, group);
			});

			let yOffset = 0;
			typeGroups.forEach((typeNodes, type) => {
				typeNodes.forEach((node, index) => {
					positions.set(node.id, {
						x: (index % 4) * 250 + 50,
						y: yOffset + Math.floor(index / 4) * 150,
					});
				});
				yOffset += Math.ceil(typeNodes.length / 4) * 150 + 100;
			});
		} else if (layout === 'circular') {
			// Arrange nodes in concentric circles by type
			const radius = 200;
			const typeGroups = new Map<string, AnyNode[]>();
			filteredNodes.forEach(node => {
				const group = typeGroups.get(node.type) || [];
				group.push(node);
				typeGroups.set(node.type, group);
			});

			let ringIndex = 0;
			typeGroups.forEach((typeNodes) => {
				const angleStep = (2 * Math.PI) / typeNodes.length;
				typeNodes.forEach((node, index) => {
					const angle = index * angleStep;
					const currentRadius = radius + (ringIndex * 120);
					positions.set(node.id, {
						x: 400 + currentRadius * Math.cos(angle),
						y: 300 + currentRadius * Math.sin(angle),
					});
				});
				ringIndex++;
			});
		} else {
			// Simplified grid layout as fallback
			filteredNodes.forEach((node, index) => {
				positions.set(node.id, {
					x: (index % 5) * 200 + 50,
					y: Math.floor(index / 5) * 180 + 50,
				});
			});
		}

		return positions;
	};

	const nodePositions = getNodePositions();

	const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
	const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
	const handleResetView = () => {
		setZoom(1);
		setPan({ x: 0, y: 0 });
	};

	// Mouse interaction handlers for panning
	const handleMouseDown = (e: MouseEvent) => {
		// Only start dragging on middle mouse button or when holding space key
		if (e.button === 1 || (e.button === 0 && e.altKey)) {
			setIsDragging(true);
			setDragStart({ x: e.clientX, y: e.clientY });
			e.preventDefault();
		}
	};

	const handleMouseMove = (e: MouseEvent) => {
		if (isDragging) {
			const deltaX = (e.clientX - dragStart.x) / zoom;
			const deltaY = (e.clientY - dragStart.y) / zoom;
			setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
			setDragStart({ x: e.clientX, y: e.clientY });
		}
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	// Wheel interaction for zooming
	const handleWheel = (e: WheelEvent) => {
		if (e.ctrlKey || e.metaKey) {
			e.preventDefault();
			const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
			setZoom(prev => {
				const newZoom = prev * scaleFactor;
				return Math.min(Math.max(newZoom, 0.3), 3);
			});
		}
	};

	// Keyboard navigation
	const handleKeyDown = (e: KeyboardEvent) => {
		const panStep = 20 / zoom;

		switch (e.key) {
			case 'ArrowUp':
				setPan(prev => ({ x: prev.x, y: prev.y + panStep }));
				e.preventDefault();
				break;
			case 'ArrowDown':
				setPan(prev => ({ x: prev.x, y: prev.y - panStep }));
				e.preventDefault();
				break;
			case 'ArrowLeft':
				setPan(prev => ({ x: prev.x + panStep, y: prev.y }));
				e.preventDefault();
				break;
			case 'ArrowRight':
				setPan(prev => ({ x: prev.x - panStep, y: prev.y }));
				e.preventDefault();
				break;
			case '0':
				// Reset view when pressing '0'
				if (e.ctrlKey) {
					handleResetView();
					e.preventDefault();
				}
				break;
			case '=':
				// Zoom in with Ctrl/Cmd +
				if (e.ctrlKey || e.metaKey) {
					handleZoomIn();
					e.preventDefault();
				}
				break;
			case '-':
				// Zoom out with Ctrl/Cmd -
				if (e.ctrlKey || e.metaKey) {
					handleZoomOut();
					e.preventDefault();
				}
				break;
		}
	};

	// Calculate relationship metadata for each node
	const getNodeMetadata = (nodeId: string) => {
		const nodeRelationships = relationships.filter(
			r => r.fromNodeId === nodeId || r.toNodeId === nodeId
		);

		return {
			relationshipCount: nodeRelationships.length
		};
	};

	// Set up event listeners
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		// Add keyboard event listeners
		container.tabIndex = 0; // Make container focusable
		container.addEventListener('keydown', handleKeyDown as any);

		return () => {
			container.removeEventListener('keydown', handleKeyDown as any);
		};
	}, [zoom]); // Re-add when zoom changes to keep the pan step calculation updated

	return (
		<div
			className={`aide-memory-graph ${className}`}
			role="region"
			aria-label="Memory Graph Visualization"
		>
			{/* Controls */}
			<div className="memory-graph-controls">
				<div className="memory-graph-search">
					<Search className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
					<Input
						placeholder="Search nodes..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="flex-1"
						aria-label="Search nodes"
					/>
				</div>

				<div className="memory-graph-filters">
					<Filter className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
					<select
						value={filterType}
						onChange={(e) => setFilterType(e.target.value)}
						className="bg-background border border-input rounded-md px-2 py-1 text-sm"
						aria-label="Filter by node type"
					>
						<option value="all">All Types</option>
						{nodeTypes.map(type => (
							<option key={type} value={type}>
								{type.charAt(0).toUpperCase() + type.slice(1)}
							</option>
						))}
					</select>
				</div>

				<div className="memory-graph-zoom" role="toolbar" aria-label="Zoom controls">
					<Button size="sm" variant="outline" onClick={handleZoomOut} aria-label="Zoom out">
						<ZoomOut className="w-4 h-4" aria-hidden="true" />
					</Button>
					<Button size="sm" variant="outline" onClick={handleZoomIn} aria-label="Zoom in">
						<ZoomIn className="w-4 h-4" aria-hidden="true" />
					</Button>
					<Button size="sm" variant="outline" onClick={handleResetView} aria-label="Reset view">
						<Maximize2 className="w-4 h-4" aria-hidden="true" />
					</Button>				</div>
			</div>

			{/* Graph Canvas */}
			<TransformedContainer
				zoom={zoom}
				panX={pan.x}
				panY={pan.y}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
				onWheel={handleWheel}
			>
				{/* Connection lines */}
				<svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
					<defs>
						{/* Arrow markers for different relationship types */}
						<marker
							id="arrow-depends"
							markerWidth="10"
							markerHeight="10"
							refX="9"
							refY="3"
							orient="auto"
							markerUnits="strokeWidth"
						>
							<path d="M0,0 L0,6 L9,3 z" fill="hsl(var(--border))" />
						</marker>
						<marker
							id="arrow-implements"
							markerWidth="10"
							markerHeight="10"
							refX="9"
							refY="3"
							orient="auto"
							markerUnits="strokeWidth"
						>
							<path d="M0,0 L0,6 L9,3 z" fill="hsl(var(--primary))" />
						</marker>
					</defs>

					{/* Draw relationships */}
					{relationships.map(relationship => {
						// Only draw connections between filtered nodes
						const fromNode = filteredNodes.find(n => n.id === relationship.fromNodeId);
						const toNode = filteredNodes.find(n => n.id === relationship.toNodeId);

						if (!fromNode || !toNode) return null;

						const fromPos = nodePositions.get(fromNode.id);
						const toPos = nodePositions.get(toNode.id);

						if (!fromPos || !toPos) return null;

						// Determine line style based on relationship type
						let strokeStyle = "1";
						let strokeColor = "hsl(var(--border))";
						let markerEnd = "";

						switch (relationship.type) {
							case 'depends_on':
								strokeStyle = "4,2";
								markerEnd = "url(#arrow-depends)";
								break;
							case 'implements':
								strokeStyle = "1,0";
								strokeColor = "hsl(var(--primary))";
								markerEnd = "url(#arrow-implements)";
								break;
							case 'extends':
								strokeStyle = "1,0";
								strokeColor = "hsl(var(--primary))";
								break;
							case 'contains':
								strokeStyle = "0";
								break;
							default:
								strokeStyle = "4,4";
						}

						// Offset the connection points to connect to the edge of the cards
						const fromX = fromPos.x + 100;
						const fromY = fromPos.y + 50;
						const toX = toPos.x + 100;
						const toY = toPos.y + 50;

						return (
							<line
								key={relationship.id}
								x1={fromX}
								y1={fromY}
								x2={toX}
								y2={toY}
								stroke={strokeColor}
								strokeWidth="1"
								strokeDasharray={strokeStyle}
								markerEnd={markerEnd}
								className={getRelationshipTypeClass(relationship.type)}
							/>
						);
					})}
				</svg>

				{/* Nodes */}
				{filteredNodes.map(node => {
					const position = nodePositions.get(node.id);
					if (!position) return null;

					return (
						<PositionedNode
							key={node.id}
							x={position.x}
							y={position.y}
							nodeId={node.id}
							nodeType={node.type}
							isSelected={selectedNodeId === node.id}
						>
							<NodeCard
								node={node}
								metadata={getNodeMetadata(node.id)}
								isSelected={selectedNodeId === node.id}
								isEditable={!!onNodeEdit}
								onSelect={() => onNodeSelect?.(node.id)}
								onEdit={(updates) => onNodeEdit?.(node.id, updates)}
								className="cursor-pointer hover:scale-105 transition-transform"
							/>
						</PositionedNode>
					);
				})}

				{/* Empty state */}
				{filteredNodes.length === 0 && (
					<div className="memory-graph-empty">
						<div className="text-center">
							<h3 className="text-lg font-semibold mb-2">No nodes found</h3>
							<p>
								{searchTerm || filterType !== 'all'
									? 'Try adjusting your search or filter criteria'
									: 'Start a conversation to build your project'
								}
							</p>
						</div>
					</div>
				)}
			</TransformedContainer>
		</div>
	);
};
