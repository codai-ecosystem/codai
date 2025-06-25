import * as vscode from 'vscode';
import * as path from 'path';
import { createLogger } from './loggerService';
import { FileManager } from './fileManager';
import { TemplateGenerator } from './templateGenerator';
import { ServerManager, ServerInfo } from './serverManager';
import { AgentAction } from '../agents/agentManager';

/**
 * ProjectBuilder class for handling project building operations
 * Extracted from BuilderAgent to improve maintainability
 */
export class ProjectBuilder {
	private readonly logger = createLogger('ProjectBuilder');
	private fileManager: FileManager;
	private templateGenerator: TemplateGenerator;
	private serverManager: ServerManager;

	constructor() {
		this.fileManager = new FileManager();
		this.templateGenerator = new TemplateGenerator();
		this.serverManager = new ServerManager();
		this.logger.debug('ProjectBuilder initialized');
	}

	/**
	 * Build a React component
	 * @param componentName Name of the component to build
	 * @param actions Actions array to track operations
	 */
	public async buildComponent(componentName: string, actions: AgentAction[]): Promise<boolean> {
		try {
			this.logger.info(`Building component: ${componentName}`);

			// Create component directory
			const componentDir = `src/components/${componentName}`;

			// Generate component files
			await this.fileManager.createFile(
				`${componentDir}/${componentName}.tsx`,
				this.templateGenerator.generateComponentCode(componentName)
			);

			await this.fileManager.createFile(
				`${componentDir}/${componentName}.css`,
				this.templateGenerator.generateComponentCSS(componentName)
			);

			await this.fileManager.createFile(
				`${componentDir}/${componentName}.test.tsx`,
				this.templateGenerator.generateComponentTest(componentName)
			);

			// Log actions
			actions.push({
				type: 'createFile',
				target: `${componentDir}/${componentName}.tsx`,
				description: `Created ${componentName} component`,
			});

			actions.push({
				type: 'createFile',
				target: `${componentDir}/${componentName}.css`,
				description: `Created ${componentName} component styles`,
			});

			actions.push({
				type: 'createFile',
				target: `${componentDir}/${componentName}.test.tsx`,
				description: `Created ${componentName} component tests`,
			});

			this.logger.info(`Component ${componentName} built successfully`);
			return true;
		} catch (error) {
			this.logger.error(`Failed to build component ${componentName}:`, error);
			return false;
		}
	}

	/**
	 * Build a feature
	 * @param featureName Name of the feature to build
	 * @param actions Actions array to track operations
	 */
	public async buildFeature(featureName: string, actions: AgentAction[]): Promise<boolean> {
		try {
			this.logger.info(`Building feature: ${featureName}`);

			// Create feature hook
			await this.fileManager.createFile(
				`src/hooks/use${featureName}.ts`,
				this.templateGenerator.generateFeatureHook(featureName)
			);

			// Create feature example component
			await this.fileManager.createFile(
				`src/features/${this.pascalToKebab(featureName)}/${featureName}View.tsx`,
				this.generateFeatureViewComponent(featureName)
			);

			// Log actions
			actions.push({
				type: 'createFile',
				target: `src/hooks/use${featureName}.ts`,
				description: `Created ${featureName} feature hook`,
			});

			actions.push({
				type: 'createFile',
				target: `src/features/${this.pascalToKebab(featureName)}/${featureName}View.tsx`,
				description: `Created ${featureName} feature view component`,
			});

			this.logger.info(`Feature ${featureName} built successfully`);
			return true;
		} catch (error) {
			this.logger.error(`Failed to build feature ${featureName}:`, error);
			return false;
		}
	}

	/**
	 * Build a function utility
	 * @param functionName Name of the function to build
	 * @param actions Actions array to track operations
	 */
	public async buildFunction(functionName: string, actions: AgentAction[]): Promise<boolean> {
		try {
			this.logger.info(`Building function: ${functionName}`);

			// Create function file
			await this.fileManager.createFile(
				`src/utils/${functionName}.ts`,
				this.templateGenerator.generateFunctionCode(functionName)
			);

			// Log actions
			actions.push({
				type: 'createFile',
				target: `src/utils/${functionName}.ts`,
				description: `Created ${functionName} utility function`,
			});

			this.logger.info(`Function ${functionName} built successfully`);
			return true;
		} catch (error) {
			this.logger.error(`Failed to build function ${functionName}:`, error);
			return false;
		}
	}

	/**
	 * Build a server project
	 * @param name Name of the server project
	 * @param port Server port
	 * @param actions Actions array to track operations
	 */
	public async buildServerProject(
		name: string,
		port: number,
		actions: AgentAction[]
	): Promise<boolean> {
		try {
			this.logger.info(`Building server project: ${name}`);
			const projectDir = `${this.pascalToKebab(name)}-server`;

			// Create project structure
			await this.fileManager.createFile(
				`${projectDir}/package.json`,
				this.serverManager.generatePackageJson(name, `${name} API Server`)
			);

			await this.fileManager.createFile(
				`${projectDir}/tsconfig.json`,
				this.serverManager.generateTsConfig()
			);

			await this.fileManager.createFile(
				`${projectDir}/.env`,
				this.serverManager.generateDotEnv(port)
			);

			await this.fileManager.createFile(
				`${projectDir}/src/index.ts`,
				this.templateGenerator.generateServerCode(name, port)
			);

			// Log actions
			actions.push(
				{
					type: 'createFile',
					target: `${projectDir}/package.json`,
					description: `Created ${name} server package.json`,
				},
				{
					type: 'createFile',
					target: `${projectDir}/tsconfig.json`,
					description: `Created ${name} server tsconfig.json`,
				},
				{
					type: 'createFile',
					target: `${projectDir}/.env`,
					description: `Created ${name} server environment file`,
				},
				{
					type: 'createFile',
					target: `${projectDir}/src/index.ts`,
					description: `Created ${name} server entry point`,
				}
			);

			this.logger.info(`Server project ${name} built successfully`);
			return true;
		} catch (error) {
			this.logger.error(`Failed to build server project ${name}:`, error);
			return false;
		}
	}

	/**
	 * Generate feature view component code
	 * @param featureName Name of the feature
	 */
	private generateFeatureViewComponent(featureName: string): string {
		return `import React from 'react';
import { use${featureName} } from '../../hooks/use${featureName}';

interface ${featureName}ViewProps {
    title?: string;
}

export const ${featureName}View: React.FC<${featureName}ViewProps> = ({ title = '${featureName} Feature' }) => {
    const { isLoading, data, error, refresh } = use${featureName}();

    return (
        <div className="${this.pascalToKebab(featureName)}-view">
            <h2>{title}</h2>

            {isLoading && (
                <p>Loading ${featureName} data...</p>
            )}

            {error && (
                <div className="error-container">
                    <p>Error: {error.message}</p>
                    <button onClick={refresh}>Retry</button>
                </div>
            )}

            {data && (
                <div className="data-container">
                    <pre>{JSON.stringify(data, null, 2)}</pre>
                    <button onClick={refresh}>Refresh</button>
                </div>
            )}
        </div>
    );
};

export default ${featureName}View;
`;
	}

	/**
	 * Convert PascalCase to kebab-case
	 * @param str String to convert
	 */
	private pascalToKebab(str: string): string {
		return str
			.replace(/([a-z])([A-Z])/g, '$1-$2')
			.replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
			.toLowerCase();
	}
}
