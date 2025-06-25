import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { MemoryService } from './memoryService';
import { createLogger } from './loggerService';

/**
 * Project Service for AIDE Extension
 * Manages project creation, templates, and configuration
 */

export interface ProjectTemplate {
	id: string;
	name: string;
	description: string;
	type: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'ai' | 'other';
	technologies: string[];
	features: string[];
	files: ProjectFile[];
	dependencies: Record<string, string>;
	devDependencies: Record<string, string>;
	scripts: Record<string, string>;
	configuration: Record<string, any>;
}

export interface ProjectFile {
	path: string;
	content: string;
	template?: boolean;
	executable?: boolean;
}

export interface ProjectConfig {
	name: string;
	type: string;
	template: string;
	features: string[];
	targetPath: string;
	options?: Record<string, any>;
}

export class ProjectService {
	private templates: Map<string, ProjectTemplate> = new Map();
	private memoryService: MemoryService;
	private context: vscode.ExtensionContext;
	private readonly logger = createLogger('ProjectService');

	constructor(context: vscode.ExtensionContext, memoryService: MemoryService) {
		this.context = context;
		this.memoryService = memoryService;
		this.initializeTemplates();
	}

	/**
	 * Get all available project templates
	 */
	getTemplates(): ProjectTemplate[] {
		return Array.from(this.templates.values());
	}

	/**
	 * Get template by ID
	 */
	getTemplate(templateId: string): ProjectTemplate | undefined {
		return this.templates.get(templateId);
	}

	/**
	 * Get templates by type
	 */
	getTemplatesByType(type: string): ProjectTemplate[] {
		return Array.from(this.templates.values()).filter(template => template.type === type);
	}

