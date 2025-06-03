import { BaseAgent } from './baseAgent';
import { IMemoryGraph } from '../interfaces/IMemoryGraph';
import { AgentResponse, AgentAction } from './agentManager';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { createLogger } from '../services/loggerService';
import { ProjectBuilder } from '../services/projectBuilder';
import { FileManager } from '../services/fileManager';
import { TemplateGenerator } from '../services/templateGenerator';
import { ServerManager, ServerInfo } from '../services/serverManager';
import { withTimeout } from '../utils/asyncUtils';

/**
 * BuilderAgent class for AIDE
 * Responsible for building components, features, projects, and more
 * Uses modular services for better maintainability
 */
export class BuilderAgent extends BaseAgent {
	private readonly logger = createLogger('BuilderAgent');
	private projectBuilder: ProjectBuilder;
	private fileManager: FileManager;
	private templateGenerator: TemplateGenerator;
	private serverManager: ServerManager;
	constructor(memoryGraph: IMemoryGraph, aiService: any) {
		super(memoryGraph, 'builder', aiService);
		this.projectBuilder = new ProjectBuilder();
		this.fileManager = new FileManager();
		this.templateGenerator = new TemplateGenerator();
		this.serverManager = new ServerManager();
		this.logger.info('BuilderAgent initialized with modular services');
	}

	/**
	 * Process a message and return a response
	 * @param message User message
	 * @param intentId Intent ID
	 */
	async process(message: string, intentId: string): Promise<AgentResponse> {
		const context = this.getRelatedContext(message);
		const buildType = this.determineBuildType(message);

		let response: string;
		const actions: AgentAction[] = [];

		try {
			switch (buildType) {
				case 'component':
					response = await this.buildComponent(message, intentId, context, actions);
					break;
				case 'feature':
					response = await this.buildFeature(message, intentId, context, actions);
					break;
				case 'project':
					response = await this.buildProject(message, intentId, context, actions);
					break;
				case 'function':
					response = await this.buildFunction(message, intentId, context, actions);
					break;
				default:
					response = await this.generalBuild(message, intentId, context, actions);
			}

			// Add implementation record to memory
			this.memoryGraph.addNode('logic', `Implemented: ${message}`, {
				agent: 'builder',
				buildType,
				timestamp: new Date().toISOString(),
				actions: actions.length
			});
		} catch (error) {
			this.logger.error(`Error processing builder request: ${message}`, error);
			response = `❌ **Build Failed**\n\nI encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`;
		}

		return {
			agent: 'builder',
			message: response,
			actions,
			metadata: {
				buildType,
				actionsGenerated: actions.length,
				contextItems: context.length
			}
		};
	}

	/**
	 * Get builder agent status
	 */
	async getStatus(): Promise<Record<string, any>> {
		const logicNodes = this.memoryGraph.getNodesByType('logic')
			.filter(node => node.metadata.agent === 'builder');

		const recentBuilds = logicNodes.slice(-10);

		return {
			totalImplementations: logicNodes.length,
			recentBuilds: recentBuilds.map(node => ({
				content: node.content,
				type: node.metadata.buildType,
				timestamp: node.timestamp
			})),
			buildTypes: this.getBuildTypeStats(logicNodes)
		};
	}

	/**
	 * Build a component
	 */	private async buildComponent(message: string, intentId: string, context: string[], actions: AgentAction[]): Promise<string> {
		const systemPrompt = `You are a builder agent responsible for generating components. Your task is to:
1. Analyze the user request and identify the component requirements
2. Generate clean, maintainable code following best practices
3. Include appropriate styling and tests
4. Provide clear documentation and comments

Focus on creating production-ready components with proper TypeScript types, error handling, and accessibility features.`;

		const prompt = `Build a component based on: "${message}". Generate the necessary code, styles, and tests.

Context: ${context.join('\n')}

Please provide:
1. Component implementation with TypeScript
2. Corresponding CSS/styling
3. Unit tests
4. Usage documentation`;

		const aiResponse = await this.generateAIResponse(prompt, context, systemPrompt);

		// Extract component name
		const componentName = this.extractComponentName(message);

		try {
			// Use the ProjectBuilder service to build the component
			await withTimeout(
				this.projectBuilder.buildComponent(componentName, actions),
				10000, // 10 second timeout
				'Component build operation timed out'
			);

			this.logger.info(`Component ${componentName} built successfully`);

			return `🧱 **Component Built Successfully**

**Component:** ${componentName}

**Generated Files:**
- \`src/components/${componentName}/${componentName}.tsx\` - Main component
- \`src/components/${componentName}/${componentName}.css\` - Styles
- \`src/components/${componentName}/${componentName}.test.tsx\` - Tests

**Implementation Details:**
${aiResponse}

**Features Included:**
- TypeScript definitions
- CSS styles with clean organization
- Proper prop interfaces
- Unit tests`;
		} catch (error) {
			this.logger.error(`Failed to build component ${componentName}:`, error);
			return `❌ **Component Build Failed**

**Component:** ${componentName}

**Error:** ${error instanceof Error ? error.message : 'Unknown error'}

Please try again or provide more details about the component you want to build.`;
		}
	}

