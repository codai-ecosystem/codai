import { MemoryGraph } from '../schemas';

/**
 * Migration interface for schema upgrades
 */
export interface Migration {
  /**
   * Version this migration upgrades from
   */
  fromVersion: string;

  /**
   * Version this migration upgrades to
   */
  toVersion: string;

  /**
   * Apply migration to the graph
   * @param graph Graph to migrate
   * @returns Migrated graph
   */
  migrate(graph: MemoryGraph): MemoryGraph;
}

/**
 * Migration system for memory graph schemas
 */
export class MigrationSystem {
  private migrations: Migration[] = [];

  /**
   * Register a migration with the system
   * @param migration Migration to register
   */
  register(migration: Migration): void {
    this.migrations.push(migration);
    // Sort migrations by fromVersion
    this.migrations.sort((a, b) => {
      const versionA = a.fromVersion.split('.').map(Number);
      const versionB = b.fromVersion.split('.').map(Number);

      for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
        const partA = versionA[i] || 0;
        const partB = versionB[i] || 0;
        if (partA !== partB) {
          return partA - partB;
        }
      }

      return 0;
    });
  }

  /**
   * Find migration path from source to target version
   * @param fromVersion Starting version
   * @param toVersion Target version
   * @returns Array of migrations to apply in order
   */
  private findMigrationPath(fromVersion: string, toVersion: string): Migration[] {
    const result: Migration[] = [];
    let currentVersion = fromVersion;

    while (currentVersion !== toVersion) {
      const nextMigration = this.migrations.find(m => m.fromVersion === currentVersion);

      if (!nextMigration) {
        throw new Error(`No migration path found from ${fromVersion} to ${toVersion}`);
      }

      result.push(nextMigration);
      currentVersion = nextMigration.toVersion;

      // Safety check to prevent infinite loops
      if (result.length > 100) {
        throw new Error('Migration path too long, possible circular dependency');
      }
    }

    return result;
  }

  /**
   * Apply migrations to upgrade a graph to the target version
   * @param graph Graph to migrate
   * @param targetVersion Target schema version
   * @returns Migrated graph
   */
  migrateGraph(graph: MemoryGraph, targetVersion: string): MemoryGraph {
    if (graph.version === targetVersion) {
      return graph; // Already at target version
    }

    const migrationPath = this.findMigrationPath(graph.version, targetVersion);

    let migratedGraph = { ...graph };
    for (const migration of migrationPath) {
      console.log(`Migrating graph from ${migration.fromVersion} to ${migration.toVersion}`);
      migratedGraph = migration.migrate(migratedGraph);
    }

    return migratedGraph;
  }
}

/**
 * Factory function to create a migration system with built-in migrations
 * @returns Configured migration system
 */
export function createMigrationSystem(): MigrationSystem {
  const system = new MigrationSystem();

  // Register core migrations
  // Initial 0.1.0 to 0.2.0 migration example
  system.register({
    fromVersion: '0.1.0',
    toVersion: '0.2.0', migrate: (graph: MemoryGraph): MemoryGraph => {
      // Update to version 0.2.0
      return {
        ...graph,
        version: '0.2.0',
        // Add any other migration logic here
        // If metadata structure needs to change, use type assertion to allow new fields
        metadata: {
          ...graph.metadata,
          // Update any metadata fields safely without type errors
        }
      };
    }
  });

  return system;
}
