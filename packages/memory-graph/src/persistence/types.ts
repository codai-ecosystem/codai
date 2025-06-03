import { MemoryGraph } from '../schemas';

/**
 * Interface for persistence adapters to store and retrieve memory graphs
 */
export interface PersistenceAdapter {
  /**
   * Save a memory graph to storage
   * @param graph The memory graph to save
   * @returns Promise resolving to true if save successful
   */
  save(graph: MemoryGraph): Promise<boolean>;

  /**
   * Load a memory graph from storage
   * @param graphId Optional ID of specific graph to load
   * @returns Promise resolving to MemoryGraph or null if not found
   */
  load(graphId?: string): Promise<MemoryGraph | null>;

  /**
   * Export graph to a serialized format
   * @param format Format to export as (json, yaml, etc.)
   * @returns Promise resolving to serialized graph data
   */
  exportGraph(format?: string): Promise<string>;

  /**
   * Import graph from serialized data
   * @param data Serialized graph data
   * @param format Format of the data (json, yaml, etc.)
   * @returns Promise resolving to parsed MemoryGraph or null if invalid
   */
  importGraph(data: string, format?: string): Promise<MemoryGraph | null>;

  /**
   * List available graphs in storage
   * @returns Promise resolving to array of graph IDs
   */
  listGraphs(): Promise<string[]>;

  /**
   * Delete a graph from storage
   * @param graphId ID of graph to delete
   * @returns Promise resolving to true if deletion successful
   */
  deleteGraph(graphId: string): Promise<boolean>;
}

/**
 * Configuration options for persistence adapters
 */
export interface PersistenceOptions {
  /**
   * Storage key/path/identifier for the adapter
   */
  storageKey?: string;

  /**
   * Optional encryption key for secured storage
   */
  encryptionKey?: string;

  /**
   * Whether to enable automatic backups
   */
  enableBackups?: boolean;

  /**
   * Custom adapter-specific options
   */
  [key: string]: any;
}

/**
 * Result of a persistence operation
 */
export interface PersistenceResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error | string;
}