	/**
	 * Build a feature
	 */	private async buildFeature(message: string, intentId: string, context: string[], actions: AgentAction[]): Promise<string> {
		const systemPrompt = `You are a builder agent responsible for implementing features. Your task is to:
1. Analyze the feature requirements and break them down into components
2. Generate all necessary files, components, and logic
3. Ensure proper integration with existing codebase
4. Follow software architecture principles and best practices
5. Create comprehensive tests and documentation

Focus on creating scalable, maintainable solutions with proper error handling and performance considerations.`;

		const prompt = `Implement a feature based on: "${message}". Generate all necessary files, components, and logic.

Context: ${context.join('\n')}

Please provide:
1. Feature implementation plan
2. All necessary files and components
3. Integration points with existing code
4. Comprehensive tests
5. Documentation and usage examples`;

		const aiResponse = await this.generateAIResponse(prompt, context, systemPrompt);

		// Extract feature name
		const featureName = this.extractFeatureName(message);

		try {
			// Use the ProjectBuilder service to build the feature
			await withTimeout(
				this.projectBuilder.buildFeature(featureName, actions),
				10000, // 10 second timeout
				'Feature build operation timed out'
			);

			this.logger.info(`Feature ${featureName} built successfully`);

			return `⚡ **Feature Implementation Complete**

**Feature:** ${featureName}

**Generated Structure:**
- Feature hook: \`src/hooks/use${featureName}.ts\`
- Feature view: \`src/features/${this.pascalToKebab(featureName)}/${featureName}View.tsx\`

**Implementation Details:**
${aiResponse}

**Integration Points:**
- Hook can be imported with: \`import { use${featureName} } from './hooks/use${featureName}'\`
- View component can be imported with: \`import { ${featureName}View } from './features/${this.pascalToKebab(featureName)}/${featureName}View'\``;
		} catch (error) {
			this.logger.error(`Failed to build feature ${featureName}:`, error);
			return `❌ **Feature Build Failed**

**Feature:** ${featureName}

**Error:** ${error instanceof Error ? error.message : 'Unknown error'}

Please try again or provide more details about the feature you want to build.`;
		}
	}

	/**
	 * Build a function
	 */
	private async buildFunction(message: string, intentId: string, context: string[], actions: AgentAction[]): Promise<string> {
		// Extract function name
		const functionName = this.extractFunctionName(message);

		try {
			// Use the ProjectBuilder service to build the function
			await withTimeout(
				this.projectBuilder.buildFunction(functionName, actions),
				5000, // 5 second timeout
				'Function build operation timed out'
			);

			this.logger.info(`Function ${functionName} built successfully`);

			return `🔧 **Function Created Successfully**

**Function:** ${functionName}

**Generated File:**
- \`src/utils/${functionName}.ts\`

**Implementation:** Ready for your custom logic.`;
		} catch (error) {
			this.logger.error(`Failed to build function ${functionName}:`, error);
			return `❌ **Function Build Failed**

**Function:** ${functionName}

**Error:** ${error instanceof Error ? error.message : 'Unknown error'}

Please try again or provide more details about the function you want to build.`;
		}
	}

