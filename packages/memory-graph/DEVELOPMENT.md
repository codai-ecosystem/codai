# Memory Graph Development Guide

The Memory Graph is the core data persistence layer of AIDE. It stores and manages relationships between project components, user intents, and generated artifacts.

## Overview

The memory graph is a specialized graph database structure that represents:

1. **Intent Nodes** - User requirements and goals
2. **Implementation Nodes** - Code, documentation, and other generated artifacts
3. **Relationship Edges** - Connections between nodes (implements, depends-on, etc.)

## Core Concepts

### Node Types

- `IntentNode` - Represents user requirements, feature requests, or goals
- `CodeNode` - Represents actual code implementations
- `DocumentationNode` - Represents documentation
- `ResourceNode` - Represents external resources

## Module Documentation

- [Persistence Layer](./docs/persistence.md) - Storage and retrieval system
- `TestNode` - Represents tests for code nodes

### Edge Types

- `ImplementsEdge` - Shows that one node implements another node's intent
- `DependsOnEdge` - Shows dependencies between nodes
- `TestsEdge` - Links test nodes to the code they test
- `RefinesEdge` - Shows that one intent node refines another

## Usage Example

```typescript
import { MemoryGraphEngine, IntentNode, CodeNode, ImplementsEdge } from '@dragoscatalin/memory-graph';

// Initialize the memory graph
const memoryGraph = new MemoryGraphEngine();

// Create a feature intent node
const loginFeature = await memoryGraph.createNode({
	type: 'intent',
	name: 'User Authentication',
	description: 'Allow users to log in with username/password',
	priority: 'high',
});

// Create a code implementation node
const loginComponent = await memoryGraph.createNode({
	type: 'code',
	name: 'LoginComponent',
	language: 'typescript',
	path: 'src/components/Login.tsx',
	content: '// Code content here',
});

// Connect the implementation to the intent
await memoryGraph.createEdge({
	type: 'implements',
	from: loginComponent.id,
	to: loginFeature.id,
	metadata: {
		completeness: 0.8,
		createdAt: new Date(),
	},
});

// Query the graph
const implementations = await memoryGraph.findConnectedNodes({
	nodeId: loginFeature.id,
	edgeType: 'implements',
	direction: 'incoming',
});
```

## Development Workflow

When working with the memory graph:

1. Define new node types in `src/schemas/nodes.ts`
2. Define new edge types in `src/schemas/edges.ts`
3. Use the engine API in `src/engine/MemoryGraphEngine.ts`
4. Create builders in `src/builders/` for complex graph operations

## Persistence

The memory graph is persisted in two ways:

1. **In-memory** - During active sessions
2. **File-based** - Serialized to JSON files in `.aide/memory/` directory

## Visualization

The memory graph can be visualized using:

- React Flow components in `src/components/MemoryGraphVisualization.tsx`
- D3.js renderers for custom visualizations

## Testing

When writing tests for memory graph operations:

1. Use `createTestMemoryGraph()` to create isolated test instances
2. Mock file system operations if needed
3. Test complex graph queries with known fixture data

## Best Practices

1. Always use transactions for multi-operation changes
2. Keep node data lightweight; store large content separately
3. Use typed schemas for all nodes and edges
4. Leverage the reactivity system for live updates
