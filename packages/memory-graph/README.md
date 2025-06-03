# AIDE Memory Graph System

A comprehensive memory graph system for AIDE that tracks relationships between code entities, manages memory dependencies, and provides a structured way to represent project intent and state.

## Overview

The Memory Graph System replaces traditional source file management with a structured intent graph that captures:

- **Features** - High-level functionality and requirements
- **Screens** - UI components and user interfaces
- **Logic** - Business logic, functions, and services
- **Data Models** - Database schemas and data structures
- **APIs** - REST/GraphQL endpoints and interfaces
- **Tests** - Test cases and coverage information
- **Deployments** - Platform configurations and environments

## Key Components

### 1. Schema System (`src/schemas.ts`)

Defines comprehensive type-safe schemas using Zod for:

- Node types with specific properties for each domain
- Relationship types that connect nodes meaningfully
- Validation and type inference throughout the system

### 2. Memory Graph Engine (`src/engine.ts`)

Core reactive engine providing:

- CRUD operations for nodes and relationships
- Real-time event streams via RxJS observables
- Graph validation and cycle detection
- Immutable state management
- Import/export capabilities

### 3. Builder System (`src/builders.ts`)

Fluent API builders for creating nodes:

- Type-safe construction with method chaining
- Pre-configured templates for common patterns
- Validation at build time

### 4. Agent Runtime (`src/runtime.ts`)

High-level integration layer for AI agents:

- Intent-based node creation
- Conversation history tracking
- Graph analysis and metrics
- Query capabilities for agents

## Usage Examples

### Basic Usage

```typescript
import { AgentMemoryRuntime, createFeature, createScreen } from '@aide/memory-graph';

// Create a runtime instance
const runtime = new AgentMemoryRuntime({
	name: 'My AIDE Project',
	description: 'A new project using memory graphs',
});

// Add nodes via intents
const featureNodes = await runtime.addIntent({
	type: 'create_feature',
	data: {
		name: 'User Authentication',
		description: 'Implement user login system',
		priority: 'high',
		requirements: ['OAuth', 'Email verification'],
	},
});

// Create relationships
await runtime.addRelationship(featureId, screenId, 'contains', {
	description: 'Feature contains this screen',
});
```

### Direct Engine Usage

```typescript
import { MemoryGraphEngine, createApi } from '@aide/memory-graph';

const engine = new MemoryGraphEngine();

// Subscribe to changes
engine.changes$.subscribe(change => {
	console.log('Graph changed:', change);
});

// Add nodes directly
const apiNode = engine.addNode(
	createApi().name('User API').method('POST').path('/api/users').build()
);
```

### Query and Analysis

```typescript
// Find nodes by type
const features = await runtime.findNodesByType('feature');
const screens = await runtime.findNodesByType('screen');

// Find related nodes
const relatedNodes = await runtime.findRelatedNodes(nodeId, 'depends_on');

// Analyze the graph
const analysis = await runtime.analyzeGraph();
console.log('Complexity:', analysis.complexity);
console.log('Completeness:', analysis.completeness);
```

## Node Types

### Feature Node

High-level functionality with status tracking:

```typescript
{
  type: 'feature',
  name: 'User Authentication',
  status: 'planned' | 'in_progress' | 'implemented' | 'tested' | 'deployed',
  priority: 'low' | 'medium' | 'high' | 'critical',
  requirements: string[],
  acceptanceCriteria: string[]
}
```

### Screen Node

UI components and layouts:

```typescript
{
  type: 'screen',
  name: 'Login Page',
  screenType: 'page' | 'component' | 'modal' | 'layout',
  route: '/login',
  wireframe?: string, // Base64 encoded
  designSystem?: Record<string, unknown>
}
```

### Logic Node

Business logic and functions:

```typescript
{
  type: 'logic',
  name: 'User Service',
  logicType: 'function' | 'class' | 'hook' | 'service' | 'utility' | 'middleware',
  inputs?: Array<{name: string, type: string, description?: string}>,
  outputs?: {type: string, description?: string},
  implementation?: string // Generated code
}
```

### Data Model Node

Database schemas and models:

```typescript
{
  type: 'data_model',
  name: 'User',
  modelType: 'entity' | 'dto' | 'enum' | 'interface',
  fields: Array<{
    name: string,
    type: string,
    required: boolean,
    unique: boolean,
    description?: string,
    validation?: Record<string, unknown>
  }>,
  relationships?: Array<{
    type: 'one_to_one' | 'one_to_many' | 'many_to_many',
    target: string,
    foreignKey?: string
  }>
}
```

### API Node

REST/GraphQL endpoints:

```typescript
{
  type: 'api',
  name: 'Get User Profile',
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: '/api/user/profile',
  requestSchema?: Record<string, unknown>,
  responseSchema?: Record<string, unknown>,
  authentication?: 'none' | 'bearer' | 'api_key' | 'oauth',
  rateLimit?: number
}
```

## Relationship Types

- **contains** - Parent contains child component
- **depends_on** - Node depends on another for functionality
- **implements** - Implementation of an interface/contract
- **extends** - Inheritance or extension relationship
- **uses** - Utilizes another component/service
- **configures** - Configuration relationship
- **tests** - Testing relationship

## Integration with AIDE

The memory graph system integrates with AIDE by:

1. **Replacing file-based state** with intent-based graph state
2. **Providing agent APIs** for high-level operations
3. **Tracking conversation history** and context
4. **Enabling graph analysis** for project insights
5. **Supporting export/import** for persistence

## Events and Reactivity

The system provides real-time event streams:

```typescript
// Subscribe to all changes
engine.changes$.subscribe(change => {
	switch (change.type) {
		case 'node_added':
			console.log('Node added:', change.node);
			break;
		case 'node_updated':
			console.log('Node updated:', change.node);
			break;
		case 'relationship_added':
			console.log('Relationship added:', change.relationship);
			break;
	}
});

// Subscribe to current graph state
engine.graph$.subscribe(graph => {
	console.log('Graph updated:', graph);
});
```

## Validation and Analysis

Built-in validation includes:

- Schema validation for all nodes and relationships
- Cycle detection in dependency chains
- Orphaned node detection
- Graph completeness metrics
- Complexity analysis

## Future Enhancements

Planned features include:

- React visualization components
- Advanced graph algorithms (shortest path, clustering)
- Integration with VS Code extension APIs
- Real-time collaboration features
- Advanced query language
- Graph diffing and merging
- Performance optimizations for large graphs

## API Reference

See the TypeScript definitions in `dist/` for complete API documentation with full type information.
