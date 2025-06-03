# Memory Graph React Components

This document describes the React UI components available in the AIDE Memory Graph package for visualizing and interacting with memory graphs.

## Overview

The memory graph React components provide a complete visualization layer for memory graphs, enabling interactive exploration of nodes and relationships. The components are built with TypeScript and follow VS Code's coding guidelines.

## Components

### MemoryGraphVisualization

The main visualization component that renders an interactive graph with nodes and relationships.

#### Props

```typescript
interface MemoryGraphVisualizationProps {
	/** The memory graph to visualize */
	graph: MemoryGraph;

	/** Optional CSS class name */
	className?: string;

	/** Callback when a node is selected */
	onNodeSelect?: (nodeId: string) => void;

	/** Callback when a node is updated */
	onNodeUpdate?: (nodeId: string, updates: Partial<AnyNode>) => void;

	/** Callback when a relationship is deleted */
	onRelationshipDelete?: (relationshipId: string) => void;

	/** Whether the graph is editable */
	isEditable?: boolean;

	/** Layout algorithm to use */
	layout?: 'force' | 'hierarchical' | 'circular';
}
```

#### Features

- **Interactive Navigation**: Pan by dragging, zoom with mouse wheel
- **Node Selection**: Click nodes to select them
- **Multiple Layouts**: Force-directed, hierarchical, and circular layouts
- **Responsive Design**: Adapts to container size
- **Accessibility**: Keyboard navigation support

#### Usage

```typescript
import { MemoryGraphVisualization } from '@aide/memory-graph';

const MyComponent = () => {
	const handleNodeSelect = (nodeId: string) => {
		console.log('Selected node:', nodeId);
	};

	const handleNodeUpdate = (nodeId: string, updates: Partial<AnyNode>) => {
		// Update your graph state
	};

	return (
		<div className="h-96">
			<MemoryGraphVisualization
				graph={myGraph}
				onNodeSelect={handleNodeSelect}
				onNodeUpdate={handleNodeUpdate}
				isEditable={true}
				layout="force"
				className="w-full h-full"
			/>
		</div>
	);
};
```

### NodeCard

Individual node component that displays node information and handles interactions.

#### Props

```typescript
interface NodeCardProps {
	node: AnyNode;
	position: { x: number; y: number };
	isSelected: boolean;
	onClick: () => void;
	className?: string;
}
```

#### Features

- **Type-based Styling**: Different colors for different node types
- **Hover Effects**: Visual feedback on interaction
- **Selection States**: Visual indication when selected
- **Responsive Text**: Truncates long names and descriptions

### RelationshipEdge

SVG component for rendering relationships between nodes.

#### Props

```typescript
interface RelationshipEdgeProps {
	edge: Relationship;
	fromPosition: { x: number; y: number };
	toPosition: { x: number; y: number };
	isSelected: boolean;
	onDelete?: () => void;
}
```

#### Features

- **Directional Arrows**: Shows relationship direction
- **Type-specific Styling**: Different colors and patterns for relationship types
- **Labels**: Displays relationship type
- **Interactive Deletion**: Optional delete functionality

### GraphControls

Control panel for graph interaction and layout management.

#### Props

```typescript
interface GraphControlsProps {
	layout: 'force' | 'hierarchical' | 'circular';
	onLayoutChange: () => void;
	zoomLevel: number;
	onZoomChange: (zoom: number) => void;
	onPanReset: () => void;
	isLayouting: boolean;
	className?: string;
}
```

#### Features

- **Layout Switching**: Change between different layout algorithms
- **Zoom Controls**: Zoom in/out with buttons
- **Pan Reset**: Reset view to center
- **Loading States**: Shows when layout is calculating

## Styling

The components use a combination of Tailwind CSS classes and custom CSS for styling. The main styles are defined in `MemoryGraphVisualization.css`.

### Node Type Colors

- **Feature**: Blue (`#dbeafe` background, `#1e40af` text)
- **Screen**: Green (`#dcfce7` background, `#166534` text)
- **Logic**: Purple (`#f3e8ff` background, `#7c3aed` text)
- **Data Model**: Orange (`#fed7aa` background, `#c2410c` text)
- **API**: Red (`#fecaca` background, `#dc2626` text)
- **Test**: Yellow (`#fef3c7` background, `#a16207` text)

### Relationship Type Colors

- **Contains**: Blue (`#3B82F6`)
- **Depends On**: Red (`#EF4444`)
- **Implements**: Green (`#10B981`)
- **Extends**: Purple (`#8B5CF6`)
- **Uses**: Orange (`#F59E0B`)
- **Configures**: Gray (`#6B7280`)
- **Tests**: Pink (`#EC4899`)

