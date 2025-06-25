/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { ConversationalInterface } from './ui/conversationalInterface';
import { MemoryVisualization } from './ui/memoryVisualization';
import { ProjectStatus } from './ui/projectStatus';
import { AgentManager } from './agents/agentManager';
import { VersionManager } from './services/versionManager';
import { LoggerService, createLogger } from './services/loggerService';
import { AIService } from './services/aiService';
import { ConversationManager } from './services/conversationManager';
import { SimpleMemoryGraph } from './services/simpleMemoryGraph';

const logger = createLogger('Extension');

export function activate(context: vscode.ExtensionContext) {
	logger.info('AIDE Core extension is now active!');

	// Initialize simple memory graph (avoiding React dependencies)
	const memoryGraph = new SimpleMemoryGraph();

	// Get API keys from configuration
	const config = vscode.workspace.getConfiguration('aide');
	const apiKeys = {
		openai: config.get<string>('openaiApiKey', ''),
		anthropic: config.get<string>('anthropicApiKey', ''),
		azure: config.get<string>('azureApiKey', ''),
	};

	// Initialize AI Service
	const aiService = new AIService(context);
	const agentManager = new AgentManager(memoryGraph, aiService);
	const conversationManager = new ConversationManager(agentManager, memoryGraph, aiService);
	const versionManager = new VersionManager();

	// Initialize UI components with our simple memory graph
	const conversationalInterface = new ConversationalInterface(agentManager, memoryGraph as any);
	const memoryVisualization = new MemoryVisualization(memoryGraph as any);
	const projectStatus = new ProjectStatus(memoryGraph as any, agentManager);
	// Register commands
	context.subscriptions.push(
		vscode.commands.registerCommand('aide.openConversation', () => {
			conversationalInterface.show(context);
		}),

		vscode.commands.registerCommand('aide.showMemoryGraph', () => {
			memoryVisualization.show(context);
		}),

		vscode.commands.registerCommand('aide.showProjectStatus', () => {
			projectStatus.show(context);
		}),

		vscode.commands.registerCommand('aide.planFeature', async () => {
			const feature = await vscode.window.showInputBox({
				prompt: 'Describe the feature you want to plan',
				placeHolder: 'e.g., Add user authentication system',
			});

			if (feature) {
				await agentManager.planFeature(feature);
			}
		}),

		vscode.commands.registerCommand('aide.buildProject', async () => {
			await agentManager.buildProject();
		}),

		vscode.commands.registerCommand('aide.deployProject', async () => {
			await agentManager.deployProject();
		}),

		vscode.commands.registerCommand('aide.createProject', async () => {
			await conversationalInterface.startProjectCreationFlow();
		}),
		vscode.commands.registerCommand('aide.showProjectPreview', async () => {
			await projectStatus.showLivePreview();
		}),

		// Enhanced conversation commands
		vscode.commands.registerCommand('aide.startConversation', async () => {
			const sessionId = await conversationManager.startSession('New Conversation');
			const message = await vscode.window.showInputBox({
				prompt: 'What would you like to do?',
				placeHolder: 'e.g., Create a new React component, Fix a bug, Deploy to Azure...',
			});
			if (message) {
				const response = await conversationManager.processMessage(message);
				vscode.window.showInformationMessage(response);
			}
		}),

		vscode.commands.registerCommand('aide.showConversationHistory', async () => {
			const sessions = conversationManager.getActiveSessions();
			if (sessions.length === 0) {
				vscode.window.showInformationMessage('No active conversation sessions');
				return;
			}

			const selectedSession = await vscode.window.showQuickPick(
				sessions.map(session => ({
					label: session.title,
					description: `Started: ${session.startTime.toLocaleString()}`,
					detail: `${session.context.length} messages`,
					session,
				})),
				{ placeHolder: 'Select a conversation session to view' }
			);

			if (selectedSession) {
				const history = selectedSession.session.context.join('\n\n');
				const doc = await vscode.workspace.openTextDocument({
					content: history,
					language: 'markdown',
				});
				await vscode.window.showTextDocument(doc);
			}
		}),

		// Plugin management commands
		vscode.commands.registerCommand('aide.createPlugin', async () => {
			const pluginType = await vscode.window.showQuickPick(
				[
					{ label: 'Agent Plugin', value: 'agent' },
					{ label: 'Command Plugin', value: 'command' },
					{ label: 'View Plugin', value: 'view' },
					{ label: 'Template Plugin', value: 'template' },
				],
				{
					placeHolder: 'Select the type of plugin to create',
				}
			);
			if (pluginType) {
				const pluginName = await vscode.window.showInputBox({
					prompt: 'Enter the plugin name',
					placeHolder: 'My Awesome Plugin',
				});

				if (pluginName) {
					const pluginId = await vscode.window.showInputBox({
						prompt: 'Enter the plugin ID (used for internal identification)',
						placeHolder: 'my-awesome-plugin',
						value: pluginName.toLowerCase().replace(/\s+/g, '-'),
					});

					const author = await vscode.window.showInputBox({
						prompt: 'Enter the author name',
						placeHolder: 'Your Name',
					});

					const description = await vscode.window.showInputBox({
						prompt: 'Enter a description for the plugin',
						placeHolder: 'A brief description of what this plugin does',
					});

					if (pluginId && author && description) {
						try {
							const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
							if (workspaceFolder) {
								const pluginPath = vscode.Uri.joinPath(
									workspaceFolder.uri,
									'.aide',
									'plugins',
									pluginId
								).fsPath;

								// TODO: Implement plugin generation when PluginGenerator is available
								// await pluginGenerator.generatePlugin(
								// 	pluginType.value,
								// 	pluginName,
								// 	pluginId,
								// 	author,
								// 	description,
								// 	pluginPath
								// );

								vscode.window.showInformationMessage(
									`Plugin "${pluginName}" would be created at ${pluginPath} (feature not yet implemented)`
								);

								// TODO: Reload plugins when PluginManager is available
								// await pluginManager.discoverAndLoadPlugins();
							} else {
								vscode.window.showErrorMessage(
									'No workspace folder found. Please open a workspace first.'
								);
							}
						} catch (error) {
							vscode.window.showErrorMessage(`Failed to create plugin: ${error}`);
						}
					}
				}
			}
		}),
		vscode.commands.registerCommand('aide.reloadPlugins', async () => {
			try {
				// TODO: Implement plugin reloading when PluginManager is available
				// const loadedPlugins = pluginManager.getLoadedPlugins();
				// for (const plugin of loadedPlugins) {
				// 	await pluginManager.unloadPlugin(plugin.id);
				// }
				// await pluginManager.discoverAndLoadPlugins();

				vscode.window.showInformationMessage('Plugin reload functionality not yet implemented');
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to reload plugins: ${error}`);
			}
		}),

		vscode.commands.registerCommand('aide.listPlugins', async () => {
			// TODO: Implement plugin listing when PluginManager is available
			// const loadedPlugins = pluginManager.getLoadedPlugins();			vscode.window.showInformationMessage('Plugin listing functionality not yet implemented');
			// TODO: Complete plugin listing implementation when PluginManager is available
			// if (loadedPlugins.length === 0) {
			// 	vscode.window.showInformationMessage('No plugins are currently loaded');
			// 	return;
			// }
			// const pluginItems = loadedPlugins.map(plugin => ({
			// 	label: plugin.name,
			// 	description: plugin.version,
			// 	detail: plugin.description
			// }));
			// await vscode.window.showQuickPick(pluginItems, {
			// 	placeHolder: 'Loaded AIDE Plugins'
			// });
		}),

		// Enhanced deployment commands
		vscode.commands.registerCommand('aide.setupDeployment', async () => {
			const { DeploymentService } = await import('./services/deploymentService');
			const deploymentService = new DeploymentService();

			const projectTypes = [
				{ label: 'Web Application', value: 'webapp' },
				{ label: 'API Server', value: 'api' },
				{ label: 'Static Site', value: 'static' },
				{ label: 'Full Stack', value: 'fullstack' },
			];

			const projectType = await vscode.window.showQuickPick(projectTypes, {
				placeHolder: 'What type of project are you deploying?',
			});

			if (projectType) {
				await deploymentService.setupDeploymentForProject(projectType.value);
			}
		}),

		vscode.commands.registerCommand('aide.deployWithCI', async () => {
			const { DeploymentService } = await import('./services/deploymentService');
			const deploymentService = new DeploymentService();

			const targets = deploymentService.getDeploymentTargets();
			if (targets.length === 0) {
				vscode.window.showErrorMessage(
					'No deployment targets configured. Please setup deployment first.'
				);
				return;
			}

			const targetItems = targets.map(target => ({
				label: target.name,
				description: target.type,
				detail: `Status: ${target.status}`,
				target,
			}));

			const selectedTarget = await vscode.window.showQuickPick(targetItems, {
				placeHolder: 'Select deployment target for CI/CD setup',
			});

			if (selectedTarget) {
				const ciOptions = [
					{ label: 'GitHub Actions', value: 'github-actions' },
					{ label: 'GitLab CI', value: 'gitlab-ci' },
					{ label: 'Azure DevOps', value: 'azure-devops' },
				];

				const ciProvider = await vscode.window.showQuickPick(ciOptions, {
					placeHolder: 'Select CI/CD provider',
				});

				if (ciProvider) {
					const dockerize = await vscode.window.showQuickPick(['Yes', 'No'], {
						placeHolder: 'Create Dockerfile for containerized deployment?',
					});

					const autoTrigger = await vscode.window.showQuickPick(['Yes', 'No'], {
						placeHolder: 'Automatically trigger deployment on push to main branch?',
					});
					await deploymentService.deployWithCI({
						target: selectedTarget.target.name,
						provider: ciProvider.value as any,
						environment: 'production',
						buildCommand: 'npm run build',
						testCommand: 'npm test',
					});
				}
			}
		}),

		vscode.commands.registerCommand('aide.viewDeploymentHistory', async () => {
			const { DeploymentService } = await import('./services/deploymentService');
			const deploymentService = new DeploymentService();

			const history = deploymentService.getDeploymentHistory();
			if (history.length === 0) {
				vscode.window.showInformationMessage('No deployment history found');
				return;
			}

			const historyItems = history.map(deployment => ({
				label: `${deployment.target} - ${deployment.status}`,
				description: deployment.id,
				detail: `${deployment.startTime.toLocaleString()} ${deployment.endTime ? '→ ' + deployment.endTime.toLocaleString() : '(In Progress)'}`,
				deployment,
			}));

			const selectedDeployment = await vscode.window.showQuickPick(historyItems, {
				placeHolder: 'Select deployment to view details',
			});

			if (selectedDeployment) {
				const logs = selectedDeployment.deployment.logs.join('\n');
				const document = await vscode.workspace.openTextDocument({
					content: `Deployment Details
Target: ${selectedDeployment.deployment.target}
Status: ${selectedDeployment.deployment.status}
Start Time: ${selectedDeployment.deployment.startTime}
End Time: ${selectedDeployment.deployment.endTime || 'In Progress'}
Commit Hash: ${selectedDeployment.deployment.commitHash || 'N/A'}
Version: ${selectedDeployment.deployment.version || 'N/A'}

Logs:
${logs}`,
					language: 'plaintext',
				});
				vscode.window.showTextDocument(document);
			}
		}),

		vscode.commands.registerCommand('aide.manageDeploymentTargets', async () => {
			const { DeploymentService } = await import('./services/deploymentService');
			const deploymentService = new DeploymentService();

			const actions = [
				{ label: 'Add New Target', action: 'add' },
				{ label: 'Remove Target', action: 'remove' },
				{ label: 'View All Targets', action: 'view' },
			];

			const selectedAction = await vscode.window.showQuickPick(actions, {
				placeHolder: 'What would you like to do with deployment targets?',
			});

			if (selectedAction) {
				switch (selectedAction.action) {
					case 'add': {
						await vscode.commands.executeCommand('aide.setupDeployment');
						break;
					}
					case 'remove': {
						const targets = deploymentService.getDeploymentTargets();
						if (targets.length === 0) {
							vscode.window.showInformationMessage('No deployment targets to remove');
							return;
						}

						const targetItems = targets.map(target => ({
							label: target.name,
							description: target.type,
							detail: `Status: ${target.status}`,
							target,
						}));

						const targetToRemove = await vscode.window.showQuickPick(targetItems, {
							placeHolder: 'Select target to remove',
						});

						if (targetToRemove) {
							const confirm = await vscode.window.showQuickPick(['Yes', 'No'], {
								placeHolder: `Are you sure you want to remove "${targetToRemove.target.name}"?`,
							});

							if (confirm === 'Yes') {
								await deploymentService.removeDeploymentTarget(targetToRemove.target.name);
							}
						}
						break;
					}
					case 'view': {
						const allTargets = deploymentService.getDeploymentTargets();
						if (allTargets.length === 0) {
							vscode.window.showInformationMessage('No deployment targets configured');
							return;
						}

						const viewItems = allTargets.map(target => ({
							label: target.name,
							description: target.type,
							detail: `Status: ${target.status} | Build: ${target.buildCommand || 'None'} | Output: ${target.outputDirectory || 'Default'}`,
						}));

						await vscode.window.showQuickPick(viewItems, {
							placeHolder: 'Deployment Targets Overview',
						});
						break;
					}
				}
			}
		}),
		vscode.commands.registerCommand('aide.setupMonitoring', async () => {
			const { DeploymentService } = await import('./services/deploymentService');
			const deploymentService = new DeploymentService();

			const targets = deploymentService.getDeploymentTargets();
			if (targets.length === 0) {
				vscode.window.showErrorMessage(
					'No deployment targets configured. Please setup deployment first.'
				);
				return;
			}

			const targetItems = targets.map(target => ({
				label: target.name,
				description: target.type,
				detail: `Status: ${target.status}`,
				target,
			}));

			const selectedTarget = await vscode.window.showQuickPick(targetItems, {
				placeHolder: 'Select deployment target to setup monitoring',
			});

			if (selectedTarget) {
				await deploymentService.setupDeploymentMonitoring(selectedTarget.target.name);
			}
		}),
		// Version Management Commands
		vscode.commands.registerCommand('aide.showVersionHistory', async () => {
			const history = versionManager.getVersionHistory();
			const panel = vscode.window.createWebviewPanel(
				'aideVersionHistory',
				'AIDE Version History',
				vscode.ViewColumn.One,
				{
					enableScripts: true,
					retainContextWhenHidden: true,
				}
			);

			panel.webview.html = generateVersionHistoryHTML(history);
		}),
		vscode.commands.registerCommand('aide.generateVersionBump', async () => {
			try {
				// Analyze current changes
				const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
				if (!workspaceFolder) {
					vscode.window.showErrorMessage('No workspace folder found');
					return;
				}

				// For demo purposes, we'll use a simple change detection
				const changeType = (await vscode.window.showQuickPick(['patch', 'minor', 'major'], {
					placeHolder: 'Select change type for version bump',
				})) as 'patch' | 'minor' | 'major';

				if (!changeType) {
					return;
				}

				const newVersion = await versionManager.generateNewVersion(changeType);
				vscode.window.showInformationMessage(
					`Generated version bump: ${newVersion} (${changeType})`
				);

				// Show changelog preview
				const changelog = await versionManager.generateChangelog();
				const panel = vscode.window.createWebviewPanel(
					'aideChangelog',
					'Generated Changelog',
					vscode.ViewColumn.One,
					{}
				);
				panel.webview.html = `<pre>${changelog}</pre>`;
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to generate version bump: ${error}`);
			}
		}),

		vscode.commands.registerCommand('aide.viewChangelog', async () => {
			try {
				const changelog = await versionManager.generateChangelog();
				const panel = vscode.window.createWebviewPanel(
					'aideChangelog',
					'AIDE Changelog',
					vscode.ViewColumn.One,
					{}
				);
				panel.webview.html = `<pre>${changelog}</pre>`;
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to load changelog: ${error}`);
			}
		}),

		vscode.commands.registerCommand('aide.checkUpstreamUpdates', async () => {
			try {
				const upstreamInfo = await versionManager.checkUpstreamUpdates();
				const message = `VS Code ${upstreamInfo.vscodeVersion} - Status: ${upstreamInfo.compatibilityStatus}`;

				if (upstreamInfo.pendingUpdates.length > 0) {
					const result = await vscode.window.showInformationMessage(
						`${message}\nPending updates: ${upstreamInfo.pendingUpdates.length}`,
						'View Details'
					);

					if (result === 'View Details') {
						const panel = vscode.window.createWebviewPanel(
							'aideUpstreamUpdates',
							'VS Code Upstream Updates',
							vscode.ViewColumn.One,
							{}
						);
						panel.webview.html = generateUpstreamUpdatesHTML(upstreamInfo);
					}
				} else {
					vscode.window.showInformationMessage(message);
				}
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to check upstream updates: ${error}`);
			}
		}),

		// AI Service Configuration Commands
		vscode.commands.registerCommand('aide.configureAI', async () => {
			const providers = [
				{ label: 'OpenAI', value: 'openai' },
				{ label: 'Azure OpenAI', value: 'azure' },
				{ label: 'Anthropic Claude', value: 'anthropic' },
			];

			const selectedProvider = await vscode.window.showQuickPick(providers, {
				placeHolder: 'Select AI provider to configure',
			});

			if (selectedProvider) {
				const apiKey = await vscode.window.showInputBox({
					prompt: `Enter API key for ${selectedProvider.label}`,
					password: true,
					placeHolder: 'Your API key',
				});
				if (apiKey) {
					try {
						await aiService.setupApiKey(selectedProvider.value, apiKey);
						const isConnected = await aiService.testConnection();

						if (isConnected) {
							vscode.window.showInformationMessage(
								`Successfully configured ${selectedProvider.label}!`
							);
						} else {
							vscode.window.showWarningMessage(
								`Configuration saved but connection test failed. Please verify your API key.`
							);
						}
					} catch (error) {
						vscode.window.showErrorMessage(`Failed to configure AI service: ${error}`);
					}
				}
			}
		}),

		vscode.commands.registerCommand('aide.testAIConnection', async () => {
			try {
				const isConnected = await aiService.testConnection();
				if (isConnected) {
					vscode.window.showInformationMessage('AI service connection successful!');
				} else {
					vscode.window.showWarningMessage(
						'AI service connection failed. Please check your configuration.'
					);
				}
			} catch (error) {
				vscode.window.showErrorMessage(`Connection test failed: ${error}`);
			}
		}),
		vscode.commands.registerCommand('aide.switchAIProvider', async () => {
			const currentProvider = aiService.getCurrentProvider();
			const providers = [
				{ label: 'OpenAI', value: 'openai' },
				{ label: 'Azure OpenAI', value: 'azure' },
				{ label: 'Anthropic Claude', value: 'anthropic' },
			];

			const availableProviders = providers.filter(p => p.value !== currentProvider);

			const selectedProvider = await vscode.window.showQuickPick(availableProviders, {
				placeHolder: `Current: ${providers.find(p => p.value === currentProvider)?.label || 'None'}. Select new provider:`,
			});

			if (selectedProvider) {
				try {
					await aiService.switchProvider(selectedProvider.value);
					vscode.window.showInformationMessage(`Switched to ${selectedProvider.label}`);
				} catch (error) {
					vscode.window.showErrorMessage(`Failed to switch provider: ${error}`);
				}
			}
		})
	);

	// Set context for when AIDE is active
	vscode.commands.executeCommand('setContext', 'aide.active', true);

	// Welcome message	vscode.window.showInformationMessage('AIDE is ready! Start by opening a conversation or planning a feature.');
}

