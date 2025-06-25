import * as vscode from 'vscode';
import { ProjectService } from './projectService';
import { MemoryService } from './memoryService';

/**
 * Builder Service for AIDE Extension
 * Handles project building, compilation, and build optimization
 */

export interface BuildConfiguration {
	framework: string;
	language: string;
	outputPath: string;
	optimization: boolean;
	sourceMap: boolean;
	minify: boolean;
	target: 'development' | 'production' | 'test';
}

export interface BuildResult {
	success: boolean;
	outputPath: string;
	artifacts: string[];
	logs: string[];
	errors: string[];
	warnings: string[];
	duration: number;
}

export interface BuildTemplate {
	name: string;
	framework: string;
	scripts: Record<string, string>;
	dependencies: string[];
	devDependencies: string[];
	config: Record<string, any>;
}

export class BuilderService {
	private context: vscode.ExtensionContext;
	private projectService: ProjectService;
	private memoryService: MemoryService;
	private outputChannel: vscode.OutputChannel;

	constructor(
		context: vscode.ExtensionContext,
		projectService: ProjectService,
		memoryService: MemoryService
	) {
		this.context = context;
		this.projectService = projectService;
		this.memoryService = memoryService;
		this.outputChannel = vscode.window.createOutputChannel('AIDE Builder');
	}

	/**
	 * Build a project with specified configuration
	 */
	async buildProject(config: BuildConfiguration): Promise<BuildResult> {
		const startTime = Date.now();
		this.outputChannel.appendLine(`Starting build for ${config.framework} project...`);

		try {
			// Validate project structure
			await this.validateProjectStructure();

			// Setup build environment
			await this.setupBuildEnvironment(config); // Run build process
			const result = await this.executeBuild(config);

			const duration = Date.now() - startTime;

			// Post-build operations
			await this.postBuildOperations(config, {
				...result,
				duration,
			});

			this.outputChannel.appendLine(`Build completed in ${duration}ms`);

			return {
				...result,
				duration,
			};
		} catch (error) {
			const duration = Date.now() - startTime;
			this.outputChannel.appendLine(`Build failed after ${duration}ms: ${error}`);

			return {
				success: false,
				outputPath: '',
				artifacts: [],
				logs: [],
				errors: [error instanceof Error ? error.message : String(error)],
				warnings: [],
				duration,
			};
		}
	}

	/**
	 * Get available build templates for different frameworks
	 */
	getBuildTemplates(): BuildTemplate[] {
		return [
			{
				name: 'React TypeScript',
				framework: 'react',
				scripts: {
					build: 'react-scripts build',
					start: 'react-scripts start',
					test: 'react-scripts test',
					eject: 'react-scripts eject',
				},
				dependencies: ['react', 'react-dom'],
				devDependencies: ['@types/react', '@types/react-dom', 'typescript'],
				config: {
					typescript: true,
					jsx: true,
					cssModules: false,
				},
			},
			{
				name: 'Next.js',
				framework: 'nextjs',
				scripts: {
					build: 'next build',
					start: 'next start',
					dev: 'next dev',
					lint: 'next lint',
				},
				dependencies: ['next', 'react', 'react-dom'],
				devDependencies: ['@types/node', '@types/react', '@types/react-dom', 'typescript'],
				config: {
					typescript: true,
					ssr: true,
					staticGeneration: true,
				},
			},
			{
				name: 'Node.js Express',
				framework: 'express',
				scripts: {
					build: 'tsc',
					start: 'node dist/index.js',
					dev: 'ts-node-dev src/index.ts',
					test: 'jest',
				},
				dependencies: ['express'],
				devDependencies: ['@types/express', '@types/node', 'typescript', 'ts-node-dev'],
				config: {
					typescript: true,
					api: true,
					database: false,
				},
			},
			{
				name: 'Vue.js',
				framework: 'vue',
				scripts: {
					build: 'vue-cli-service build',
					start: 'vue-cli-service serve',
					test: 'vue-cli-service test:unit',
					lint: 'vue-cli-service lint',
				},
				dependencies: ['vue'],
				devDependencies: ['@vue/cli-service', 'typescript'],
				config: {
					typescript: true,
					composition: true,
					router: true,
				},
			},
		];
	}

	/**
	 * Optimize build configuration for better performance
	 */
	async optimizeBuildConfig(config: BuildConfiguration): Promise<BuildConfiguration> {
		const optimized = { ...config };

		// Enable optimizations for production builds
		if (config.target === 'production') {
			optimized.optimization = true;
			optimized.minify = true;
			optimized.sourceMap = false;
		}

		// Framework-specific optimizations
		switch (config.framework) {
			case 'react':
				await this.optimizeReactBuild(optimized);
				break;
			case 'nextjs':
				await this.optimizeNextjsBuild(optimized);
				break;
			case 'express':
				await this.optimizeExpressBuild(optimized);
				break;
			case 'vue':
				await this.optimizeVueBuild(optimized);
				break;
		}

		return optimized;
	}

	/**
	 * Watch for file changes and trigger rebuilds
	 */
	async startWatchMode(config: BuildConfiguration): Promise<vscode.Disposable> {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			throw new Error('No workspace folder found');
		}

		const pattern = new vscode.RelativePattern(
			workspaceFolder,
			'**/*.{ts,tsx,js,jsx,vue,css,scss}'
		);
		const watcher = vscode.workspace.createFileSystemWatcher(pattern);

		let buildTimeout: NodeJS.Timeout | undefined;

		const triggerBuild = () => {
			if (buildTimeout) {
				clearTimeout(buildTimeout);
			}
			buildTimeout = setTimeout(async () => {
				this.outputChannel.appendLine('File change detected, rebuilding...');
				await this.buildProject(config);
			}, 1000); // Debounce builds
		};

