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

const mockObjectStore = {
  put: vi.fn(),
  get: vi.fn(),
  getAll: vi.fn(),
  getAllKeys: vi.fn(),
  delete: vi.fn(),
  index: vi.fn(),
  createIndex: vi.fn(),
};

const mockTransaction = {
  objectStore: vi.fn().mockReturnValue(mockObjectStore),
  oncomplete: null as any,
};

const mockDB = {
  createObjectStore: vi.fn().mockReturnValue(mockObjectStore),
  transaction: vi.fn().mockReturnValue(mockTransaction),
  objectStoreNames: {
    contains: vi.fn().mockReturnValue(true),
  },
  close: vi.fn(),
};

const mockIndex = {
  openCursor: vi.fn(),
  getAll: vi.fn(),
};

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

  beforeEach(() => {
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

    mockObjectStore.index.mockReturnValue(mockIndex);

    adapter = new IndexedDBAdapter({
      dbName: 'test-db',
      storeName: 'test-store',
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
    delete (global as any).indexedDB;
  });

  describe('save', () => {
    it('should save a graph to IndexedDB', async () => {
      const graph = createSampleGraph();

      mockObjectStore.put.mockImplementation((data) => {
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
      expect(mockObjectStore.put).toHaveBeenCalledWith(expect.objectContaining({
        id: graph.id,
        name: graph.name,
      }));
      expect(result).toBe(true);
    });

    it('should handle errors during save', async () => {
      const graph = createSampleGraph();

      mockObjectStore.put.mockImplementation(() => {
        const request = { onsuccess: null as any, onerror: null as any, error: new Error('Test error') };
        setTimeout(() => {
          if (request.onerror) {
            request.onerror({});
          }
        }, 0);
        return request;
      });

      const result = await adapter.save(graph);
      expect(result).toBe(false);
    });
  });

  describe('load', () => {
    it('should load a graph by ID', async () => {
      const graph = createSampleGraph();

      mockObjectStore.get.mockImplementation(() => {
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
      expect(mockObjectStore.get).toHaveBeenCalledWith(graph.id);
      expect(result).toEqual(graph);
    });

    it('should return null if no graph is found', async () => {
      mockObjectStore.get.mockImplementation(() => {
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

      mockObjectStore.getAllKeys.mockImplementation(() => {
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
      expect(mockObjectStore.getAllKeys).toHaveBeenCalled();
      expect(result).toEqual(ids);
    });
  });

  describe('deleteGraph', () => {
    it('should delete a graph', async () => {
      mockObjectStore.delete.mockImplementation(() => {
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
      expect(mockObjectStore.delete).toHaveBeenCalledWith('graph-id');
      expect(result).toBe(true);
    });
  });

  describe('exportGraph', () => {
    it('should export a graph to JSON format', async () => {
      const graph = createSampleGraph();

      mockObjectStore.get.mockImplementation(() => {
        const request = { onsuccess: null as any, onerror: null as any };
        setTimeout(() => {
          if (request.onsuccess) {
            request.onsuccess({ target: { result: graph } });
          }
        }, 0);
        return request;
      });

      // Mock the index behavior for getting the most recent graph
      mockIndex.openCursor.mockImplementation(() => {
        const request = { onsuccess: null as any, onerror: null as any };
        setTimeout(() => {
          if (request.onsuccess) {
            request.onsuccess({
              target: {
                result: {
                  value: graph
                }
              }
            });
          }
        }, 0);
        return request;
      });

      const result = await adapter.exportGraph();
      const parsedResult = JSON.parse(result);

      expect(parsedResult).toEqual(expect.objectContaining({
        id: graph.id,
        name: graph.name,
      }));
    });
  });
});
