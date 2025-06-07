/**
 * Persistence module for memory graph storage
 */
export * from './types.js';
export * from './localStorage.js';
export * from './fileSystem.js';
export * from './indexedDB.js';

import { PersistenceAdapter, PersistenceOptions } from './types.js';
import { LocalStorageAdapter } from './localStorage.js';
import { FileSystemAdapter } from './fileSystem.js';
import { IndexedDBAdapter, IndexedDBOptions } from './indexedDB.js';

/**
 * Factory function to create appropriate persistence adapter based on environment
 * @param type Adapter type to use
 * @param options Configuration options
 * @returns Initialized persistence adapter
 */
export function createPersistenceAdapter(
  type: 'local-storage' | 'file-system' | 'indexed-db' | 'auto' = 'auto',
  options?: PersistenceOptions
): PersistenceAdapter {
  // Auto-detect environment
  if (type === 'auto') {
    // Check if we're in a Node.js environment with filesystem access
    const isNodeEnv = typeof process !== 'undefined' &&
      typeof process.versions !== 'undefined' &&
      typeof process.versions.node !== 'undefined';

    if (isNodeEnv) {
      return new FileSystemAdapter(options);
    }

    // For browser environments, prefer IndexedDB if available
    if (typeof indexedDB !== 'undefined') {
      return new IndexedDBAdapter(options as IndexedDBOptions);
    }

    // Fall back to localStorage for older browsers
    return new LocalStorageAdapter(options);
  }

  // Explicit adapter selection
  if (type === 'indexed-db') {
    if (typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB is not available in this environment');
    }
    return new IndexedDBAdapter(options as IndexedDBOptions);
  }

  if (type === 'local-storage') {
    return new LocalStorageAdapter(options);
  }
  if (type === 'file-system') {
    return new FileSystemAdapter(options);
  }

  throw new Error(`Unsupported persistence adapter type: ${type}`);
}
