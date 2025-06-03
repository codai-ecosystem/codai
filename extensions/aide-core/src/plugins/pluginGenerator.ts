import * as vscode from 'vscode';
import * as path from 'path';
import { PluginManager, PluginManifest } from './pluginManager';

export interface PluginTemplate {
	id: string;
	name: string;
	description: string;
	type: 'agent' | 'command' | 'view' | 'template';
	files: Record<string, string>;
}

export class PluginGenerator {
	private templates: Map<string, PluginTemplate> = new Map();

	constructor() {
		this.initializeDefaultTemplates();
	}

	private initializeDefaultTemplates(): void {
		// Agent Plugin Template
		this.templates.set('agent', {
			id: 'agent',
			name: 'Agent Plugin',
			description: 'Creates a new AI agent plugin',
			type: 'agent',
			files: {
				'package.json': this.generateAgentPackageJson(),
				'src/index.ts': this.generateAgentIndex(),
				'src/myAgent.ts': this.generateAgentClass(),
				'README.md': this.generateAgentReadme(),
				'tsconfig.json': this.generateTsConfig()
			}
		});

		// Command Plugin Template
		this.templates.set('command', {
			id: 'command',
			name: 'Command Plugin',
			description: 'Creates a new command plugin',
			type: 'command',
			files: {
				'package.json': this.generateCommandPackageJson(),
				'src/index.ts': this.generateCommandIndex(),
				'src/commands.ts': this.generateCommandsClass(),
				'README.md': this.generateCommandReadme(),
				'tsconfig.json': this.generateTsConfig()
			}
		});

		// View Plugin Template
		this.templates.set('view', {
			id: 'view',
			name: 'View Plugin',
			description: 'Creates a new view/UI plugin',
			type: 'view',
			files: {
				'package.json': this.generateViewPackageJson(),
				'src/index.ts': this.generateViewIndex(),
				'src/viewProvider.ts': this.generateViewProvider(),
				'media/main.css': this.generateViewCSS(),
				'media/main.js': this.generateViewJS(),
				'README.md': this.generateViewReadme(),
				'tsconfig.json': this.generateTsConfig()
			}
		});

		// Template Plugin Template
		this.templates.set('template', {
			id: 'template',
			name: 'Project Template Plugin',
			description: 'Creates a new project template plugin',
			type: 'template',
			files: {
				'package.json': this.generateTemplatePackageJson(),
				'src/index.ts': this.generateTemplateIndex(),
				'src/templates.ts': this.generateTemplatesClass(),
				'templates/basic/package.json': this.generateBasicTemplate(),
				'README.md': this.generateTemplateReadme(),
				'tsconfig.json': this.generateTsConfig()
			}
		});
	}

	async generatePlugin(
		templateId: string,
		pluginName: string,
		pluginId: string,
		author: string,
		description: string,
		outputPath: string
	): Promise<boolean> {
		try {
			const template = this.templates.get(templateId);
			if (!template) {
				vscode.window.showErrorMessage(`Template not found: ${templateId}`);
				return false;
			}

			const pluginPath = path.join(outputPath, pluginId);

			// Create plugin directory
			await vscode.workspace.fs.createDirectory(vscode.Uri.file(pluginPath));

			// Create all files from template
			for (const [relativePath, content] of Object.entries(template.files)) {
				const filePath = path.join(pluginPath, relativePath);
				const dirPath = path.dirname(filePath);

				// Create directory if it doesn't exist
				await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));

				// Replace placeholders in content
				const processedContent = this.replacePlaceholders(content, {
					pluginName,
					pluginId,
					author,
					description
				});

				// Write file
				await vscode.workspace.fs.writeFile(
					vscode.Uri.file(filePath),
					Buffer.from(processedContent)
				);
			}

