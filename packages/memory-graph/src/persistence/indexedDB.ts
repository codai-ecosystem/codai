import { MemoryGraph, MemoryGraphSchema } from '../schemas.js';
import { PersistenceAdapter, PersistenceOptions } from './types.js';

/**
 * Options specific to IndexedDB adapter
 */
export interface IndexedDBOptions extends PersistenceOptions {
	/**
	 * Database name for IndexedDB
	 */
	dbName?: string;

	/**
	 * Store name within the database
	 */
	storeName?: string;

	/**
	 * Database version
	 */
	dbVersion?: number;
}

/**
 * IndexedDBAdapter provides persistence using browser's IndexedDB API
 * This offers better performance and storage capacity compared to localStorage
 */
export class IndexedDBAdapter implements PersistenceAdapter {
	private dbName: string;
	private storeName: string;
	private dbVersion: number;
	private enableBackups: boolean;

	constructor(options?: IndexedDBOptions) {
		this.dbName = options?.dbName || 'aide_memory_graph_db';
		this.storeName = options?.storeName || 'memory_graphs';
		this.dbVersion = options?.dbVersion || 1;
		this.enableBackups = options?.enableBackups || false;
	}

	/**
	 * Open a connection to the IndexedDB database
	 */
	private openDB(): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			if (typeof indexedDB === 'undefined') {
				reject(new Error('IndexedDB is not available in this environment'));
				return;
			}

			const request = indexedDB.open(this.dbName, this.dbVersion);

			request.onerror = event => {
				reject(
					new Error(`Failed to open IndexedDB: ${(event.target as IDBRequest).error?.message}`)
				);
			};

