import * as vscode from 'vscode';
import { MemoryService, MemoryNode } from '../services/memoryService';
import { createLogger } from '../services/loggerService';

/**
 * Context Manager for AIDE Extension
 * Manages workspace context, active files, and contextual awareness
 */

export interface WorkspaceContext {
	name: string;
	path: string;
	type: string;
	technologies: string[];
	activeFiles: string[];
	recentFiles: string[];
	gitBranch?: string;
	packageJson?: any;
}

export interface FileContext {
	path: string;
	language: string;
	isActive: boolean;
	lastModified: number;
	size: number;
	dependencies: string[];
}

export class ContextManager {
	private workspaceContext: WorkspaceContext | null = null;
	private fileContexts: Map<string, FileContext> = new Map();
	private activeFiles: Set<string> = new Set();
	private memoryService: MemoryService;
	private context: vscode.ExtensionContext;
	private readonly logger = createLogger('ContextManager');

	constructor(context: vscode.ExtensionContext, memoryService: MemoryService) {
		this.context = context;
		this.memoryService = memoryService;
		this.initializeContext();
		this.setupEventListeners();
	}

	/**
	 * Initialize workspace context
	 */
	private initializeContext(): void {
		const workspace = vscode.workspace.workspaceFolders?.[0];
		if (workspace) {
			this.updateWorkspaceContext(workspace);
		}
	}

	/**
	 * Setup VS Code event listeners
	 */
	private setupEventListeners(): void {
		// Listen for workspace changes
		vscode.workspace.onDidChangeWorkspaceFolders(() => {
			this.initializeContext();
		});

		// Listen for active editor changes
		vscode.window.onDidChangeActiveTextEditor((editor) => {
			if (editor) {
				this.updateActiveFile(editor.document.uri.fsPath);
			}
		});

		// Listen for document changes
		vscode.workspace.onDidChangeTextDocument((event) => {
			this.updateFileContext(event.document.uri.fsPath);
		});

		// Listen for file operations
		vscode.workspace.onDidCreateFiles((event) => {
			event.files.forEach(file => this.addFileContext(file.fsPath));
		});

		vscode.workspace.onDidDeleteFiles((event) => {
			event.files.forEach(file => this.removeFileContext(file.fsPath));
		});
	}

	/**
	 * Update workspace context
	 */
	private updateWorkspaceContext(workspace: vscode.WorkspaceFolder): void {
		this.workspaceContext = {
			name: workspace.name,
			path: workspace.uri.fsPath,
			type: this.detectWorkspaceType(workspace.uri.fsPath),
			technologies: this.detectTechnologies(workspace.uri.fsPath),
			activeFiles: Array.from(this.activeFiles),
			recentFiles: this.getRecentFiles()
		};

		// Update memory with workspace context
		const memoryNode: MemoryNode = {
			id: `workspace_${workspace.name}`,
			type: 'concept',
			content: `Workspace: ${workspace.name}`,
			metadata: this.workspaceContext,
			connections: [],
			timestamp: Date.now(),
			weight: 1.0
		};

		this.memoryService.addMemoryNode(memoryNode);
	}

	/**
	 * Get current workspace context
	 */
	getWorkspaceContext(): WorkspaceContext | null {
		return this.workspaceContext;
	}

	/**
	 * Update active file
	 */
	private updateActiveFile(filePath: string): void {
		this.activeFiles.add(filePath);
		this.updateFileContext(filePath);
		// Keep only last 10 active files
		if (this.activeFiles.size > 10) {
			const firstFile = this.activeFiles.values().next().value;
			if (firstFile) {
				this.activeFiles.delete(firstFile);
			}
		}

		// Update workspace context
		if (this.workspaceContext) {
			this.workspaceContext.activeFiles = Array.from(this.activeFiles);
		}
	}