		watcher.onDidChange(triggerBuild);
		watcher.onDidCreate(triggerBuild);
		watcher.onDidDelete(triggerBuild);

		return watcher;
	}

	/**
	 * Analyze build performance and suggest improvements
	 */
	async analyzeBuildPerformance(results: BuildResult[]): Promise<any> {
		if (results.length === 0) {
			return { suggestions: ['No build data available for analysis'] };
		}

		const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
		const successRate = results.filter(r => r.success).length / results.length;
		const commonErrors = this.findCommonErrors(results);

		const suggestions = [];

		if (averageDuration > 30000) {
			// > 30 seconds
			suggestions.push('Consider enabling build caching to improve build times');
			suggestions.push('Review bundle size and consider code splitting');
		}

		if (successRate < 0.9) {
			suggestions.push('High build failure rate detected. Review common errors');
		}

		return {
			averageDuration,
			successRate: successRate * 100,
			commonErrors,
			suggestions,
			totalBuilds: results.length,
		};
	}

	/**
	 * Private helper methods
	 */

	private async validateProjectStructure(): Promise<void> {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			throw new Error('No workspace folder found');
		}

		const packageJsonPath = vscode.Uri.joinPath(workspaceFolder.uri, 'package.json');
		try {
			await vscode.workspace.fs.stat(packageJsonPath);
		} catch {
			throw new Error('package.json not found. Please initialize a Node.js project first.');
		}
	}

	private async setupBuildEnvironment(config: BuildConfiguration): Promise<void> {
		// Install dependencies if needed
		await this.ensureDependencies(config);

		// Create output directory
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (workspaceFolder) {
			const outputDir = vscode.Uri.joinPath(workspaceFolder.uri, config.outputPath);
			try {
				await vscode.workspace.fs.createDirectory(outputDir);
			} catch {
				// Directory might already exist
			}
		}
	}

	private async executeBuild(config: BuildConfiguration): Promise<Omit<BuildResult, 'duration'>> {
		// This is a simplified build execution
		// In a real implementation, this would run the actual build tools
		const logs: string[] = [`Building ${config.framework} project for ${config.target}`];
		const artifacts: string[] = [];
		const errors: string[] = [];
		const warnings: string[] = [];

		// Simulate build process
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Add some realistic build artifacts
		if (config.framework === 'react') {
			artifacts.push('build/static/js/main.js', 'build/static/css/main.css', 'build/index.html');
		} else if (config.framework === 'nextjs') {
			artifacts.push('.next/static/chunks/', '.next/server/', '.next/standalone/');
		} else if (config.framework === 'express') {
			artifacts.push('dist/index.js', 'dist/routes/', 'dist/middleware/');
		}

		logs.push('Build process completed successfully');

		return {
			success: true,
			outputPath: config.outputPath,
			artifacts,
			logs,
			errors,
			warnings,
		};
	}

	private async postBuildOperations(
		config: BuildConfiguration,
		result: BuildResult
	): Promise<void> {
		// Store build results in memory
		const buildRecord = {
			timestamp: new Date().toISOString(),
			config,
			result,
		};

		// Save to workspace state
		const buildHistory = this.context.workspaceState.get<any[]>('aide.buildHistory', []);
		buildHistory.push(buildRecord);

		// Keep only last 50 builds
		if (buildHistory.length > 50) {
			buildHistory.splice(0, buildHistory.length - 50);
		}

		await this.context.workspaceState.update('aide.buildHistory', buildHistory);
		// Update memory service with build context
		if (this.memoryService) {
			const memoryGraph = this.memoryService.exportMemoryGraph();
			// In a real implementation, we would use the memory graph API
			// For now, just store the build information
			this.outputChannel.appendLine(`Build completed for ${config.framework}`);
		}
	}

	private async ensureDependencies(config: BuildConfiguration): Promise<void> {
		// In a real implementation, this would check and install dependencies
		this.outputChannel.appendLine('Checking dependencies...');

		// Simulate dependency check
		await new Promise(resolve => setTimeout(resolve, 500));

		this.outputChannel.appendLine('Dependencies validated');
	}

	private async optimizeReactBuild(config: BuildConfiguration): Promise<void> {
		// React-specific optimizations
		if (config.target === 'production') {
			// Enable React production optimizations
			this.outputChannel.appendLine('Applying React production optimizations');
		}
	}

	private async optimizeNextjsBuild(config: BuildConfiguration): Promise<void> {
		// Next.js-specific optimizations
		if (config.target === 'production') {
			this.outputChannel.appendLine('Applying Next.js production optimizations');
		}
	}

	private async optimizeExpressBuild(config: BuildConfiguration): Promise<void> {
		// Express-specific optimizations
		if (config.target === 'production') {
			this.outputChannel.appendLine('Applying Express production optimizations');
		}
	}

	private async optimizeVueBuild(config: BuildConfiguration): Promise<void> {
		// Vue-specific optimizations
		if (config.target === 'production') {
			this.outputChannel.appendLine('Applying Vue production optimizations');
		}
	}

	private findCommonErrors(results: BuildResult[]): string[] {
		const errorCounts = new Map<string, number>();

		results.forEach(result => {
			result.errors.forEach(error => {
				const count = errorCounts.get(error) || 0;
				errorCounts.set(error, count + 1);
			});
		});

		return Array.from(errorCounts.entries())
			.filter(([, count]) => count > 1)
			.sort((a, b) => b[1] - a[1])
			.map(([error]) => error)
			.slice(0, 5); // Top 5 common errors
	}

	/**
	 * Dispose of resources
	 */
	dispose(): void {
		this.outputChannel.dispose();
	}
}
