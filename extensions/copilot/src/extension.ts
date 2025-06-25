import * as vscode from 'vscode';
import { ConversationPanel } from './panels/ConversationPanel';
import { SettingsPanel } from './panels/SettingsPanel';

// Optional imports - will be loaded when packages are available
let MemoryGraphEngine: any;
let AgentRuntime: any;
let MemoryGraphPanel: any;
let PreviewPanel: any;
let TimelinePanel: any;

// Try to load optional dependencies
try {
	const memoryGraphModule = require('@codai/memory-graph');
	MemoryGraphEngine = memoryGraphModule.MemoryGraphEngine;
} catch (error) {
	console.log('Memory graph package not available yet');
}

try {
	const agentRuntimeModule = require('@codai/agent-runtime');
	AgentRuntime = agentRuntimeModule.AgentRuntime;
} catch (error) {
	console.log('Agent runtime package not available yet');
}

try {
	MemoryGraphPanel = require('./panels/MemoryGraphPanel').MemoryGraphPanel;
} catch (error) {
	console.log('MemoryGraphPanel not available yet');
}

try {
	PreviewPanel = require('./panels/PreviewPanel').PreviewPanel;
} catch (error) {
	console.log('PreviewPanel not available yet');
}

try {
	TimelinePanel = require('./panels/TimelinePanel').TimelinePanel;
} catch (error) {
	console.log('TimelinePanel not available yet');
}

/**
 * AIDE VS Code Extension Entry Point
 * Integrates AIDE's conversational interface with VS Code
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('AIDE extension is now active!');
	// Initialize AIDE core systems if available
	let memoryGraph: any;
	let agentRuntime: any;

	if (MemoryGraphEngine) {
		memoryGraph = new MemoryGraphEngine();
	}

	if (AgentRuntime && memoryGraph) {
		agentRuntime = new AgentRuntime(memoryGraph);
	}

	// Initialize panels
	const conversationPanel = new ConversationPanel(context, memoryGraph, agentRuntime);
	let memoryGraphPanel: any;
	let previewPanel: any;
	let timelinePanel: any;
	let settingsPanel: any;

	if (MemoryGraphPanel && memoryGraph) {
		memoryGraphPanel = new MemoryGraphPanel(context, memoryGraph);
	}

	if (PreviewPanel) {
		previewPanel = new PreviewPanel(context);
	}

	if (TimelinePanel) {
		timelinePanel = new TimelinePanel(context);
	}

	// Initialize settings panel
	settingsPanel = new SettingsPanel(context, agentRuntime, memoryGraph);

	// Register webview providers
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(SettingsPanel.viewType, settingsPanel)
	);

	// Register commands
	const commands = [
		vscode.commands.registerCommand('aide.openConversation', () => {
			conversationPanel.show();
		}),

		vscode.commands.registerCommand('aide.openSettings', () => {
			vscode.commands.executeCommand('workbench.view.extension.aide-settings-view');
		}),

		vscode.commands.registerCommand('aide.newProject', async () => {
			const projectName = await vscode.window.showInputBox({
				prompt: 'Enter project name',
				placeHolder: 'my-awesome-app',
			});
			if (projectName && agentRuntime) {
				try {
					await agentRuntime.executeTask({
						id: generateId(),
						title: 'Create New Project',
						description: `Create a new project called "${projectName}"`,
						agentId: 'planner',
						status: 'pending',
						priority: 'high',
						inputs: { projectName },
						createdAt: new Date(),
						progress: 0,
					});
				} catch (error: any) {
					vscode.window.showErrorMessage(`Failed to create project: ${error.message}`);
				}
			} else if (!agentRuntime) {
				vscode.window.showErrorMessage(
					'Agent runtime not available. Please check AIDE installation.'
				);
			}
		}),

		vscode.commands.registerCommand('aide.toggleMemoryGraph', () => {
			if (memoryGraphPanel) {
				memoryGraphPanel.show();
			} else {
				vscode.window.showErrorMessage('Memory graph panel not available.');
			}
		}),

		vscode.commands.registerCommand('aide.showPreview', () => {
			if (previewPanel) {
				previewPanel.show();
			} else {
				vscode.window.showErrorMessage('Preview panel not available.');
			}
		}),

		vscode.commands.registerCommand('aide.showTimeline', () => {
			if (timelinePanel) {
				timelinePanel.show();
			} else {
				vscode.window.showErrorMessage('Timeline panel not available.');
			}
		}),
	];

	// Add all disposables to context
	context.subscriptions.push(...commands);

	// Initialize agent runtime if available
	if (agentRuntime) {
		agentRuntime.initialize().catch((error: any) => {
			vscode.window.showErrorMessage(`Failed to initialize AIDE: ${error.message}`);
		});
	}

	// Set up configuration change handling
	vscode.workspace.onDidChangeConfiguration(event => {
		if (event.affectsConfiguration('aide')) {
			handleConfigurationChange();
		}
	});
	// Set up auto-save for memory graph if available
	if (memoryGraph) {
		const autoSave = vscode.workspace.getConfiguration('aide').get<boolean>('autoSave', true);
		if (autoSave && memoryGraph.changes$) {
			memoryGraph.changes$.subscribe(() => {
				// Auto-save memory graph changes
				saveMemoryGraph(memoryGraph);
			});
		}
	}

	return {
		memoryGraph,
		agentRuntime,
		conversationPanel,
		memoryGraphPanel,
		previewPanel,
		timelinePanel,
		settingsPanel,
	};
}

export function deactivate() {
	console.log('AIDE extension is being deactivated');
}

// Helper functions
function generateId(): string {
	return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

async function handleConfigurationChange() {
	const config = vscode.workspace.getConfiguration('aide');

	// Handle AI provider configuration changes
	const openaiKey = config.get<string>('aiProvider.openai.apiKey');
	const anthropicKey = config.get<string>('aiProvider.anthropic.apiKey');
	const azureEndpoint = config.get<string>('aiProvider.azure.endpoint');
	const azureKey = config.get<string>('aiProvider.azure.apiKey');

	// Validate API keys (without exposing them in logs)
	if (openaiKey && !isValidApiKey(openaiKey)) {
		vscode.window.showWarningMessage('Invalid OpenAI API key format');
	}

	if (anthropicKey && !isValidApiKey(anthropicKey)) {
		vscode.window.showWarningMessage('Invalid Anthropic API key format');
	}
}

function isValidApiKey(key: string): boolean {
	// Basic API key format validation
	return key.length > 10 && /^[a-zA-Z0-9\-_]+$/.test(key);
}

async function saveMemoryGraph(memoryGraph: any) {
	try {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder || !memoryGraph.toJSON) return;

		const graphData = memoryGraph.toJSON();
		const aideDirPath = vscode.Uri.file(workspaceFolder.uri.fsPath + '/.aide');
		const graphPath = vscode.Uri.file(workspaceFolder.uri.fsPath + '/.aide/memory-graph.json');

		// Simple file writing for compatibility
		const fs = require('fs');
		const path = require('path');

		// Ensure .aide directory exists
		if (!fs.existsSync(aideDirPath.fsPath)) {
			fs.mkdirSync(aideDirPath.fsPath, { recursive: true });
		}

		// Write the file
		fs.writeFileSync(graphPath.fsPath, JSON.stringify(graphData, null, 2));
	} catch (error) {
		console.error('Failed to save memory graph:', error);
	}
}