			vscode.window.showInformationMessage(`Plugin "${pluginName}" generated successfully at ${pluginPath}`);
			return true;
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to generate plugin: ${error}`);
			return false;
		}
	}

	getAvailableTemplates(): PluginTemplate[] {
		return Array.from(this.templates.values());
	}

	private replacePlaceholders(content: string, placeholders: Record<string, string>): string {
		let result = content;
		for (const [key, value] of Object.entries(placeholders)) {
			const regex = new RegExp(`{{${key}}}`, 'g');
			result = result.replace(regex, value);
		}
		return result;
	}

	// Template generation methods
	private generateAgentPackageJson(): string {
		return `{
	"name": "{{pluginId}}",
	"displayName": "{{pluginName}}",
	"description": "{{description}}",
	"version": "1.0.0",
	"author": "{{author}}",
	"main": "./out/index.js",
	"engines": {
		"aide": "^1.0.0"
	},
	"activationEvents": [
		"*"
	],
	"contributes": {
		"agents": [
			{
				"id": "MyAgent",
				"name": "{{pluginName}} Agent",
				"description": "{{description}}",
				"capabilities": ["analyze", "generate", "assist"],
				"priority": 1
			}
		]
	},
	"scripts": {
		"vscode:prepublish": "npm run compile",
		"compile": "tsc -p ./",
		"watch": "tsc -watch -p ./"
	},
	"devDependencies": {
		"@types/vscode": "^1.85.0",
		"@types/node": "^20.x",
		"typescript": "^5.3.0"
	}
}`;
	}

	private generateAgentIndex(): string {
		return `import * as vscode from 'vscode';
import { MyAgent } from './myAgent';

export function activate(context: vscode.ExtensionContext) {
	console.log('{{pluginName}} plugin activated');
}

export function deactivate() {
	console.log('{{pluginName}} plugin deactivated');
}

// Export the agent class for AIDE to use
export { MyAgent };`;
	}

	private generateAgentClass(): string {
		return `import { BaseAgent } from 'aide-core/agents/baseAgent';
import { MemoryGraph } from 'aide-core/memory/memoryGraph';
import { AgentResponse, AgentAction } from 'aide-core/agents/agentManager';

export class MyAgent extends BaseAgent {
	constructor(memoryGraph: MemoryGraph) {
		super(memoryGraph, '{{pluginId}}');
	}

	async process(message: string, intentId: string): Promise<AgentResponse> {
		// Add your agent logic here
		const response = \`Hello from {{pluginName}}! Processing: \${message}\`;

		// Add to memory
		this.memoryGraph.addNode('logic', \`{{pluginName}} processed: \${message}\`, {
			agent: '{{pluginId}}',
			timestamp: new Date().toISOString()
		});

		return {
			agent: '{{pluginId}}',
			message: response,
			actions: [],
			metadata: {
				processed: true
			}
		};
	}

	getCapabilities(): string[] {
		return ['analyze', 'generate', 'assist'];
	}
}`;
	}

	private generateAgentReadme(): string {
		return `# {{pluginName}}

{{description}}

## Features

- Custom AI agent functionality
- Integration with AIDE memory system
- Extensible architecture

## Installation

1. Copy this plugin to your AIDE plugins directory
2. Restart AIDE or reload the window
3. The plugin will be automatically loaded

## Usage

This agent will be available in the AIDE conversational interface and can be invoked automatically based on user queries.

## Development

\`\`\`bash
npm install
npm run compile
\`\`\`

## Author

{{author}}`;
	}

	private generateCommandPackageJson(): string {
		return `{
	"name": "{{pluginId}}",
	"displayName": "{{pluginName}}",
	"description": "{{description}}",
	"version": "1.0.0",
	"author": "{{author}}",
	"main": "./out/index.js",
	"engines": {
		"aide": "^1.0.0"
	},
	"activationEvents": [
		"onCommand:{{pluginId}}.executeCommand"
	],
	"contributes": {
		"commands": [
			{
				"command": "{{pluginId}}.executeCommand",
				"title": "Execute {{pluginName}} Command",
				"category": "{{pluginName}}"
			}
		]
	},
	"scripts": {
		"vscode:prepublish": "npm run compile",
		"compile": "tsc -p ./",
		"watch": "tsc -watch -p ./"
	},
	"devDependencies": {
		"@types/vscode": "^1.85.0",
		"@types/node": "^20.x",
		"typescript": "^5.3.0"
	}
}`;
	}

