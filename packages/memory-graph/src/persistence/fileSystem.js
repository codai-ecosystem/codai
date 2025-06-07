import { MemoryGraphSchema } from '../schemas';
/**
 * FileSystemAdapter provides persistence using Node.js filesystem
 * Used in desktop environments where Node.js APIs are available
 */
export class FileSystemAdapter {
    constructor(options) {
        this.storagePath = options?.storageKey || './memory-graphs';
        this.enableBackups = options?.enableBackups || false;
    }
    /**
     * Initialize the adapter by dynamically importing Node.js modules
     * This prevents errors in browser environments
     */
    async initialize() {
        try {
            // Use dynamic imports to avoid errors in browser environments
            this.fs = await import('fs/promises');
            this.path = await import('path');
            // Ensure directory exists
            await this.fs.mkdir(this.storagePath, { recursive: true });
        }
        catch (error) {
            throw new Error(`FileSystemAdapter initialization failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get full path for a graph file
     */
    getGraphPath(graphId) {
        return this.path.join(this.storagePath, `${graphId}.json`);
    }
    /**
     * Save memory graph to filesystem
     */
    async save(graph) {
        try {
            await this.initialize();
            // Create backup if enabled
            if (this.enableBackups) {
                try {
                    const graphPath = this.getGraphPath(graph.id);
                    const fileExists = await this.fs.access(graphPath)
                        .then(() => true)
                        .catch(() => false);
                    if (fileExists) {
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                        await this.fs.copyFile(graphPath, this.path.join(this.storagePath, `${graph.id}_backup_${timestamp}.json`));
                    }
                }
                catch (backupError) {
                    console.warn('Failed to create backup', backupError);
                    // Continue with save even if backup fails
                }
            }
            // Update modified timestamp
            graph.updatedAt = new Date();
            // Save the graph
            await this.fs.writeFile(this.getGraphPath(graph.id), JSON.stringify(graph, null, 2), 'utf8');
            return true;
        }
        catch (error) {
            console.error('Failed to save graph to filesystem', error);
            return false;
        }
    }
    /**
     * Load memory graph from filesystem
     */
    async load(graphId) {
        try {
            await this.initialize();
            if (!graphId) {
                // If no specific ID, load the most recently modified graph
                const graphFiles = await this.fs.readdir(this.storagePath);
                if (graphFiles.length === 0)
                    return null;
                // Get file stats and find most recent
                const statsPromises = graphFiles
                    .filter((file) => file.endsWith('.json') && !file.includes('_backup_'))
                    .map(async (file) => {
                    const filePath = this.path.join(this.storagePath, file);
                    const stats = await this.fs.stat(filePath);
                    return {
                        file,
                        mtime: stats.mtime
                    };
                });
                const fileStats = await Promise.all(statsPromises);
                if (fileStats.length === 0)
                    return null;
                // Sort by modified time descending
                fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
                // Extract ID from filename
                const mostRecentFile = fileStats[0];
                if (!mostRecentFile)
                    return null;
                graphId = mostRecentFile.file.replace('.json', '');
            }
            // Now graphId is definitely defined
            const graphPath = this.getGraphPath(graphId);
            // Check if file exists
            const fileExists = await this.fs.access(graphPath)
                .then(() => true)
                .catch(() => false);
            if (!fileExists)
                return null;
            // Read and parse file
            const data = await this.fs.readFile(graphPath, 'utf8');
            const parsedGraph = JSON.parse(data);
            // Convert date strings back to Date objects
            parsedGraph.createdAt = new Date(parsedGraph.createdAt);
            parsedGraph.updatedAt = new Date(parsedGraph.updatedAt);
            // Validate with schema
            return MemoryGraphSchema.parse(parsedGraph);
        }
        catch (error) {
            console.error('Failed to load graph from filesystem', error);
            return null;
        }
    }
    /**
     * Export graph to string format
     */
    async exportGraph(format = 'json') {
        try {
            await this.initialize();
            // Get most recent graph if available
            const graphFiles = await this.fs.readdir(this.storagePath);
            if (graphFiles.length === 0)
                return '{}';
            // Filter out backup files and sort by modified time
            const fileStatsPromises = graphFiles
                .filter((file) => file.endsWith('.json') && !file.includes('_backup_'))
                .map(async (file) => {
                const filePath = this.path.join(this.storagePath, file);
                const stats = await this.fs.stat(filePath);
                return { file, mtime: stats.mtime };
            });
            const fileStats = await Promise.all(fileStatsPromises);
            if (fileStats.length === 0)
                return '{}';
            // Sort by modified time descending
            fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
            // Read most recent file
            const mostRecentFile = fileStats[0];
            if (!mostRecentFile)
                return '{}';
            const filePath = this.path.join(this.storagePath, mostRecentFile.file);
            const data = await this.fs.readFile(filePath, 'utf8');
            if (format === 'json') {
                return data;
            }
            // Could implement other formats (XML, YAML, etc.) in the future
            throw new Error(`Unsupported export format: ${format}`);
        }
        catch (error) {
            console.error('Failed to export graph', error);
            return '{}';
        }
    }
    /**
     * Import graph from string format
     */
    async importGraph(data, format = 'json') {
        try {
            await this.initialize();
            if (format === 'json') {
                const parsedGraph = JSON.parse(data);
                // Convert date strings back to Date objects
                parsedGraph.createdAt = new Date(parsedGraph.createdAt);
                parsedGraph.updatedAt = new Date(parsedGraph.updatedAt);
                // Validate with schema
                const validatedGraph = MemoryGraphSchema.parse(parsedGraph);
                // Save to filesystem
                await this.fs.writeFile(this.getGraphPath(validatedGraph.id), JSON.stringify(validatedGraph, null, 2), 'utf8');
                return validatedGraph;
            }
            throw new Error(`Unsupported import format: ${format}`);
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
        try {
            await this.initialize();
            const graphFiles = await this.fs.readdir(this.storagePath);
            // Filter out backup files and extract IDs
            return graphFiles
                .filter((file) => file.endsWith('.json') && !file.includes('_backup_'))
                .map((file) => file.replace('.json', ''));
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
        try {
            await this.initialize();
            const graphPath = this.getGraphPath(graphId);
            // Check if file exists
            const fileExists = await this.fs.access(graphPath)
                .then(() => true)
                .catch(() => false);
            if (!fileExists)
                return false;
            // Delete the file
            await this.fs.unlink(graphPath);
            return true;
        }
        catch (error) {
            console.error('Failed to delete graph', error);
            return false;
        }
    }
}