/**
 * Generate HTML for version history display
 */
function generateVersionHistoryHTML(history: any[]): string {
	return `<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>AIDE Version History</title>
	<style>
		body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 20px; }
		.version { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
		.version-header { font-weight: bold; color: #0066cc; margin-bottom: 10px; }
		.changes { margin-left: 20px; }
		.change { margin: 5px 0; }
		.change-type { font-weight: bold; color: #666; }
	</style>
</head>
<body>
	<h1>AIDE Version History</h1>
	${
		history.length === 0
			? '<p>No version history available.</p>'
			: history
					.map(
						version => `
			<div class="version">
				<div class="version-header">
					Version ${version.current || 'Unknown'} (${version.changeType || 'patch'})
					<span style="float: right; font-size: 0.8em; color: #666;">
						${version.timestamp ? new Date(version.timestamp).toLocaleString() : 'Unknown date'}
					</span>
				</div>
				<div class="changes">
					${(version.changes || [])
						.map(
							(change: any) => `
						<div class="change">
							<span class="change-type">[${change.type || 'change'}]</span>
							${change.description || 'No description'}
						</div>
					`
						)
						.join('')}
				</div>
			</div>
		`
					)
					.join('')
	}
</body>
</html>`;
}

/**
 * Generate HTML for upstream updates display
 */