	private generateCommandIndex(): string {
		return `import * as vscode from 'vscode';
import { Commands } from './commands';

export function activate(context: vscode.ExtensionContext) {
	const commands = new Commands();

	const disposable = vscode.commands.registerCommand('{{pluginId}}.executeCommand', () => {
		commands.execute();
	});

	context.subscriptions.push(disposable);
	console.log('{{pluginName}} plugin activated');
}

export function deactivate() {
	console.log('{{pluginName}} plugin deactivated');
}`;
	}

	private generateCommandsClass(): string {
		return `import * as vscode from 'vscode';

export class Commands {
	execute(): void {
		vscode.window.showInformationMessage('{{pluginName}} command executed!');

		// Add your command logic here
		this.performAction();
	}

	private performAction(): void {
		// Implement your custom functionality here
		console.log('Performing {{pluginName}} action...');
	}
}`;
	}

	private generateCommandReadme(): string {
		return `# {{pluginName}}

{{description}}

## Features

- Custom commands for AIDE
- Integration with VS Code command palette
- Extensible functionality

## Commands

- \`{{pluginName}}: Execute {{pluginName}} Command\` - Main command functionality

## Installation

1. Copy this plugin to your AIDE plugins directory
2. Restart AIDE or reload the window
3. Access commands via the command palette (Ctrl+Shift+P)

## Author

{{author}}`;
	}

	private generateViewPackageJson(): string {
		return `{
	"name": "{{pluginId}}",
	"displayName": "{{pluginName}}",
	"description": "{{description}}",
	"version": "1.0.0",
	"author": "{{author}}",
	"main": "./out/index.js",
	"engines": {
		"aide": "^1.0.0"
	},
	"activationEvents": [
		"*"
	],
	"contributes": {
		"views": [
			{
				"id": "{{pluginId}}.view",
				"name": "{{pluginName}}",
				"type": "webview",
				"when": "aide.active"
			}
		]
	},
	"scripts": {
		"vscode:prepublish": "npm run compile",
		"compile": "tsc -p ./",
		"watch": "tsc -watch -p ./"
	},
	"devDependencies": {
		"@types/vscode": "^1.85.0",
		"@types/node": "^20.x",
		"typescript": "^5.3.0"
	}
}`;
	}

	private generateViewIndex(): string {
		return `import * as vscode from 'vscode';
import { ViewProvider } from './viewProvider';

export function activate(context: vscode.ExtensionContext) {
	const provider = new ViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('{{pluginId}}.view', provider)
	);

	console.log('{{pluginName}} view plugin activated');
}

export function deactivate() {
	console.log('{{pluginName}} view plugin deactivated');
}`;
	}

	private generateViewProvider(): string {
		return `import * as vscode from 'vscode';

export class ViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = '{{pluginId}}.view';

	constructor(private readonly _extensionUri: vscode.Uri) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'action':
						vscode.window.showInformationMessage(\`{{pluginName}} action: \${message.text}\`);
						return;
				}
			},
			undefined,
			[]
		);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

		return \`<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="\${styleResetUri}" rel="stylesheet">
				<title>{{pluginName}}</title>
			</head>
			<body>
				<h1>{{pluginName}}</h1>
				<p>{{description}}</p>
				<button id="actionButton">Execute Action</button>
				<script src="\${scriptUri}"></script>
			</body>
			</html>\`;
	}
}`;
	}

	private generateViewCSS(): string {
		return `body {
	font-family: var(--vscode-font-family);
	font-size: var(--vscode-font-size);
	color: var(--vscode-foreground);
	background-color: var(--vscode-editor-background);
	padding: 16px;
}

h1 {
	color: var(--vscode-textLink-foreground);
	margin-bottom: 16px;
}

button {
	background-color: var(--vscode-button-background);
	color: var(--vscode-button-foreground);
	border: none;
	padding: 8px 16px;
	border-radius: 4px;
	cursor: pointer;
}

button:hover {
	background-color: var(--vscode-button-hoverBackground);
}`;
	}

	private generateViewJS(): string {
		return `(function() {
	const vscode = acquireVsCodeApi();

	document.getElementById('actionButton').addEventListener('click', () => {
		vscode.postMessage({
			command: 'action',
			text: 'Button clicked!'
		});
	});
})();`;
	}

