import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryGraph } from '../src/schemas';
import { IndexedDBAdapter } from '../src/persistence/indexedDB';
import { v4 as uuidv4 } from 'uuid';

// Mock IndexedDB
const mockIndexedDB = {
	open: vi.fn(),
	deleteDatabase: vi.fn(),
};

const mockDBRequest = {
	onerror: null as any,
	onsuccess: null as any,
	onupgradeneeded: null as any,
	error: null,
	result: null as any,
};

// Mock IDBKeyRange for backup functionality
const mockIDBKeyRange = {
	only: vi.fn().mockImplementation(key => ({ key })),
};
global.IDBKeyRange = mockIDBKeyRange as any;

// Mock sample graph
const createSampleGraph = (): MemoryGraph => ({
	id: uuidv4(),
	name: 'Test Graph',
	description: 'A graph for testing',
	nodes: [],
	relationships: [],
	metadata: {},
	createdAt: new Date(),
	updatedAt: new Date(),
	version: '0.1.0',
});

describe('IndexedDBAdapter', () => {
	let adapter: IndexedDBAdapter;
	let mockMainStore: any;
	let mockBackupStore: any;
	let mockBackupIndex: any;
	let mockMainIndex: any;
	let mockTransaction: any;
	let mockDB: any;

	beforeEach(() => {
		// Create fresh mocks for each test
		mockMainStore = {
			put: vi.fn(),
			get: vi.fn(),
			getAll: vi.fn(),
			getAllKeys: vi.fn(),
			delete: vi.fn(),
			index: vi.fn(),
			createIndex: vi.fn().mockReturnValue({}),
		};

		mockBackupStore = {
			put: vi.fn(),
			get: vi.fn(),
			getAll: vi.fn(),
			getAllKeys: vi.fn(),
			delete: vi.fn(),
			index: vi.fn(),
			createIndex: vi.fn().mockReturnValue({}),
			add: vi.fn(),
		};

		mockBackupIndex = {
			openCursor: vi.fn(),
			getAll: vi.fn(),
		};

		mockMainIndex = {
			openCursor: vi.fn(),
			getAll: vi.fn(),
		};

		// Setup transaction mock that returns appropriate store based on name
		mockTransaction = {
			objectStore: vi.fn(storeName => {
				if (storeName === 'backups') {
					return mockBackupStore;
				}
				return mockMainStore;
			}),
			oncomplete: null as any,
		};

		// Setup DB mock with intelligent store selection
		mockDB = {
			createObjectStore: vi.fn(storeName => {
				if (storeName === 'backups') {
					return mockBackupStore;
				}
				return mockMainStore;
			}),
			transaction: vi.fn().mockImplementation(storeNames => {
				return mockTransaction;
			}),
			objectStoreNames: {
				contains: vi.fn(name => {
					// Simulate both main store and backup store existence
					return name === 'test-store' || name === 'backups';
				}),
			},
			close: vi.fn(),
		};

		// Set up IndexedDB mock
		global.indexedDB = mockIndexedDB as any;
		mockIndexedDB.open.mockImplementation(() => {
			setTimeout(() => {
				// Simulate DB opening
				if (mockDBRequest.onupgradeneeded) {
					mockDBRequest.result = mockDB;
					mockDBRequest.onupgradeneeded({ target: mockDBRequest });
				}
				if (mockDBRequest.onsuccess) {
					mockDBRequest.result = mockDB;
					mockDBRequest.onsuccess({ target: mockDBRequest });
				}
			}, 0);

			return mockDBRequest;
		});

		// Set up index mocks
		mockMainStore.index.mockReturnValue(mockMainIndex);
		mockBackupStore.index.mockReturnValue(mockBackupIndex);

		// Mock cursor implementation for backup management
		mockBackupIndex.openCursor.mockImplementation(() => {
			const request = { onsuccess: null as any, onerror: null as any };
			setTimeout(() => {
				if (request.onsuccess) {
					// Return null to simulate end of cursor
					request.onsuccess({ target: { result: null } });
				}
			}, 0);
			return request;
		});

		// Initialize with backup enabled
		adapter = new IndexedDBAdapter({
			dbName: 'test-db',
			storeName: 'test-store',
			enableBackups: true, // Enable backups for testing
		});
	});

	afterEach(() => {
		vi.resetAllMocks();
		delete (global as any).indexedDB;
	});

	describe('save', () => {
		it('should save a graph to IndexedDB', async () => {
			const graph = createSampleGraph();

			mockMainStore.put.mockImplementation(data => {
				const request = { onsuccess: null as any, onerror: null as any };
				setTimeout(() => {
					if (request.onsuccess) {
						request.onsuccess({});
					}
				}, 0);
				return request;
			});

			const result = await adapter.save(graph);

			expect(mockDB.transaction).toHaveBeenCalledWith(['test-store'], 'readwrite');
			expect(mockMainStore.put).toHaveBeenCalledWith(
				expect.objectContaining({
					id: graph.id,
					name: graph.name,
				})
			);
			expect(result).toBe(true);
		});
		it('should handle errors during save', async () => {
			const graph = createSampleGraph();

			mockMainStore.put.mockImplementation(() => {
				const request = {
					onsuccess: null as any,
					onerror: null as any,
					error: { message: 'Test error' },
				};

				// Use setTimeout to ensure async behavior
				setTimeout(() => {
					if (request.onerror) {
						request.onerror({ target: request });
					}
				}, 0);

				return request;
			});

			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const result = await adapter.save(graph);

			expect(consoleSpy).toHaveBeenCalled();
			expect(result).toBe(false);

			consoleSpy.mockRestore();
		});
	});

	describe('load', () => {
		it('should load a graph by ID', async () => {
			const graph = createSampleGraph();

			mockMainStore.get.mockImplementation(() => {
				const request = { onsuccess: null as any, onerror: null as any };
				setTimeout(() => {
					if (request.onsuccess) {
						request.onsuccess({ target: { result: graph } });
					}
				}, 0);
				return request;
			});

			const result = await adapter.load(graph.id);

			expect(mockDB.transaction).toHaveBeenCalledWith('test-store', 'readonly');
			expect(mockMainStore.get).toHaveBeenCalledWith(graph.id);
			expect(result).toEqual(graph);
		});

		it('should return null if no graph is found', async () => {
			mockMainStore.get.mockImplementation(() => {
				const request = { onsuccess: null as any, onerror: null as any };
				setTimeout(() => {
					if (request.onsuccess) {
						request.onsuccess({ target: { result: null } });
					}
				}, 0);
				return request;
			});

			const result = await adapter.load('non-existent-id');
			expect(result).toBeNull();
		});
	});

	describe('listGraphs', () => {
		it('should list all available graph IDs', async () => {
			const ids = ['graph1', 'graph2', 'graph3'];

			mockMainStore.getAllKeys.mockImplementation(() => {
				const request = { onsuccess: null as any, onerror: null as any };
				setTimeout(() => {
					if (request.onsuccess) {
						request.onsuccess({ target: { result: ids } });
					}
				}, 0);
				return request;
			});

			const result = await adapter.listGraphs();

			expect(mockDB.transaction).toHaveBeenCalledWith('test-store', 'readonly');
			expect(mockMainStore.getAllKeys).toHaveBeenCalled();
			expect(result).toEqual(ids);
		});
	});

	describe('deleteGraph', () => {
		it('should delete a graph', async () => {
			mockMainStore.delete.mockImplementation(() => {
				const request = { onsuccess: null as any, onerror: null as any };
				setTimeout(() => {
					if (request.onsuccess) {
						request.onsuccess({});
					}
				}, 0);
				return request;
			});

			const result = await adapter.deleteGraph('graph-id');

			expect(mockDB.transaction).toHaveBeenCalledWith('test-store', 'readwrite');
			expect(mockMainStore.delete).toHaveBeenCalledWith('graph-id');
			expect(result).toBe(true);
		});
	});

	describe('exportGraph', () => {
		it('should export a graph to JSON format', async () => {
			const graph = createSampleGraph();

			// Mock the load method explicitly for exportGraph
			const loadSpy = vi.spyOn(adapter, 'load').mockResolvedValue(graph);

			const result = await adapter.exportGraph();
			const parsedResult = JSON.parse(result);

			expect(loadSpy).toHaveBeenCalled();
			expect(parsedResult).toEqual(
				expect.objectContaining({
					id: graph.id,
					name: graph.name,
				})
			);

			// Restore the original implementation
			loadSpy.mockRestore();
		});
	});

	describe('backup functionality', () => {
		it('should create backups when saving a graph with backups enabled', async () => {
			const graph = createSampleGraph();

			// Track transactions with different stores
			const transactionCalls: any[] = [];
			mockDB.transaction.mockImplementation((storeNames, mode) => {
				transactionCalls.push({ storeNames, mode });
				return mockTransaction;
			});

			// Mock add method for backups
			mockBackupStore.add.mockImplementation(data => {
				const request = { onsuccess: null as any, onerror: null as any };
				setTimeout(() => {
					if (request.onsuccess) {
						request.onsuccess({});
					}
				}, 0);
				return request;
			});

			// Mock put for regular save
			mockMainStore.put.mockImplementation(data => {
				const request = { onsuccess: null as any, onerror: null as any };
				setTimeout(() => {
					if (request.onsuccess) {
						request.onsuccess({});
					}
				}, 0);
				return request;
			});

			const result = await adapter.save(graph);

			// Verify transactions were created for both stores
			expect(transactionCalls).toContainEqual(
				expect.objectContaining({ storeNames: ['test-store'], mode: 'readwrite' })
			);
			expect(transactionCalls).toContainEqual(
				expect.objectContaining({ storeNames: ['backups'], mode: 'readwrite' })
			);

			expect(mockMainStore.put).toHaveBeenCalled();
			expect(mockBackupStore.add).toHaveBeenCalled();
			expect(result).toBe(true);
		});

		it('should list available backups for a graph', async () => {
			const graphId = 'test-graph-id';
			const backups = [
				{ graphId, timestamp: '2023-01-01T00:00:00.000Z' },
				{ graphId, timestamp: '2023-01-02T00:00:00.000Z' },
			];

			// Setup the getAll mock to return backups
			mockBackupIndex.getAll.mockImplementation(() => {
				const request = { onsuccess: null as any, onerror: null as any };
				setTimeout(() => {
					if (request.onsuccess) {
						request.onsuccess({ target: { result: backups } });
					}
				}, 0);
				return request;
			});

			const result = await adapter.listBackups(graphId);

			expect(mockDB.transaction).toHaveBeenCalledWith('backups', 'readonly');
			expect(mockBackupStore.index).toHaveBeenCalledWith('graphId');
			expect(mockBackupIndex.getAll).toHaveBeenCalledWith(graphId);
			expect(result).toEqual(
				backups.map(backup => ({
					graphId: backup.graphId,
					timestamp: backup.timestamp,
				}))
			);
		});
	});
});