function generateUpstreamUpdatesHTML(upstreamInfo: any): string {
	return `<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>VS Code Upstream Updates</title>
	<style>
		body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 20px; }
		.status { padding: 10px; border-radius: 5px; margin: 10px 0; }
		.compatible { background-color: #d4edda; border: 1px solid #c3e6cb; }
		.needs-review { background-color: #fff3cd; border: 1px solid #ffeaa7; }
		.incompatible { background-color: #f8d7da; border: 1px solid #f5c6cb; }
		.update { margin: 5px 0; padding: 5px; background-color: #f8f9fa; border-radius: 3px; }
	</style>
</head>
<body>
	<h1>VS Code Upstream Updates</h1>
	<div class="status ${upstreamInfo.compatibilityStatus || 'needs-review'}">
		<strong>Current VS Code Version:</strong> ${upstreamInfo.vscodeVersion || 'Unknown'}<br>
		<strong>Compatibility Status:</strong> ${upstreamInfo.compatibilityStatus || 'Unknown'}<br>
		<strong>Last Sync:</strong> ${upstreamInfo.lastSync ? new Date(upstreamInfo.lastSync).toLocaleString() : 'Never'}
	</div>

	<h2>Pending Updates</h2>
	${
		(upstreamInfo.pendingUpdates || []).length === 0
			? '<p>No pending updates.</p>'
			: upstreamInfo.pendingUpdates
					.map(
						(update: string) => `
			<div class="update">${update}</div>
		`
					)
					.join('')
	}
</body>
</html>`;
}

export function deactivate() {
	logger.info('AIDE Core extension is now deactivated');
	LoggerService.getInstance().dispose();
}