			request.onsuccess = event => {
				resolve((event.target as IDBOpenDBRequest).result);
			};
			request.onupgradeneeded = event => {
				const db = (event.target as IDBOpenDBRequest).result;

				// Create object store if it doesn't exist
				if (!db.objectStoreNames.contains(this.storeName)) {
					const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
					store.createIndex('updatedAt', 'updatedAt', { unique: false });
				}

				// Create backups store if enabled and it doesn't exist
				if (this.enableBackups && !db.objectStoreNames.contains('backups')) {
					db.createObjectStore('backups', { keyPath: ['graphId', 'timestamp'] });
				}
			};
		});
	}

	/**
	 * Save memory graph to IndexedDB
	 */
	async save(graph: MemoryGraph): Promise<boolean> {
		try {
			const db = await this.openDB();

			// Update modified timestamp
			graph.updatedAt = new Date();

			// Create transaction
			const tx = db.transaction([this.storeName], 'readwrite');
			const store = tx.objectStore(this.storeName);

			// Create backup if enabled
			if (this.enableBackups) {
				try {
					const backupTx = db.transaction(['backups'], 'readwrite');
					const backupStore = backupTx.objectStore('backups');

					// Create a backup with timestamp
					const timestamp = new Date().toISOString();
					const backup = {
						...graph,
						graphId: graph.id,
						timestamp,
					};

					backupStore.add(backup);

					// Limit number of backups (keep last 10)
					const backupIndex = backupStore.index('graphId');
					const backupRequest = backupIndex.openCursor(IDBKeyRange.only(graph.id));

					let count = 0;
					const toDelete: Array<[string, string]> = [];

					backupRequest.onsuccess = event => {
						const cursor = (event.target as IDBRequest).result;
						if (cursor) {
							count++;
							if (count > 10) {
								toDelete.push([cursor.value.graphId, cursor.value.timestamp]);
							}
							cursor.continue();
						} else {
							// Delete old backups
							toDelete.forEach(key => {
								backupStore.delete(key);
							});
						}
					};
				} catch (error) {
					console.warn('Failed to create backup in IndexedDB', error);
					// Continue with save even if backup fails
				}
			} // Save the graph
			return new Promise((resolve, reject) => {
				const request = store.put(graph);

				request.onerror = () => {
					reject(new Error(`Failed to save graph to IndexedDB: ${request.error?.message}`));
				};

				request.onsuccess = () => {
					resolve(true);
				};

				tx.oncomplete = () => {
					db.close();
				};
			});
		} catch (error) {
			console.error('Failed to save graph to IndexedDB', error);
			return false;
		}
	}

	/**
	 * Load memory graph from IndexedDB
	 */
	async load(graphId?: string): Promise<MemoryGraph | null> {
		try {
			const db = await this.openDB();
			const tx = db.transaction(this.storeName, 'readonly');
			const store = tx.objectStore(this.storeName);

			return new Promise((resolve, reject) => {
				let request: IDBRequest;

				if (graphId) {
					// Load specific graph by ID
					request = store.get(graphId);
				} else {
					// Load the most recently updated graph
					const index = store.index('updatedAt');
					request = index.openCursor(null, 'prev');
				}
				request.onerror = () => {
					reject(new Error(`Failed to load graph from IndexedDB: ${request.error?.message}`));
				};

				request.onsuccess = event => {
					let result;

					if (graphId) {
						result = (event.target as IDBRequest).result;
					} else {
						// For cursor, get the first (most recent) item
						const cursor = (event.target as IDBRequest).result;
						result = cursor ? cursor.value : null;
					}

					if (!result) {
						resolve(null);
						return;
					}

					// Convert date strings back to Date objects if needed
					if (typeof result.createdAt === 'string') {
						result.createdAt = new Date(result.createdAt);
					}

					if (typeof result.updatedAt === 'string') {
						result.updatedAt = new Date(result.updatedAt);
					}

					try {
						// Validate with schema
						const validGraph = MemoryGraphSchema.parse(result);
						resolve(validGraph);
					} catch (error) {
						console.error('Loaded graph failed schema validation:', error);
						resolve(null);
					}
				};

				tx.oncomplete = () => {
					db.close();
				};
			});
		} catch (error) {
			console.error('Failed to load graph from IndexedDB', error);
			return null;
		}
	}

	/**
	 * Export graph to string format
	 */
	async exportGraph(format = 'json'): Promise<string> {
		try {
			const graph = await this.load();

			if (!graph) {
				throw new Error('No graph found to export');
			}

			if (format === 'json') {
				return JSON.stringify(graph, null, 2);
			} else {
				throw new Error(`Unsupported export format: ${format}`);
			}
		} catch (error) {
			console.error('Failed to export graph from IndexedDB', error);
			throw error;
		}
	}

	/**
	 * Import graph from string format
	 */
	async importGraph(data: string, format = 'json'): Promise<MemoryGraph | null> {
		try {
			let graph: MemoryGraph;

			if (format === 'json') {
				const parsed = JSON.parse(data);
				graph = MemoryGraphSchema.parse(parsed);
			} else {
				throw new Error(`Unsupported import format: ${format}`);
			}

			const success = await this.save(graph);
			return success ? graph : null;
		} catch (error) {
			console.error('Failed to import graph to IndexedDB', error);
			return null;
		}
	}

	/**
	 * List all available graphs in the database
	 */
	async listGraphs(): Promise<string[]> {
		try {
			const db = await this.openDB();
			const tx = db.transaction(this.storeName, 'readonly');
			const store = tx.objectStore(this.storeName);

			return new Promise((resolve, reject) => {
				const request = store.getAllKeys();
				request.onerror = () => {
					reject(new Error(`Failed to list graphs from IndexedDB: ${request.error?.message}`));
				};
				request.onsuccess = event => {
					const keys = (event.target as IDBRequest).result;
					resolve(keys.map((key: IDBValidKey) => key.toString()));
				};

				tx.oncomplete = () => {
					db.close();
				};
			});
		} catch (error) {
			console.error('Failed to list graphs from IndexedDB', error);
			return [];
		}
	}

	/**
	 * Delete a graph from the database
	 */
	async deleteGraph(graphId: string): Promise<boolean> {
		try {
			const db = await this.openDB();
			const tx = db.transaction(this.storeName, 'readwrite');
			const store = tx.objectStore(this.storeName);

			return new Promise((resolve, reject) => {
				const request = store.delete(graphId);
				request.onerror = () => {
					reject(new Error(`Failed to delete graph from IndexedDB: ${request.error?.message}`));
				};

				request.onsuccess = () => {
					resolve(true);
				};

				tx.oncomplete = () => {
					db.close();
				};
			});
		} catch (error) {
			console.error('Failed to delete graph from IndexedDB', error);
			return false;
		}
	}

	/**
	 * List available backups for a graph
	 */
	async listBackups(graphId: string): Promise<Array<{ graphId: string; timestamp: string }>> {
		if (!this.enableBackups) {
			return [];
		}

		try {
			const db = await this.openDB();

			if (!db.objectStoreNames.contains('backups')) {
				return [];
			}

			const tx = db.transaction('backups', 'readonly');
			const store = tx.objectStore('backups');

			return new Promise((resolve, reject) => {
				const request = store.index('graphId').getAll(graphId);
				request.onerror = () => {
					reject(new Error(`Failed to list backups from IndexedDB: ${request.error?.message}`));
				};
				request.onsuccess = event => {
					const backups = (event.target as IDBRequest).result;
					resolve(
						backups.map((backup: { graphId: string; timestamp: string }) => ({
							graphId: backup.graphId,
							timestamp: backup.timestamp,
						}))
					);
				};

				tx.oncomplete = () => {
					db.close();
				};
			});
		} catch (error) {
			console.error('Failed to list backups from IndexedDB', error);
			return [];
		}
	}

	/**
	 * Restore a graph from backup
	 */
	async restoreBackup(graphId: string, timestamp: string): Promise<MemoryGraph | null> {
		if (!this.enableBackups) {
			throw new Error('Backups are not enabled for this adapter');
		}

		try {
			const db = await this.openDB();

			if (!db.objectStoreNames.contains('backups')) {
				throw new Error('No backups store found in database');
			}

			const tx = db.transaction('backups', 'readonly');
			const store = tx.objectStore('backups');

			return new Promise((resolve, reject) => {
				const request = store.get([graphId, timestamp]);
				request.onerror = () => {
					reject(new Error(`Failed to retrieve backup from IndexedDB: ${request.error?.message}`));
				};

				request.onsuccess = async event => {
					const backup = (event.target as IDBRequest).result;

					if (!backup) {
						resolve(null);
						return;
					}

					// Remove backup-specific fields
					const { timestamp: _, graphId: __, ...graphData } = backup;

					try {
						// Validate with schema
						const validGraph = MemoryGraphSchema.parse(graphData);

						// Save the restored graph
						await this.save(validGraph);

						resolve(validGraph);
					} catch (error) {
						console.error('Backup failed schema validation:', error);
						resolve(null);
					}
				};

				tx.oncomplete = () => {
					db.close();
				};
			});
		} catch (error) {
			console.error('Failed to restore backup from IndexedDB', error);
			return null;
		}
	}
}
