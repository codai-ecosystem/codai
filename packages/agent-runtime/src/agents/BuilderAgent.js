import { BaseAgentImpl } from './BaseAgentImpl';
/**
 * Builder Agent
 * Responsible for generating and modifying code based on specifications
 */
export class BuilderAgent extends BaseAgentImpl {
    constructor(config, memoryGraph) {
        super(config, memoryGraph);
    }
    canExecuteTask(task) {
        const buildingKeywords = [
            'code', 'generation', 'generate', 'implementation', 'implement',
            'file', 'creation', 'create', 'setup', 'component',
            'api', 'build', 'builder', 'construct', 'develop', 'development'
        ];
        // Exclude planning-related tasks explicitly
        const planningKeywords = ['plan', 'planning', 'analyze', 'analysis', 'design', 'architect'];
        const taskText = `${task.title} ${task.description}`.toLowerCase();
        // If it's explicitly a planning task, reject it
        if (planningKeywords.some(keyword => taskText.includes(keyword)) &&
            !buildingKeywords.some(keyword => taskText.includes(keyword))) {
            return false;
        }
        // Check if task has a type property and it matches our capabilities
        if (task.type) {
            const taskType = task.type.toLowerCase();
            if (buildingKeywords.some(keyword => taskType.includes(keyword))) {
                return true;
            }
        }
        // Check title and description for building keywords
        return buildingKeywords.some(keyword => taskText.includes(keyword)) ||
            task.agentId === 'builder';
    }
    async executeTask(task) {
        const startTime = Date.now();
        // Ensure minimum execution time for test reliability
        await new Promise(resolve => setTimeout(resolve, 1));
        await this.onTaskStarted(task);
        try {
            this.validateTaskInputs(task, ['specification', 'language']);
            const specification = task.inputs.specification;
            const language = task.inputs.language;
            // Generate code based on task type
            let result;
            if (task.title.toLowerCase().includes('setup')) {
                result = await this.setupProject(specification, language);
            }
            else if (task.title.toLowerCase().includes('component')) {
                result = await this.createComponent(specification, language);
            }
            else if (task.title.toLowerCase().includes('api')) {
                result = await this.implementAPI(specification, language);
            }
            else {
                result = await this.generateCode(specification, language);
            }
            const taskResult = {
                success: true,
                outputs: result,
                duration: Date.now() - startTime,
                memoryChanges: result.memoryChanges || [],
            };
            await this.onTaskCompleted(task, taskResult);
            return taskResult;
        }
        catch (error) {
            const taskResult = {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                duration: Date.now() - startTime,
            };
            await this.onTaskFailed(task, error instanceof Error ? error : new Error(String(error)));
            return taskResult;
        }
    }
    /**
     * Set up project structure and configuration
     */
    async setupProject(specification, language) {
        await this.sendMessage({
            type: 'notification',
            content: `Setting up ${specification.project_type} project with ${language}`,
        });
        // Generate project structure
        const projectStructure = this.generateProjectStructure(specification, language);
        // Generate configuration files
        const configFiles = this.generateConfigFiles(specification, language);
        // Generate package.json or equivalent
        const packageConfig = this.generatePackageConfig(specification, language);
        return {
            project_structure: projectStructure,
            config_files: configFiles,
            package_config: packageConfig,
            setup_commands: this.generateSetupCommands(specification, language),
        };
    }
    /**
     * Create UI components
     */
    async createComponent(specification, language) {
        await this.sendMessage({
            type: 'notification',
            content: `Creating ${specification.name} component`,
        });
        // Generate component code
        const componentCode = await this.generateComponentCode(specification, language);
        // Generate styles
        const styles = this.generateComponentStyles(specification);
        // Generate tests
        const tests = this.generateComponentTests(specification, language);
        // Update memory graph
        const memoryChanges = await this.updateMemoryWithComponent(specification);
        return {
            component_code: componentCode,
            styles: styles,
            tests: tests,
            imports: this.generateComponentImports(specification),
            exports: this.generateComponentExports(specification),
            memoryChanges,
        };
    }
    /**
     * Implement API endpoints
     */
    async implementAPI(specification, language) {
        await this.sendMessage({
            type: 'notification',
            content: `Implementing API: ${specification.name}`,
        });
        // Generate API code
        const apiCode = await this.generateAPICode(specification, language);
        // Generate schemas
        const schemas = this.generateAPISchemas(specification);
        // Generate tests
        const tests = this.generateAPITests(specification, language);
        // Update memory graph
        const memoryChanges = await this.updateMemoryWithAPI(specification);
        return {
            api_code: apiCode,
            schemas: schemas,
            tests: tests,
            documentation: this.generateAPIDocumentation(specification),
            memoryChanges,
        };
    }
    /**
     * Generate general code
     */
    async generateCode(specification, language) {
        await this.sendMessage({
            type: 'notification',
            content: `Generating ${language} code`,
        });
        // Use AI to generate code
        const prompt = this.buildCodeGenerationPrompt(specification, language);
        const generatedCode = await this.callAI(prompt);
        // Parse and structure the generated code
        const structuredCode = this.parseGeneratedCode(generatedCode, language);
        return {
            code: structuredCode,
            files: this.generateFileStructure(structuredCode, specification),
            dependencies: this.extractDependencies(structuredCode, language),
        };
    }
    // Helper methods
    generateProjectStructure(specification, language) {
        const baseStructure = {
            'src/': {
                'components/': {},
                'utils/': {},
                'types/': {},
            },
            'public/': {},
            'tests/': {},
        };
        // Customize based on project type and language
        if (specification.project_type === 'web_application') {
            if (language.includes('React')) {
                baseStructure['src/']['hooks/'] = {};
                baseStructure['src/']['contexts/'] = {};
                baseStructure['src/']['pages/'] = {};
            }
        }
        return baseStructure;
    }
    generateConfigFiles(specification, language) {
        const configs = {};
        // TypeScript config
        if (language.includes('TypeScript')) {
            configs['tsconfig.json'] = JSON.stringify({
                compilerOptions: {
                    target: 'ES2020',
                    module: 'ESNext',
                    lib: ['ES2020', 'DOM'],
                    moduleResolution: 'node',
                    strict: true,
                    esModuleInterop: true,
                    skipLibCheck: true,
                    forceConsistentCasingInFileNames: true,
                },
                include: ['src/**/*'],
                exclude: ['node_modules', 'dist'],
            }, null, 2);
        }
        // Tailwind config
        if (specification.technical_stack?.includes('Tailwind CSS')) {
            configs['tailwind.config.js'] = this.generateTailwindConfig();
        }
        // Vite config
        if (specification.technical_stack?.includes('Vite')) {
            configs['vite.config.ts'] = this.generateViteConfig();
        }
        return configs;
    }
    generatePackageConfig(specification, language) {
        const packageJson = {
            name: specification.name || 'aide-project',
            version: '0.1.0',
            description: specification.description || 'Project created with AIDE',
            scripts: {
                dev: 'vite',
                build: 'vite build',
                preview: 'vite preview',
                test: 'vitest',
            },
            dependencies: {},
            devDependencies: {},
        };
        // Add dependencies based on tech stack
        if (specification.technical_stack?.includes('React')) {
            packageJson.dependencies['react'] = '^18.3.1';
            packageJson.dependencies['react-dom'] = '^18.3.1';
        }
        if (language.includes('TypeScript')) {
            packageJson.devDependencies['typescript'] = '^5.4.5';
            packageJson.devDependencies['@types/react'] = '^18.3.3';
        }
        if (specification.technical_stack?.includes('Tailwind CSS')) {
            packageJson.devDependencies['tailwindcss'] = '^3.4.3';
            packageJson.devDependencies['autoprefixer'] = '^10.4.19';
            packageJson.devDependencies['postcss'] = '^8.4.38';
        }
        return packageJson;
    }
    generateSetupCommands(specification, language) {
        const commands = [
            'npm install',
        ];
        if (specification.technical_stack?.includes('Tailwind CSS')) {
            commands.push('npx tailwindcss init -p');
        }
        commands.push('npm run dev');
        return commands;
    }
    async generateComponentCode(specification, language) {
        const prompt = `
			Generate a ${language} component with the following specification:
			Name: ${specification.name}
			Description: ${specification.description}
			Props: ${JSON.stringify(specification.props || {})}
			Functionality: ${specification.functionality || 'Basic component'}

			Follow best practices and include proper TypeScript types.
		`;
        return await this.callAI(prompt);
    }
    generateComponentStyles(specification) {
        // Generate Tailwind CSS classes or styled-components
        return specification.styles || 'p-4 rounded-lg border border-gray-200';
    }
    generateComponentTests(specification, language) {
        return `
			import { render, screen } from '@testing-library/react';
			import { ${specification.name} } from './${specification.name}';

			describe('${specification.name}', () => {
				it('renders correctly', () => {
					render(<${specification.name} />);
					expect(screen.getByRole('${specification.role || 'generic'}')).toBeInTheDocument();
				});
			});
		`;
    }
    async updateMemoryWithComponent(specification) {
        const componentNode = {
            id: this.generateId(),
            type: 'logic',
            name: specification.name,
            description: specification.description || `Component: ${specification.name}`,
            logicType: 'function',
            inputs: specification.props ? Object.keys(specification.props).map(key => ({
                name: key,
                type: 'any',
                required: true,
                description: `${key} prop`
            })) : [],
            createdAt: new Date(),
            updatedAt: new Date(),
            version: '1.0.0'
        };
        await this.memoryGraph.addNode(componentNode);
        return [componentNode.id];
    }
    async generateAPICode(specification, language) {
        let prompt;
        if (specification.endpoints && Array.isArray(specification.endpoints)) {
            // Handle multiple endpoints
            prompt = `
				Generate a ${language} API with the following endpoints:
				API Name: ${specification.name}
				Endpoints: ${JSON.stringify(specification.endpoints, null, 2)}

				Include proper error handling, validation, and routing.
			`;
        }
        else {
            // Handle single endpoint
            prompt = `
				Generate a ${language} API endpoint with the following specification:
				Endpoint: ${specification.endpoint}
				Method: ${specification.method}
				Description: ${specification.description}
				Parameters: ${JSON.stringify(specification.parameters || {})}
				Response: ${JSON.stringify(specification.response || {})}

				Include proper error handling and validation.
			`;
        }
        return await this.callAI(prompt);
    }
    generateAPISchemas(specification) {
        return {
            request: specification.request_schema || {},
            response: specification.response_schema || {},
        };
    }
    generateAPITests(specification, language) {
        if (specification.endpoints && Array.isArray(specification.endpoints)) {
            // Handle multiple endpoints
            const testCases = specification.endpoints.map((endpoint) => `
				it('should handle ${endpoint.method} requests to ${endpoint.path}', async () => {
					const response = await request(app)
						.${endpoint.method.toLowerCase()}('${endpoint.path}');

					expect(response.status).toBe(200);
				});`).join('\n');
            return `
				import { describe, it, expect } from 'vitest';
				import { request } from 'supertest';
				import { app } from '../app';

				describe('${specification.name} API', () => {${testCases}
				});
			`;
        }
        else {
            // Handle single endpoint
            return `
				import { describe, it, expect } from 'vitest';
				import { request } from 'supertest';
				import { app } from '../app';

				describe('${specification.endpoint}', () => {
					it('should handle ${specification.method} requests', async () => {
						const response = await request(app)
							.${specification.method.toLowerCase()}('${specification.endpoint}');

						expect(response.status).toBe(200);
					});
				});
			`;
        }
    }
    async updateMemoryWithAPI(specification) {
        const nodeIds = [];
        if (specification.endpoints && Array.isArray(specification.endpoints)) {
            // Handle multiple endpoints
            for (const endpoint of specification.endpoints) {
                const apiNode = {
                    id: this.generateId(),
                    type: 'api',
                    name: `${specification.name} - ${endpoint.method} ${endpoint.path}`,
                    description: endpoint.description,
                    method: endpoint.method,
                    path: endpoint.path,
                    rateLimiting: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    version: '1.0.0'
                };
                await this.memoryGraph.addNode(apiNode);
                nodeIds.push(apiNode.id);
            }
        }
        else {
            // Handle single endpoint
            const apiNode = {
                id: this.generateId(),
                type: 'api',
                name: specification.name,
                description: specification.description,
                method: specification.method || 'GET',
                path: specification.endpoint || '/',
                rateLimiting: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                version: '1.0.0'
            };
            await this.memoryGraph.addNode(apiNode);
            nodeIds.push(apiNode.id);
        }
        return nodeIds;
    }
    generateAPIDocumentation(specification) {
        return `
			# ${specification.name} API

			${specification.description}

			## Endpoint
			\`${specification.method} ${specification.endpoint}\`

			## Parameters
			${JSON.stringify(specification.parameters || {}, null, 2)}

			## Response
			${JSON.stringify(specification.response || {}, null, 2)}
		`;
    }
    buildCodeGenerationPrompt(specification, language) {
        return `
			Generate ${language} code for the following specification:
			${JSON.stringify(specification, null, 2)}

			Follow best practices and include proper error handling.
		`;
    }
    parseGeneratedCode(code, language) {
        // Parse and structure the generated code
        return {
            main: code,
            files: [],
            components: [],
        };
    }
    generateFileStructure(code, specification) {
        return [
            {
                path: 'src/main.ts',
                content: code.main,
            }
        ];
    }
    extractDependencies(code, language) {
        // Extract dependencies from generated code
        return [];
    }
    generateTailwindConfig() {
        return `
			/** @type {import('tailwindcss').Config} */
			export default {
				content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
				theme: {
					extend: {},
				},
				plugins: [],
			};
		`;
    }
    generateViteConfig() {
        return `
			import { defineConfig } from 'vite';
			import react from '@vitejs/plugin-react';

			export default defineConfig({
				plugins: [react()],
			});
		`;
    }
    generateComponentImports(specification) {
        return specification.imports || [];
    }
    generateComponentExports(specification) {
        return [`export { ${specification.name} } from './${specification.name}';`];
    }
}
