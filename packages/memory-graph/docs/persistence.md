# Persistence Layer Guide

The Memory Graph persistence layer manages storing and retrieving graphs across different environments.

## Architecture Overview

The persistence system follows a **modular adapter pattern** that allows:

1. Different storage backends to be used interchangeably
2. Environment-specific adapters (browser, desktop, server)
3. Schema migration support for evolving data models

## Adapter Interface

All persistence adapters implement the `PersistenceAdapter` interface:

```typescript
interface PersistenceAdapter {
	save(graph: MemoryGraph): Promise<boolean>;
	load(graphId?: string): Promise<MemoryGraph | null>;
	exportGraph(format?: string): Promise<string>;
	importGraph(data: string, format?: string): Promise<MemoryGraph | null>;
	listGraphs(): Promise<string[]>;
	deleteGraph(graphId: string): Promise<boolean>;
}
```

## Available Adapters

### LocalStorageAdapter

Uses browser's localStorage API for persistence:

```typescript
import { LocalStorageAdapter } from '@codai/memory-graph';

const adapter = new LocalStorageAdapter({
	storageKey: 'my-project-graph',
	enableBackups: true,
});
```

### FileSystemAdapter

Uses Node.js filesystem for storage in desktop environments:

```typescript
import { FileSystemAdapter } from '@codai/memory-graph';

const adapter = new FileSystemAdapter({
	storageKey: './data/graphs',
	enableBackups: true,
});
```

## Factory Usage

The library provides a factory function to automatically choose the appropriate adapter:

```typescript
import { createPersistenceAdapter } from '@codai/memory-graph';

// Auto-detect environment
const adapter = createPersistenceAdapter('auto');

// Explicitly select adapter
const localAdapter = createPersistenceAdapter('local-storage');
```

## Migration System

The graph persistence layer includes a migration system that:

1. Automatically detects graph schema versions
2. Applies necessary migrations in sequence
3. Upgrades older graphs to the latest schema

### Using migrations:

```typescript
import { createMigrationSystem } from '@codai/memory-graph';

const migrationSystem = createMigrationSystem();
const migratedGraph = migrationSystem.migrateGraph(oldGraph, '0.2.0');
```

### Creating Custom Migrations

```typescript
import { Migration } from '@codai/memory-graph';

const migration: Migration = {
	fromVersion: '0.1.0',
	toVersion: '0.2.0',
	migrate: graph => {
		// Apply transformations
		return {
			...graph,
			version: '0.2.0',
			// Additional changes
		};
	},
};
```

## Best Practices

1. **Error Handling**: Always handle promise rejections from persistence methods
2. **Backup Strategy**: Enable backups when working with critical data
3. **Version Control**: Explicitly set graph versions when creating new graphs
4. **Format Support**: Use JSON for best compatibility across adapters

## Implementation Examples

### Basic Save/Load

```typescript
import { MemoryGraphEngine } from '@aide/memory-graph';

const engine = new MemoryGraphEngine();

// Save current state
await engine.saveGraph();

// Load a specific graph
await engine.loadGraph('graph-123');
```

### Export/Import

```typescript
import { MemoryGraphEngine } from '@aide/memory-graph';

const engine = new MemoryGraphEngine();

// Export to JSON
const jsonData = await engine.exportGraph('json');

// Import from JSON
await engine.importGraph(jsonData, 'json');
```

### Custom Storage Location

```typescript
import { MemoryGraphEngine, FileSystemAdapter } from '@aide/memory-graph';

// Create custom adapter
const adapter = new FileSystemAdapter({
	storageKey: './custom/path',
	enableBackups: true,
});

// Use adapter with engine
const engine = new MemoryGraphEngine({}, adapter);
```