	private generateViewReadme(): string {
		return `# {{pluginName}}

{{description}}

## Features

- Custom webview interface
- Integration with AIDE UI
- Interactive components

## Installation

1. Copy this plugin to your AIDE plugins directory
2. Restart AIDE or reload the window
3. The view will appear in the AIDE sidebar

## Author

{{author}}`;
	}

	private generateTemplatePackageJson(): string {
		return `{
	"name": "{{pluginId}}",
	"displayName": "{{pluginName}}",
	"description": "{{description}}",
	"version": "1.0.0",
	"author": "{{author}}",
	"main": "./out/index.js",
	"engines": {
		"aide": "^1.0.0"
	},
	"activationEvents": [
		"*"
	],
	"contributes": {
		"templates": [
			{
				"id": "{{pluginId}}.basic",
				"name": "{{pluginName}} Basic Template",
				"description": "Basic project template from {{pluginName}}",
				"projectType": "basic"
			}
		]
	},
	"scripts": {
		"vscode:prepublish": "npm run compile",
		"compile": "tsc -p ./",
		"watch": "tsc -watch -p ./"
	},
	"devDependencies": {
		"@types/vscode": "^1.85.0",
		"@types/node": "^20.x",
		"typescript": "^5.3.0"
	}
}`;
	}

	private generateTemplateIndex(): string {
		return `import * as vscode from 'vscode';
import { Templates } from './templates';

export function activate(context: vscode.ExtensionContext) {
	const templates = new Templates();
	console.log('{{pluginName}} template plugin activated');
}

export function deactivate() {
	console.log('{{pluginName}} template plugin deactivated');
}

// Export templates for AIDE to use
export { Templates };`;
	}

	private generateTemplatesClass(): string {
		return `export class Templates {
	getTemplates() {
		return {
			'{{pluginId}}.basic': {
				name: '{{pluginName}} Basic Template',
				description: 'Basic project template from {{pluginName}}',
				files: {
					'package.json': this.getBasicPackageJson(),
					'src/index.ts': this.getBasicIndex(),
					'README.md': this.getBasicReadme()
				}
			}
		};
	}

	private getBasicPackageJson(): string {
		return JSON.stringify({
			name: 'my-project',
			version: '1.0.0',
			description: 'Project created with {{pluginName}}',
			main: 'src/index.js',
			scripts: {
				start: 'node src/index.js',
				build: 'tsc',
				dev: 'tsx watch src/index.ts'
			},
			devDependencies: {
				typescript: '^5.0.0',
				'@types/node': '^20.0.0'
			}
		}, null, 2);
	}

	private getBasicIndex(): string {
		return \`console.log('Hello from {{pluginName}} template!');\`;
	}

	private getBasicReadme(): string {
		return \`# My Project

Created with {{pluginName}} template.

## Getting Started

\\\`\\\`\\\`bash
npm install
npm run dev
\\\`\\\`\\\`
\`;
	}
}`;
	}

	private generateBasicTemplate(): string {
		return `{
	"name": "basic-template",
	"version": "1.0.0",
	"description": "Basic template from {{pluginName}}",
	"main": "index.js",
	"scripts": {
		"start": "node index.js"
	}
}`;
	}

	private generateTemplateReadme(): string {
		return `# {{pluginName}}

{{description}}

## Features

- Custom project templates
- Integration with AIDE project creation
- Reusable template patterns

## Templates

- \`{{pluginName}} Basic Template\` - Basic project structure

## Installation

1. Copy this plugin to your AIDE plugins directory
2. Restart AIDE or reload the window
3. Templates will be available in project creation flow

## Author

{{author}}`;
	}

	private generateTsConfig(): string {
		return `{
	"compilerOptions": {
		"module": "commonjs",
		"target": "ES2020",
		"outDir": "out",
		"lib": [
			"ES2020"
		],
		"sourceMap": true,
		"rootDir": "src",
		"strict": true
	},
	"exclude": [
		"node_modules",
		".vscode-test"
	]
}`;
	}
}