	/**
	 * Build a project
	 */
	private async buildProject(message: string, intentId: string, context: string[], actions: AgentAction[]): Promise<string> {
		const projectName = this.extractProjectName(message);
		const projectType = this.determineProjectType(message);

		// Default project path - in real implementation, we might ask the user
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		const projectPath = workspaceFolder ? path.join(workspaceFolder, projectName.toLowerCase().replace(/\s+/g, '-')) : '';

		try {
			// For this refactored implementation, we'll delegate to the appropriate service
			// In a full implementation, we'd have ProjectBuilder methods for different project types
			if (projectType === 'api') {
				// Use ServerManager for API projects
				const port = 3000; // Default port, could be customized
				await withTimeout(
					this.projectBuilder.buildServerProject(projectName, port, actions),
					15000, // 15 second timeout
					'Server project build operation timed out'
				);
			} else {
				// Use generic file creation for now
				// In a complete implementation, we'd have specialized methods
				await this.fileManager.createFile(
					`${projectPath}/README.md`,
					`# ${projectName}\n\nA ${this.getProjectTypeName(projectType)} project built with AIDE.`
				);

				actions.push({
					type: 'createFile',
					target: `${projectPath}/README.md`,
					description: `Created README for ${projectName}`
				});
			}

			// Add to memory
			this.memoryGraph.addNode('feature', `Project: ${projectName}`, {
				type: projectType,
				path: projectPath,
				createdAt: new Date().toISOString(),
				status: 'created'
			});

			return `🚀 **Project Created Successfully!**

**Project:** ${projectName}
**Type:** ${this.getProjectTypeName(projectType)}
**Location:** ${projectPath}

**Generated Files:**
${actions.filter(a => a.type === 'createFile').map(a => `- \`${a.target}\``).join('\n')}

**Next Steps:**
1. Open the project folder
2. Install dependencies
3. Start development server`;
		} catch (error) {
			this.logger.error(`Failed to build project ${projectName}:`, error);
			return `❌ **Project Creation Failed**

**Project:** ${projectName}

**Error:** ${error instanceof Error ? error.message : 'Unknown error'}

Please try again or provide more details about the project you want to create.`;
		}
	}

	/**
	 * Generic build handler when a specific build type isn't determined
	 */
	private async generalBuild(message: string, intentId: string, context: string[], actions: AgentAction[]): Promise<string> {
		this.logger.info(`Processing general build request: ${message}`);

		return `I'll help you build that! Let me know what specific type of build you need:

1. 🧩 **Component** - UI component with styling and tests
2. ⚡ **Feature** - Complete feature implementation with hooks and components
3. 🔧 **Function** - Utility function or method
4. 🚀 **Project** - Full project scaffolding

Just provide more details about what you want to build.`;
	}

	/**
	 * Helper method to get build type statistics
	 */
	private getBuildTypeStats(logicNodes: any[]): Record<string, number> {
		const stats: Record<string, number> = {
			component: 0,
			feature: 0,
			project: 0,
			function: 0,
			general: 0
		};

		logicNodes.forEach(node => {
			const buildType = node.metadata.buildType;
			if (stats[buildType] !== undefined) {
				stats[buildType]++;
			} else {
				stats.general++;
			}
		});

		return stats;
	}

	/**
	 * Determine the build type from message content
	 */
	private determineBuildType(message: string): string {
		const lowercaseMessage = message.toLowerCase();

		if (lowercaseMessage.includes('component') || lowercaseMessage.includes('widget')) {
			return 'component';
		}
		if (lowercaseMessage.includes('feature') || lowercaseMessage.includes('functionality')) {
			return 'feature';
		}
		if (lowercaseMessage.includes('project') || lowercaseMessage.includes('application')) {
			return 'project';
		}
		if (lowercaseMessage.includes('function') || lowercaseMessage.includes('method')) {
			return 'function';
		}

		return 'general';
	}

	/**
	 * Determine the project type from message content
	 */
	private determineProjectType(message: string): string {
		const lowercaseMessage = message.toLowerCase();

		if (lowercaseMessage.includes('react') || lowercaseMessage.includes('frontend') || lowercaseMessage.includes('ui')) {
			return 'react';
		}
		if (lowercaseMessage.includes('node') || lowercaseMessage.includes('express') || lowercaseMessage.includes('api')) {
			return 'api';
		}
		if (lowercaseMessage.includes('mobile') || lowercaseMessage.includes('react native') || lowercaseMessage.includes('app')) {
			return 'mobile';
		}
		if (lowercaseMessage.includes('electron') || lowercaseMessage.includes('desktop')) {
			return 'desktop';
		}

		return 'basic';
	}

	/**
	 * Get a user-friendly name for a project type
	 */
	private getProjectTypeName(projectType: string): string {
		const typeNames: Record<string, string> = {
			'react': 'React Frontend',
			'api': 'Node.js API',
			'mobile': 'React Native Mobile App',
			'desktop': 'Electron Desktop App',
			'basic': 'JavaScript/TypeScript'
		};

		return typeNames[projectType] || 'Basic Project';
	}

	/**
	 * Extract component name from message
	 */
	private extractComponentName(message: string): string {
		const match = message.match(/component\s+(?:called\s+)?([a-zA-Z][a-zA-Z0-9]*)/i);
		return match ? this.capitalize(match[1]) : 'NewComponent';
	}

	/**
	 * Extract feature name from message
	 */
	private extractFeatureName(message: string): string {
		const match = message.match(/feature\s+(?:called\s+)?([a-zA-Z][a-zA-Z0-9]*)/i);
		return match ? this.capitalize(match[1]) : 'NewFeature';
	}

	/**
	 * Extract function name from message
	 */
	private extractFunctionName(message: string): string {
		const match = message.match(/function\s+(?:called\s+)?([a-zA-Z][a-zA-Z0-9]*)/i);
		return match ? match[1] : 'newFunction';
	}

	/**
	 * Extract project name from message
	 */
	private extractProjectName(message: string): string {
		const match = message.match(/project\s+(?:called\s+)?([a-zA-Z][a-zA-Z0-9\s]+?)(?:\s+with|\s+using|\s+for|\s+that|\s+to|\s*$)/i);
		return match ? this.capitalize(match[1].trim()) : 'NewProject';
	}

	/**
	 * Capitalize first letter of a string
	 */
	private capitalize(str: string): string {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}

	/**
	 * Convert PascalCase to kebab-case
	 */
	private pascalToKebab(str: string): string {
		return str
			.replace(/([a-z])([A-Z])/g, '$1-$2')
			.replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
			.toLowerCase();
	}

	// Add missing methods from BaseAgent
	protected getRelatedContext(query: string): string[] {
		const nodes = this.memoryGraph.searchNodes(query);
		return nodes.map(node => `${node.type}: ${node.content}`);
	}

}
