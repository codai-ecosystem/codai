import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  LocalStorageAdapter,
  PersistenceAdapter,
  createPersistenceAdapter
} from '../src/persistence';
import { MemoryGraph } from '../src/schemas';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    length: Object.keys(store).length
  };
})();

// Mock global localStorage
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter;
  let testGraph: MemoryGraph;

  beforeEach(() => {
    // Clear mocks between tests
    localStorageMock.clear();
    vi.clearAllMocks();

    // Create a new adapter instance
    adapter = new LocalStorageAdapter({ storageKey: 'test_graph' });

    // Create a test graph
    testGraph = {
      id: 'test-123',
      name: 'Test Graph',
      version: '0.1.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      nodes: [],
      relationships: [],
      metadata: {
        aiProvider: 'test',
        tags: ['test'],
        lastInteractionAt: new Date(),
        stats: {
          nodeCount: 0,
          edgeCount: 0,
          complexity: 0
        }
      },
      settings: {
        autoSave: true,
        persistLocation: 'local'
      }
    };
  });

  it('should save a graph to localStorage', async () => {
    const result = await adapter.save(testGraph);
    expect(result).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test_graph', expect.any(String));

    // Verify the saved data
    const savedJson = localStorageMock.getItem('test_graph');
    const savedGraph = JSON.parse(savedJson as string);
    expect(savedGraph.id).toBe(testGraph.id);
    expect(savedGraph.name).toBe(testGraph.name);
  });
  it('should load a graph from localStorage', async () => {
    // Save first
    await adapter.save(testGraph);

    // Then load
    const loadedGraph = await adapter.load();
    expect(loadedGraph).not.toBeNull();
    expect(loadedGraph?.id).toBe(testGraph.id);
    expect(loadedGraph?.name).toBe(testGraph.name);
    expect(loadedGraph?.createdAt).toBeInstanceOf(Date);
    expect(loadedGraph?.updatedAt).toBeInstanceOf(Date);
  });

  it('should return null when loading a non-existent graph', async () => {
    const loadedGraph = await adapter.load('non-existent');
    expect(loadedGraph).toBeNull();
  });

  it('should export a graph as JSON', async () => {
    // Save first
    await adapter.save(testGraph);

    // Then export
    const exportedJson = await adapter.exportGraph('json');
    const exportedGraph = JSON.parse(exportedJson);
    expect(exportedGraph.id).toBe(testGraph.id);
  });
  it('should import a graph from JSON', async () => {
    const jsonData = JSON.stringify(testGraph);
    const importedGraph = await adapter.importGraph(jsonData, 'json');

    expect(importedGraph).not.toBeNull();
    expect(importedGraph?.id).toBe(testGraph.id);
    expect(importedGraph?.createdAt).toBeInstanceOf(Date);
    expect(importedGraph?.updatedAt).toBeInstanceOf(Date);
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('should throw an error for unsupported export formats', async () => {
    await adapter.save(testGraph);
    await expect(adapter.exportGraph('xml')).rejects.toThrow('Unsupported export format');
  });
  it('should throw an error for unsupported import formats', async () => {
    await expect(adapter.importGraph('<xml></xml>', 'xml')).rejects.toThrow('Unsupported import format');
  });
});

describe('PersistenceAdapter factory', () => {
  it('should create a LocalStorageAdapter by default in browser environments', () => {
    // Mock a browser environment without IndexedDB
    delete (global as any).indexedDB;
    delete (global as any).process;

    const adapter = createPersistenceAdapter('auto');
    expect(adapter).toBeInstanceOf(LocalStorageAdapter);
  });

  it('should create a specified adapter when requested', () => {
    const adapter = createPersistenceAdapter('local-storage');
    expect(adapter).toBeInstanceOf(LocalStorageAdapter);
  });

  it('should throw an error for invalid adapter types', () => {
    expect(() => createPersistenceAdapter('invalid' as any)).toThrow('Unsupported persistence adapter type');
  });
});