	/**
	 * Create a new project from template
	 */
	async createProject(config: ProjectConfig): Promise<void> {
		const template = this.templates.get(config.template);
		if (!template) {
			throw new Error(`Template ${config.template} not found`);
		}

		const projectPath = path.join(config.targetPath, config.name);

		// Create project directory
		if (!fs.existsSync(projectPath)) {
			fs.mkdirSync(projectPath, { recursive: true });
		}

		// Create project files
		await this.createProjectFiles(template, projectPath, config);

		// Create package.json
		await this.createPackageJson(template, projectPath, config);

		// Create configuration files
		await this.createConfigurationFiles(template, projectPath, config);

		// Update memory with project context
		this.memoryService.updateProjectContext({
			name: config.name,
			type: config.type,
			technologies: template.technologies,
			structure: await this.analyzeProjectStructure(projectPath),
			dependencies: Object.keys(template.dependencies),
		});

		// Show success message
		vscode.window.showInformationMessage(`Project ${config.name} created successfully!`);

		// Open project in new window
		const openChoice = await vscode.window.showInformationMessage(
			'Would you like to open the project?',
			'Open in New Window',
			'Open in Current Window',
			'Not Now'
		);

		if (openChoice === 'Open in New Window') {
			vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectPath), true);
		} else if (openChoice === 'Open in Current Window') {
			vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectPath), false);
		}
	}

	/**
	 * Analyze existing project structure
	 */
	async analyzeProject(projectPath: string): Promise<any> {
		if (!fs.existsSync(projectPath)) {
			throw new Error('Project path does not exist');
		}

		const analysis = {
			name: path.basename(projectPath),
			type: 'unknown',
			technologies: [] as string[],
			structure: {},
			dependencies: [] as string[],
			hasPackageJson: false,
			hasGitRepo: false,
			framework: 'unknown',
		};

		// Check for package.json
		const packageJsonPath = path.join(projectPath, 'package.json');
		if (fs.existsSync(packageJsonPath)) {
			analysis.hasPackageJson = true;
			try {
				const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
				analysis.dependencies = Object.keys({
					...packageJson.dependencies,
					...packageJson.devDependencies,
				});

				// Detect framework
				analysis.framework = this.detectFramework(analysis.dependencies);
				analysis.technologies = this.detectTechnologies(analysis.dependencies);
			} catch (error) {
				this.logger.error('Error parsing package.json:', error);
			}
		}

		// Check for git repository
		analysis.hasGitRepo = fs.existsSync(path.join(projectPath, '.git'));

		// Analyze directory structure
		analysis.structure = await this.analyzeProjectStructure(projectPath);

		return analysis;
	}

	/**
	 * Get project recommendations based on analysis
	 */
	getProjectRecommendations(analysis: any): string[] {
		const recommendations: string[] = [];

		if (!analysis.hasGitRepo) {
			recommendations.push('Initialize Git repository');
		}

		if (!analysis.hasPackageJson && analysis.technologies.length === 0) {
			recommendations.push('Add package.json for dependency management');
		}

		if (analysis.framework === 'unknown' && analysis.technologies.includes('javascript')) {
			recommendations.push('Consider using a framework like React, Vue, or Angular');
		}

		if (
			!analysis.dependencies.includes('typescript') &&
			analysis.technologies.includes('javascript')
		) {
			recommendations.push('Consider adding TypeScript for better type safety');
		}

		if (!analysis.dependencies.includes('eslint')) {
			recommendations.push('Add ESLint for code quality');
		}

		if (!analysis.dependencies.includes('prettier')) {
			recommendations.push('Add Prettier for code formatting');
		}

		return recommendations;
	}

	/**
	 * Add feature to existing project
	 */
	async addFeature(projectPath: string, featureName: string): Promise<void> {
		const featureTemplates = this.getFeatureTemplates();
		const feature = featureTemplates.get(featureName);

		if (!feature) {
			throw new Error(`Feature ${featureName} not found`);
		}
		// Add feature files
		if (feature.files) {
			for (const file of feature.files) {
				const filePath = path.join(projectPath, file.path);
				const dir = path.dirname(filePath);

				if (!fs.existsSync(dir)) {
					fs.mkdirSync(dir, { recursive: true });
				}

				fs.writeFileSync(filePath, file.content);
			}
		}
		// Update package.json with feature dependencies
		const packageJsonPath = path.join(projectPath, 'package.json');
		if (fs.existsSync(packageJsonPath)) {
			const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

			if (feature.dependencies) {
				Object.assign(packageJson.dependencies || {}, feature.dependencies);
			}
			if (feature.devDependencies) {
				Object.assign(packageJson.devDependencies || {}, feature.devDependencies);
			}
			if (feature.scripts) {
				Object.assign(packageJson.scripts || {}, feature.scripts);
			}

			fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
		}

		vscode.window.showInformationMessage(`Feature ${featureName} added successfully!`);
	}

	/**
	 * Initialize default project templates
	 */
	private initializeTemplates(): void {
		// React + TypeScript Template
		this.templates.set('react-typescript', {
			id: 'react-typescript',
			name: 'React + TypeScript',
			description: 'Modern React application with TypeScript',
			type: 'frontend',
			technologies: ['react', 'typescript', 'webpack', 'babel'],
			features: ['typescript', 'eslint', 'prettier', 'testing'],
			files: [
				{
					path: 'src/App.tsx',
					content: this.getReactAppTemplate(),
				},
				{
					path: 'src/index.tsx',
					content: this.getReactIndexTemplate(),
				},
				{
					path: 'public/index.html',
					content: this.getHtmlTemplate(),
				},
				{
					path: 'tsconfig.json',
					content: this.getTsConfigTemplate(),
				},
				{
					path: '.eslintrc.js',
					content: this.getEslintConfigTemplate(),
				},
			],
			dependencies: {
				react: '^18.2.0',
				'react-dom': '^18.2.0',
			},
			devDependencies: {
				'@types/react': '^18.2.0',
				'@types/react-dom': '^18.2.0',
				typescript: '^5.0.0',
				'@vitejs/plugin-react': '^4.0.0',
				vite: '^4.0.0',
			},
			scripts: {
				dev: 'vite',
				build: 'vite build',
				preview: 'vite preview',
			},
			configuration: {
				'vite.config.ts': this.getViteConfigTemplate(),
			},
		});

		// Next.js Template
		this.templates.set('nextjs-typescript', {
			id: 'nextjs-typescript',
			name: 'Next.js + TypeScript',
			description: 'Full-stack React framework with TypeScript',
			type: 'fullstack',
			technologies: ['nextjs', 'react', 'typescript'],
			features: ['ssr', 'api-routes', 'typescript'],
			files: [
				{
					path: 'app/page.tsx',
					content: this.getNextjsPageTemplate(),
				},
				{
					path: 'app/layout.tsx',
					content: this.getNextjsLayoutTemplate(),
				},
			],
			dependencies: {
				next: '^14.0.0',
				react: '^18.2.0',
				'react-dom': '^18.2.0',
			},
			devDependencies: {
				'@types/node': '^20.0.0',
				'@types/react': '^18.2.0',
				'@types/react-dom': '^18.2.0',
				typescript: '^5.0.0',
			},
			scripts: {
				dev: 'next dev',
				build: 'next build',
				start: 'next start',
			},
			configuration: {},
		});

		// Express + TypeScript API Template
		this.templates.set('express-typescript', {
			id: 'express-typescript',
			name: 'Express API + TypeScript',
			description: 'RESTful API with Express and TypeScript',
			type: 'backend',
			technologies: ['express', 'typescript', 'node'],
			features: ['rest-api', 'typescript', 'middleware'],
			files: [
				{
					path: 'src/app.ts',
					content: this.getExpressAppTemplate(),
				},
				{
					path: 'src/routes/index.ts',
					content: this.getExpressRoutesTemplate(),
				},
			],
			dependencies: {
				express: '^4.18.0',
				cors: '^2.8.5',
			},
			devDependencies: {
				'@types/express': '^4.17.0',
				'@types/cors': '^2.8.0',
				'@types/node': '^20.0.0',
				typescript: '^5.0.0',
				'ts-node': '^10.9.0',
				nodemon: '^3.0.0',
			},
			scripts: {
				dev: 'nodemon src/app.ts',
				build: 'tsc',
				start: 'node dist/app.js',
			},
			configuration: {},
		});
	}

	/**
	 * Get feature templates for adding to existing projects
	 */
	private getFeatureTemplates(): Map<string, Partial<ProjectTemplate>> {
		const features = new Map();

		features.set('tailwind', {
			name: 'Tailwind CSS',
			files: [
				{
					path: 'tailwind.config.js',
					content: this.getTailwindConfigTemplate(),
				},
			],
			dependencies: {},
			devDependencies: {
				tailwindcss: '^3.3.0',
				autoprefixer: '^10.4.0',
				postcss: '^8.4.0',
			},
			scripts: {},
		});

		return features;
	}

	/**
	 * Create project files from template
	 */
	private async createProjectFiles(
		template: ProjectTemplate,
		projectPath: string,
		config: ProjectConfig
	): Promise<void> {
		for (const file of template.files) {
			const filePath = path.join(projectPath, file.path);
			const dir = path.dirname(filePath);

			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}

			// Process template variables
			let content = file.content;
			if (file.template) {
				content = this.processTemplate(content, config);
			}

			fs.writeFileSync(filePath, content);
		}
	}

	/**
	 * Create package.json for project
	 */
	private async createPackageJson(
		template: ProjectTemplate,
		projectPath: string,
		config: ProjectConfig
	): Promise<void> {
		const packageJson = {
			name: config.name.toLowerCase().replace(/\s+/g, '-'),
			version: '1.0.0',
			description: `${config.name} - Generated by AIDE`,
			scripts: template.scripts,
			dependencies: template.dependencies,
			devDependencies: template.devDependencies,
		};

		const packageJsonPath = path.join(projectPath, 'package.json');
		fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
	}

	/**
	 * Create configuration files
	 */
	private async createConfigurationFiles(
		template: ProjectTemplate,
		projectPath: string,
		config: ProjectConfig
	): Promise<void> {
		for (const [filename, content] of Object.entries(template.configuration)) {
			const filePath = path.join(projectPath, filename);
			fs.writeFileSync(filePath, content);
		}
	}

	/**
	 * Analyze project directory structure
	 */
	private async analyzeProjectStructure(projectPath: string): Promise<any> {
		const structure: any = {};

		try {
			const items = fs.readdirSync(projectPath);
			for (const item of items) {
				const itemPath = path.join(projectPath, item);
				const stat = fs.statSync(itemPath);

				if (stat.isDirectory()) {
					structure[item] = { type: 'directory', children: {} };
				} else {
					structure[item] = { type: 'file', size: stat.size };
				}
			}
		} catch (error) {
			this.logger.error('Error analyzing project structure:', error);
		}

		return structure;
	}

	/**
	 * Detect framework from dependencies
	 */
	private detectFramework(dependencies: string[]): string {
		if (dependencies.includes('next')) return 'nextjs';
		if (dependencies.includes('react')) return 'react';
		if (dependencies.includes('vue')) return 'vue';
		if (dependencies.includes('angular')) return 'angular';
		if (dependencies.includes('express')) return 'express';
		if (dependencies.includes('fastify')) return 'fastify';
		return 'unknown';
	}

	/**
	 * Detect technologies from dependencies
	 */
	private detectTechnologies(dependencies: string[]): string[] {
		const technologies: string[] = [];

		if (dependencies.some(dep => dep.includes('typescript'))) technologies.push('typescript');
		if (dependencies.includes('react')) technologies.push('react');
		if (dependencies.includes('vue')) technologies.push('vue');
		if (dependencies.includes('express')) technologies.push('express');
		if (dependencies.includes('tailwindcss')) technologies.push('tailwind');
		if (dependencies.includes('eslint')) technologies.push('eslint');
		if (dependencies.includes('prettier')) technologies.push('prettier');

		return technologies;
	}

	/**
	 * Process template variables
	 */
	private processTemplate(content: string, config: ProjectConfig): string {
		return content
			.replace(/{{PROJECT_NAME}}/g, config.name)
			.replace(/{{PROJECT_TYPE}}/g, config.type)
			.replace(/{{TEMPLATE}}/g, config.template);
	}

	// Template content methods
	private getReactAppTemplate(): string {
		return `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to {{PROJECT_NAME}}</h1>
        <p>Generated by AIDE</p>
      </header>
    </div>
  );
}

export default App;`;
	}

	private getReactIndexTemplate(): string {
		return `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
	}

	private getHtmlTemplate(): string {
		return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{PROJECT_NAME}}</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;
	}

	private getTsConfigTemplate(): string {
		return JSON.stringify(
			{
				compilerOptions: {
					target: 'ES2020',
					useDefineForClassFields: true,
					lib: ['ES2020', 'DOM', 'DOM.Iterable'],
					module: 'ESNext',
					skipLibCheck: true,
					moduleResolution: 'bundler',
					allowImportingTsExtensions: true,
					resolveJsonModule: true,
					isolatedModules: true,
					noEmit: true,
					jsx: 'react-jsx',
					strict: true,
					noUnusedLocals: true,
					noUnusedParameters: true,
					noFallthroughCasesInSwitch: true,
				},
				include: ['src'],
				references: [{ path: './tsconfig.node.json' }],
			},
			null,
			2
		);
	}

	private getEslintConfigTemplate(): string {
		return `module.exports = {
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': 'warn',
  },
}`;
	}

	private getViteConfigTemplate(): string {
		return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`;
	}

	private getNextjsPageTemplate(): string {
		return `export default function Home() {
  return (
    <main>
      <h1>Welcome to {{PROJECT_NAME}}</h1>
      <p>Generated by AIDE</p>
    </main>
  )
}`;
	}

	private getNextjsLayoutTemplate(): string {
		return `export const metadata = {
  title: '{{PROJECT_NAME}}',
  description: 'Generated by AIDE',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`;
	}

	private getExpressAppTemplate(): string {
		return `import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api', routes);

app.listen(port, () => {
  console.log(\`{{PROJECT_NAME}} API server running on port \${port}\`);
});`;
	}

	private getExpressRoutesTemplate(): string {
		return `import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Welcome to {{PROJECT_NAME}} API' });
});

export default router;`;
	}

	private getTailwindConfigTemplate(): string {
		return `module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}`;
	}
}
