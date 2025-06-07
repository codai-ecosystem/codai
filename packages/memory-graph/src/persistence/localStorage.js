import { MemoryGraphSchema } from '../schemas';
/**
 * LocalStorageAdapter provides persistence using browser's localStorage API
 */
export class LocalStorageAdapter {
    constructor(options) {
        this.storageKey = options?.storageKey || 'aide_memory_graph';
        this.enableBackups = options?.enableBackups || false;
    }
    /**
     * Save memory graph to localStorage
     */
    async save(graph) {
        if (typeof localStorage === 'undefined') {
            throw new Error('localStorage is not available in this environment');
        }
        try {
            // Create backup if enabled
            if (this.enableBackups) {
                const existing = localStorage.getItem(this.storageKey);
                if (existing) {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    localStorage.setItem(`${this.storageKey}_backup_${timestamp}`, existing);
                }
            }
            // Update modified timestamp
            graph.updatedAt = new Date();
            // Save the graph
            localStorage.setItem(this.storageKey, JSON.stringify(graph));
            return true;
        }
        catch (error) {
            console.error('Failed to save graph to localStorage', error);
            return false;
        }
    }
    /**
     * Load memory graph from localStorage
     */
    async load(graphId) {
        if (typeof localStorage === 'undefined') {
            throw new Error('localStorage is not available in this environment');
        }
        try {
            const storedGraph = localStorage.getItem(this.storageKey);
            if (!storedGraph)
                return null;
            const parsedGraph = JSON.parse(storedGraph);
            // Convert date strings back to Date objects if they are strings
            if (typeof parsedGraph.createdAt === 'string') {
                parsedGraph.createdAt = new Date(parsedGraph.createdAt);
            }
            if (typeof parsedGraph.updatedAt === 'string') {
                parsedGraph.updatedAt = new Date(parsedGraph.updatedAt);
            }
            if (parsedGraph.metadata?.lastInteractionAt && typeof parsedGraph.metadata.lastInteractionAt === 'string') {
                parsedGraph.metadata.lastInteractionAt = new Date(parsedGraph.metadata.lastInteractionAt);
            }
            // If graphId is specified, verify it matches
            if (graphId && parsedGraph.id !== graphId)
                return null;
            // Validate with schema
            return MemoryGraphSchema.parse(parsedGraph);
        }
        catch (error) {
            console.error('Failed to load graph from localStorage', error);
            return null;
        }
    }
    /**
     * Export graph to string format
     */
    async exportGraph(format = 'json') {
        if (typeof localStorage === 'undefined') {
            throw new Error('localStorage is not available in this environment');
        }
        const storedGraph = localStorage.getItem(this.storageKey);
        if (!storedGraph)
            return '{}';
        if (format === 'json') {
            return storedGraph;
        }
        // Could implement other formats (XML, YAML, etc.) in the future
        throw new Error(`Unsupported export format: ${format}`);
    } /**
     * Import graph from string format
     */
    async importGraph(data, format = 'json') {
        if (typeof localStorage === 'undefined') {
            throw new Error('localStorage is not available in this environment');
        }
        if (format !== 'json') {
            throw new Error(`Unsupported import format: ${format}`);
        }
        try {
            const parsedGraph = JSON.parse(data);
            // Convert date strings back to Date objects if they are strings
            if (typeof parsedGraph.createdAt === 'string') {
                parsedGraph.createdAt = new Date(parsedGraph.createdAt);
            }
            if (typeof parsedGraph.updatedAt === 'string') {
                parsedGraph.updatedAt = new Date(parsedGraph.updatedAt);
            }
            if (parsedGraph.metadata?.lastInteractionAt && typeof parsedGraph.metadata.lastInteractionAt === 'string') {
                parsedGraph.metadata.lastInteractionAt = new Date(parsedGraph.metadata.lastInteractionAt);
            }
            // Validate with schema
            const validatedGraph = MemoryGraphSchema.parse(parsedGraph);
            // Save to storage
            localStorage.setItem(this.storageKey, JSON.stringify(validatedGraph));
            return validatedGraph;
        }
        catch (error) {
            console.error('Failed to import graph', error);
            return null;
        }
    }
    /**
     * List all stored graphs
     */
    async listGraphs() {
        if (typeof localStorage === 'undefined') {
            throw new Error('localStorage is not available in this environment');
        }
        try {
            // Find all keys that match our storage pattern
            const graphKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.storageKey) && !key.includes('_backup_')) {
                    const data = localStorage.getItem(key);
                    if (data) {
                        try {
                            const graph = JSON.parse(data);
                            graphKeys.push(graph.id);
                        }
                        catch (e) {
                            // Skip invalid entries
                        }
                    }
                }
            }
            return graphKeys;
        }
        catch (error) {
            console.error('Failed to list graphs', error);
            return [];
        }
    }
    /**
     * Delete a stored graph
     */
    async deleteGraph(graphId) {
        if (typeof localStorage === 'undefined') {
            throw new Error('localStorage is not available in this environment');
        }
        try {
            const storedGraph = localStorage.getItem(this.storageKey);
            if (!storedGraph)
                return false;
            const graph = JSON.parse(storedGraph);
            if (graph.id === graphId) {
                localStorage.removeItem(this.storageKey);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Failed to delete graph', error);
            return false;
        }
    }
}