	/**
	 * Update file context
	 */
	private updateFileContext(filePath: string): void {
		try {
			const document = vscode.workspace.textDocuments.find(doc => doc.uri.fsPath === filePath);
			if (document) {
				const fileContext: FileContext = {
					path: filePath,
					language: document.languageId,
					isActive: this.activeFiles.has(filePath),
					lastModified: Date.now(),
					size: document.getText().length,
					dependencies: this.extractDependencies(document.getText(), document.languageId)
				};

				this.fileContexts.set(filePath, fileContext);

				// Create memory node for file
				const memoryNode: MemoryNode = {
					id: `file_${this.hashPath(filePath)}`,
					type: 'file',
					content: `File: ${filePath}`,
					metadata: fileContext,
					connections: [],
					timestamp: Date.now(),
					weight: 0.5
				};

				this.memoryService.addMemoryNode(memoryNode);
			}
		} catch (error) {
			this.logger.error('Error updating file context:', error);
		}
	}

	/**
	 * Add file context
	 */
	private addFileContext(filePath: string): void {
		this.updateFileContext(filePath);
	}

	/**
	 * Remove file context
	 */
	private removeFileContext(filePath: string): void {
		this.fileContexts.delete(filePath);
		this.activeFiles.delete(filePath);
	}

	/**
	 * Get file context
	 */
	getFileContext(filePath: string): FileContext | undefined {
		return this.fileContexts.get(filePath);
	}

	/**
	 * Get all file contexts
	 */
	getAllFileContexts(): FileContext[] {
		return Array.from(this.fileContexts.values());
	}

	/**
	 * Get active files
	 */
	getActiveFiles(): string[] {
		return Array.from(this.activeFiles);
	}

	/**
	 * Get contextual information for AI
	 */
	getContextualInfo(): any {
		return {
			workspace: this.workspaceContext,
			activeFiles: this.getActiveFiles().map(path => this.getFileContext(path)),
			recentFiles: this.getRecentFiles(),
			technologies: this.workspaceContext?.technologies || [],
			summary: this.generateContextSummary()
		};
	}

	/**
	 * Generate context summary for AI
	 */
	private generateContextSummary(): string {
		if (!this.workspaceContext) return 'No workspace context available';

		const { name, type, technologies, activeFiles } = this.workspaceContext;
		const fileCount = this.fileContexts.size;

		return `Working in ${name} (${type}) with ${technologies.join(', ')}.
				${fileCount} files tracked, ${activeFiles.length} currently active.`;
	}

	/**
	 * Detect workspace type from files
	 */
	private detectWorkspaceType(workspacePath: string): string {
		try {
			const fs = require('fs');
			const path = require('path');

			if (fs.existsSync(path.join(workspacePath, 'package.json'))) {
				const packageJson = JSON.parse(fs.readFileSync(path.join(workspacePath, 'package.json'), 'utf8'));

				if (packageJson.dependencies?.next) return 'nextjs';
				if (packageJson.dependencies?.react) return 'react';
				if (packageJson.dependencies?.vue) return 'vue';
				if (packageJson.dependencies?.express) return 'express';
				if (packageJson.dependencies?.['@angular/core']) return 'angular';

				return 'nodejs';
			}

			if (fs.existsSync(path.join(workspacePath, 'requirements.txt')) ||
				fs.existsSync(path.join(workspacePath, 'pyproject.toml'))) {
				return 'python';
			}

			if (fs.existsSync(path.join(workspacePath, 'Cargo.toml'))) {
				return 'rust';
			}

			if (fs.existsSync(path.join(workspacePath, 'go.mod'))) {
				return 'go';
			}

			return 'general';
		} catch (error) {
			return 'unknown';
		}
	}