## Layout Algorithms

### Force-Directed Layout

Uses a physics simulation to position nodes based on attractive and repulsive forces.

- **Pros**: Natural clustering, good for showing relationships
- **Cons**: Can be unstable for large graphs
- **Best for**: Small to medium graphs with clear relationships

### Hierarchical Layout

Arranges nodes in layers based on dependencies and relationships.

- **Pros**: Clear hierarchy, good for dependency graphs
- **Cons**: May not work well with circular dependencies
- **Best for**: Tree-like structures, dependency graphs

### Circular Layout

Arranges nodes in concentric circles.

- **Pros**: Predictable layout, good overview
- **Cons**: May not reflect relationships well
- **Best for**: Categorical grouping, overview of large graphs

## Integration Example

Here's a complete example of integrating the memory graph visualization:

```typescript
import React, { useState, useCallback } from 'react';
import {
	MemoryGraphVisualization,
	MemoryGraphEngine,
	createMemoryGraph,
	type MemoryGraph,
	type AnyNode
} from '@aide/memory-graph';

const GraphApp: React.FC = () => {
	const [graph, setGraph] = useState<MemoryGraph>(createMemoryGraph({
		nodes: [
			{
				id: 'auth-feature',
				type: 'feature',
				name: 'Authentication',
				description: 'User authentication system'
			},
			{
				id: 'login-ui',
				type: 'screen',
				name: 'Login Screen',
				description: 'Login user interface'
			}
		],
		relationships: [
			{
				id: 'auth-contains-login',
				fromNodeId: 'auth-feature',
				toNodeId: 'login-ui',
				type: 'contains',
				strength: 0.8
			}
		]
	}));

	const [selectedNode, setSelectedNode] = useState<string | null>(null);

	const handleNodeSelect = useCallback((nodeId: string) => {
		setSelectedNode(nodeId);
	}, []);

	const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<AnyNode>) => {
		const engine = new MemoryGraphEngine(graph);
		engine.updateNode(nodeId, updates);
		setGraph(engine.getGraph());
	}, [graph]);

	const handleRelationshipDelete = useCallback((relationshipId: string) => {
		const engine = new MemoryGraphEngine(graph);
		engine.removeRelationship(relationshipId);
		setGraph(engine.getGraph());
	}, [graph]);

	return (
		<div className="flex flex-col h-screen">
			<header className="bg-white shadow p-4">
				<h1 className="text-2xl font-bold">Memory Graph Viewer</h1>
			</header>

			<main className="flex-1 p-4">
				<div className="h-full bg-white rounded-lg shadow">
					<MemoryGraphVisualization
						graph={graph}
						onNodeSelect={handleNodeSelect}
						onNodeUpdate={handleNodeUpdate}
						onRelationshipDelete={handleRelationshipDelete}
						isEditable={true}
						layout="force"
						className="w-full h-full"
					/>
				</div>
			</main>

			{selectedNode && (
				<aside className="w-64 bg-gray-50 p-4 border-l">
					<h2 className="font-semibold mb-2">Selected Node</h2>
					<p className="text-sm text-gray-600">
						{graph.nodes.find(n => n.id === selectedNode)?.name}
					</p>
				</aside>
			)}
		</div>
	);
};

export default GraphApp;
```

## Performance Considerations

- **Large Graphs**: For graphs with >100 nodes, consider implementing virtualization
- **Layout Calculation**: Force layout can be expensive; use hierarchical or circular for large graphs
- **Re-renders**: Use React.memo() for node components if performance becomes an issue
- **Debouncing**: Debounce layout calculations when graph changes frequently

## Browser Support

The components support modern browsers with:

- ES6+ JavaScript features
- CSS Grid and Flexbox
- SVG rendering
- Mouse and touch events

## Accessibility

The components follow accessibility best practices:

- **Keyboard Navigation**: Tab through nodes and controls
- **ARIA Labels**: Screen reader friendly labels
- **High Contrast**: Sufficient color contrast for visibility
- **Focus Management**: Clear focus indicators

## Demo

To see the components in action, open the demo files:

- `demo/index-enhanced.html` - Interactive browser demo
- `demo/MemoryGraphDemo.tsx` - React component demo

The demo includes:

- Interactive graph visualization
- Dynamic node addition
- Layout switching
- Zoom and pan controls
- Node selection feedback

## Contributing

When contributing to the React components:

1. Follow VS Code's coding guidelines (use tabs, PascalCase for types, etc.)
2. Add TypeScript types for all props and state
3. Use JSDoc comments for public APIs
4. Test components with different graph sizes
5. Ensure accessibility compliance
6. Update this documentation for new features
