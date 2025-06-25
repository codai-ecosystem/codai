import { MemoryGraphSchema } from '../schemas';
/**
 * IndexedDBAdapter provides persistence using browser's IndexedDB API
 * This offers better performance and storage capacity compared to localStorage
 */
export class IndexedDBAdapter {
	constructor(options) {
		this.dbName = options?.dbName || 'aide_memory_graph_db';
		this.storeName = options?.storeName || 'memory_graphs';
		this.dbVersion = options?.dbVersion || 1;
		this.enableBackups = options?.enableBackups || false;
	}
	/**
	 * Open a connection to the IndexedDB database
	 */
	openDB() {
		return new Promise((resolve, reject) => {
			if (typeof indexedDB === 'undefined') {
				reject(new Error('IndexedDB is not available in this environment'));
				return;
			}
			const request = indexedDB.open(this.dbName, this.dbVersion);
			request.onerror = event => {
				reject(new Error(`Failed to open IndexedDB: ${event.target.error?.message}`));
			};
			request.onsuccess = event => {
				resolve(event.target.result);
			};
			request.onupgradeneeded = event => {
				const db = event.target.result;
				// Create object store if it doesn't exist
				if (!db.objectStoreNames.contains(this.storeName)) {
					const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
					store.createIndex('updatedAt', 'updatedAt', { unique: false });
				}

				// Create backups store if enabled and it doesn't exist
				if (this.enableBackups && !db.objectStoreNames.contains('backups')) {
					const backupStore = db.createObjectStore('backups', {
						keyPath: ['graphId', 'timestamp'],
					});
					// Create index for graphId to query backups by graph
					backupStore.createIndex('graphId', 'graphId', { unique: false });
				}
			};
		});
	}
	/**
	 * Save memory graph to IndexedDB
	 */
	async save(graph) {
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
					// First check if backups store exists
					if (db.objectStoreNames.contains('backups')) {
						const backupTx = db.transaction(['backups'], 'readwrite');
						const backupStore = backupTx.objectStore('backups');

						// Create a backup with timestamp
						const timestamp = new Date().toISOString();
						const backup = {
							...graph,
							graphId: graph.id,
							timestamp,
						};

						// Add the backup data to the backup store
						const addRequest = backupStore.add(backup);

						// Create promise to ensure backup is completed
						await new Promise((resolve, reject) => {
							addRequest.onsuccess = resolve;
							addRequest.onerror = e => {
								console.warn('Error adding backup:', e);
								resolve(); // Continue anyway
							};
						});

						// Limit number of backups (keep last 10)
						try {
							const backupIndex = backupStore.index('graphId');
							// Ensure IDBKeyRange is available
							if (typeof IDBKeyRange !== 'undefined') {
								const backupRequest = backupIndex.openCursor(IDBKeyRange.only(graph.id));
								let count = 0;
								const toDelete = [];

								// Handle cursor results with proper promise
								await new Promise(resolve => {
									backupRequest.onsuccess = event => {
										const cursor = event.target.result;
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
											resolve();
										}
									};
									backupRequest.onerror = () => resolve(); // Continue on error
								});
							}
						} catch (indexError) {
							console.warn('Failed to manage backup limits in IndexedDB', indexError);
							// Continue even if backup limit management fails
						}
					} else {
						console.warn('Backups store does not exist yet');
					}
				} catch (error) {
					console.warn('Failed to create backup in IndexedDB', error);
					// Continue with save even if backup fails
				}
			} // Save the graph
			try {
				const result = await new Promise(resolve => {
					const request = store.put(graph);
					request.onerror = event => {
						console.error(`Failed to save graph to IndexedDB: ${request.error?.message}`);
						resolve(false);
					};
					request.onsuccess = () => {
						resolve(true);
					};
					tx.oncomplete = () => {
						db.close();
					};
				});
				return result;
			} catch (putError) {
				console.error('Error executing put operation:', putError);
				return false;
			}
		} catch (error) {
			console.error('Failed to save graph to IndexedDB', error);
			return false;
		}
	}
	/**
	 * Load memory graph from IndexedDB
	 */
	async load(graphId) {
		try {
			const db = await this.openDB();
			const tx = db.transaction(this.storeName, 'readonly');
			const store = tx.objectStore(this.storeName);
			return new Promise((resolve, reject) => {
				let request;
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
						result = event.target.result;
					} else {
						// For cursor, get the first (most recent) item
						const cursor = event.target.result;
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
	async exportGraph(format = 'json') {
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
	async importGraph(data, format = 'json') {
		try {
			let graph;
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
	async listGraphs() {
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
					const keys = event.target.result;
					resolve(keys.map(key => key.toString()));
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
	async deleteGraph(graphId) {
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
	async listBackups(graphId) {
		if (!this.enableBackups) {
			return [];
		}
		try {
			const db = await this.openDB();

			// Check if backups store exists
			if (!db.objectStoreNames.contains('backups')) {
				console.info('No backups store found in database');
				return [];
			}

			// Create transaction and get store
			const tx = db.transaction('backups', 'readonly');
			const store = tx.objectStore('backups');

			// Safely check if graphId index exists
			let graphIdIndex;
			try {
				graphIdIndex = store.index('graphId');
			} catch (indexError) {
				console.warn('graphId index not found on backups store:', indexError);
				return []; // Return empty array if index doesn't exist
			}

			if (!graphIdIndex) {
				console.warn('Failed to get graphId index from backups store');
				return [];
			}

			// Create a proper promise with timeout protection
			return new Promise((resolve, reject) => {
				try {
					// Create request to get all backups for this graph ID
					const request = graphIdIndex.getAll(graphId);

					// Set a backup timeout in case the request never completes
					const timeoutId = setTimeout(() => {
						console.warn('Backup listing timed out');
						resolve([]); // Resolve with empty array on timeout
					}, 3000); // 3 second timeout

					request.onerror = event => {
						clearTimeout(timeoutId);
						console.error('Error listing backups:', event);
						resolve([]); // Return empty on error rather than rejecting
					};

					request.onsuccess = event => {
						clearTimeout(timeoutId);
						const backups = event.target.result || [];
						resolve(
							backups.map(backup => ({
								graphId: backup.graphId,
								timestamp: backup.timestamp,
							}))
						);
					};

					tx.oncomplete = () => {
						db.close();
					};
				} catch (requestError) {
					console.error('Error creating request to list backups:', requestError);
					resolve([]);
				}
			});
		} catch (error) {
			console.error('Failed to list backups from IndexedDB:', error);
			return [];
		}
	}
	/**
	 * Restore a graph from backup
	 */
	async restoreBackup(graphId, timestamp) {
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
					const backup = event.target.result;
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