	/**
	 * Detect technologies used in workspace
	 */
	private detectTechnologies(workspacePath: string): string[] {
		const technologies: string[] = [];

		try {
			const fs = require('fs');
			const path = require('path');

			// Check package.json for JavaScript/Node.js projects
			if (fs.existsSync(path.join(workspacePath, 'package.json'))) {
				const packageJson = JSON.parse(fs.readFileSync(path.join(workspacePath, 'package.json'), 'utf8'));
				const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

				Object.keys(deps).forEach(dep => {
					if (dep.includes('react')) technologies.push('React');
					if (dep.includes('vue')) technologies.push('Vue');
					if (dep.includes('angular')) technologies.push('Angular');
					if (dep.includes('typescript')) technologies.push('TypeScript');
					if (dep.includes('express')) technologies.push('Express');
					if (dep.includes('next')) technologies.push('Next.js');
					if (dep.includes('tailwind')) technologies.push('Tailwind CSS');
					if (dep.includes('eslint')) technologies.push('ESLint');
				});
			}

			// Check for other technology indicators
			if (fs.existsSync(path.join(workspacePath, 'tsconfig.json'))) {
				technologies.push('TypeScript');
			}

			if (fs.existsSync(path.join(workspacePath, '.eslintrc.js')) ||
				fs.existsSync(path.join(workspacePath, '.eslintrc.json'))) {
				technologies.push('ESLint');
			}

			if (fs.existsSync(path.join(workspacePath, 'tailwind.config.js'))) {
				technologies.push('Tailwind CSS');
			}

		} catch (error) {
			this.logger.error('Error detecting technologies:', error);
		}

		return [...new Set(technologies)]; // Remove duplicates
	}

	/**
	 * Extract dependencies from file content
	 */
	private extractDependencies(content: string, language: string): string[] {
		const dependencies: string[] = [];

		try {
			switch (language) {
				case 'javascript':
				case 'typescript':
				case 'javascriptreact':
				case 'typescriptreact':
					const importRegex = /import\s+.*\s+from\s+['"`]([^'"`]+)['"`]/g;
					const requireRegex = /require\(['"`]([^'"`]+)['"`]\)/g;

					let match;
					while ((match = importRegex.exec(content)) !== null) {
						dependencies.push(match[1]);
					}
					while ((match = requireRegex.exec(content)) !== null) {
						dependencies.push(match[1]);
					}
					break;

				case 'python':
					const pythonImportRegex = /(?:from\s+(\S+)\s+import|import\s+(\S+))/g;
					while ((match = pythonImportRegex.exec(content)) !== null) {
						dependencies.push(match[1] || match[2]);
					}
					break;

				case 'go':
					const goImportRegex = /import\s+"([^"]+)"/g;
					while ((match = goImportRegex.exec(content)) !== null) {
						dependencies.push(match[1]);
					}
					break;
			}
		} catch (error) {
			this.logger.error('Error extracting dependencies:', error);
		}

		return dependencies;
	}

	/**
	 * Get recent files
	 */
	private getRecentFiles(): string[] {
		// Get recently opened files from VS Code
		const recentFiles: string[] = [];

		// This would be populated from VS Code's recent files API
		// For now, return active files as recent files
		return Array.from(this.activeFiles).slice(-5);
	}

	/**
	 * Hash file path for consistent memory node IDs
	 */
	private hashPath(filePath: string): string {
		// Simple hash function
		let hash = 0;
		for (let i = 0; i < filePath.length; i++) {
			const char = filePath.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return Math.abs(hash).toString(36);
	}

	/**
	 * Search files by content or name
	 */
	async searchFiles(query: string): Promise<FileContext[]> {
		const results: FileContext[] = [];

		for (const fileContext of this.fileContexts.values()) {
			if (fileContext.path.toLowerCase().includes(query.toLowerCase())) {
				results.push(fileContext);
			}
		}

		return results;
	}

	/**
	 * Get context for specific file types
	 */
	getFilesByLanguage(language: string): FileContext[] {
		return Array.from(this.fileContexts.values())
			.filter(context => context.language === language);
	}

	/**
	 * Export context for debugging
	 */
	exportContext(): any {
		return {
			workspace: this.workspaceContext,
			files: Object.fromEntries(this.fileContexts),
			activeFiles: Array.from(this.activeFiles),
			summary: this.generateContextSummary()
		};
	}
}
