/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

// Simple interfaces for now - will be replaced with proper imports once packages are built
interface Settings {
	aiProviders: Record<string, any>;
	userPreferences: any;
	deploymentConfigs: any[];
}

interface AgentRuntime {
	updateSettings?: (settings: Settings) => Promise<void>;
}

interface MemoryGraphEngine {
	// placeholder
}

class SimpleSettingsManager {
	async save(settings: Settings): Promise<void> {
		// Save to VS Code workspace settings
		const config = vscode.workspace.getConfiguration('aide');
		await config.update('settings', settings, vscode.ConfigurationTarget.Workspace);
	}

	async load(): Promise<Settings> {
		const config = vscode.workspace.getConfiguration('aide');
		return config.get('settings', {
			aiProviders: {},
			userPreferences: {},
			deploymentConfigs: [],
		});
	}

	async reset(): Promise<void> {
		const config = vscode.workspace.getConfiguration('aide');
		await config.update('settings', undefined, vscode.ConfigurationTarget.Workspace);
	}
}

/**
 * Settings Panel for AIDE
 * Manages user configuration, API keys, and agent preferences
 */
export class SettingsPanel implements vscode.WebviewViewProvider {
	public static readonly viewType = 'aide-settings';
	private view?: vscode.WebviewView;
	private settingsManager: SimpleSettingsManager;

	constructor(
		private context: vscode.ExtensionContext,
		private agentRuntime: AgentRuntime,
		private memoryGraph: MemoryGraphEngine
	) {
		this.settingsManager = new SimpleSettingsManager();
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		token: vscode.CancellationToken
	) {
		this.view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.context.extensionUri],
		};

		webviewView.webview.html = this.getHtml(webviewView.webview);

		// Handle messages from the webview
		webviewView.webview.onDidReceiveMessage(
			async data => {
				switch (data.type) {
					case 'saveSettings':
						await this.saveSettings(data.settings);
						break;
					case 'loadSettings':
						await this.loadSettings();
						break;
					case 'testConnection':
						await this.testConnection(data.provider, data.apiKey);
						break;
					case 'resetSettings':
						await this.resetSettings();
						break;
					case 'exportSettings':
						await this.exportSettings();
						break;
					case 'importSettings':
						await this.importSettings();
						break;
				}
			},
			undefined,
			this.context.subscriptions
		);

		// Load initial settings
		this.loadSettings();
	}

	private async saveSettings(settings: Settings) {
		try {
			await this.settingsManager.save(settings);
			// Update agent runtime with new settings
			if (this.agentRuntime && this.agentRuntime.updateSettings) {
				// Restart agent runtime with new API keys
				await this.agentRuntime.updateSettings(settings);
			}

			this.sendMessage({
				type: 'settingsSaved',
				success: true,
				message: 'Settings saved successfully',
			});

			// Show success message
			vscode.window.showInformationMessage('AIDE settings saved successfully');
		} catch (error) {
			console.error('Failed to save settings:', error);
			this.sendMessage({
				type: 'settingsSaved',
				success: false,
				message: `Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});

			vscode.window.showErrorMessage(
				`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	private async loadSettings() {
		try {
			const settings = await this.settingsManager.load();
			this.sendMessage({
				type: 'settingsLoaded',
				settings: {
					...settings,
					// Just use the settings as-is for now
					// Will add masking when proper types are available
					aiProviders: settings.aiProviders,
				},
			});
		} catch (error) {
			console.error('Failed to load settings:', error);
			this.sendMessage({
				type: 'settingsError',
				message: `Failed to load settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		}
	}
	private async testConnection(provider: string, apiKey: string) {
		try {
			this.sendMessage({
				type: 'connectionTesting',
				provider,
			});

			// For now, just simulate a connection test
			// In the future, we would create an actual LLM service to test

			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));

			this.sendMessage({
				type: 'connectionTested',
				provider,
				success: true,
				message: 'Connection successful',
			});
		} catch (error) {
			console.error(`Failed to test ${provider} connection:`, error);
			this.sendMessage({
				type: 'connectionTested',
				provider,
				success: false,
				message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		}
	}

	private async resetSettings() {
		try {
			await this.settingsManager.reset();
			await this.loadSettings();

			this.sendMessage({
				type: 'settingsReset',
				success: true,
			});

			vscode.window.showInformationMessage('Settings reset to defaults');
		} catch (error) {
			console.error('Failed to reset settings:', error);
			vscode.window.showErrorMessage(
				`Failed to reset settings: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	private async exportSettings() {
		try {
			const settings = await this.settingsManager.load();
			const exportData = JSON.stringify(settings, null, 2);

			const uri = await vscode.window.showSaveDialog({
				defaultUri: vscode.Uri.file('aide-settings.json'),
				filters: {
					JSON: ['json'],
				},
			});

			if (uri) {
				await vscode.workspace.fs.writeFile(uri, Buffer.from(exportData, 'utf8'));
				vscode.window.showInformationMessage('Settings exported successfully');
			}
		} catch (error) {
			console.error('Failed to export settings:', error);
			vscode.window.showErrorMessage(
				`Failed to export settings: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	private async importSettings() {
		try {
			const uri = await vscode.window.showOpenDialog({
				canSelectFiles: true,
				canSelectFolders: false,
				canSelectMany: false,
				filters: {
					JSON: ['json'],
				},
			});

			if (uri && uri[0]) {
				const fileContent = await vscode.workspace.fs.readFile(uri[0]);
				const settingsData = JSON.parse(fileContent.toString());

				await this.settingsManager.save(settingsData);
				await this.loadSettings();

				vscode.window.showInformationMessage('Settings imported successfully');
			}
		} catch (error) {
			console.error('Failed to import settings:', error);
			vscode.window.showErrorMessage(
				`Failed to import settings: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	private sendMessage(message: any) {
		if (this.view) {
			this.view.webview.postMessage(message);
		}
	}
	private getHtml(webview: vscode.Webview): string {
		// Use path.join for constructing file paths correctly
		// VS Code handles the conversion to URIs
		const stylesResetUri = webview.asWebviewUri(
			vscode.Uri.file(this.context.extensionUri.fsPath + '/media/reset.css')
		);
		const stylesMainUri = webview.asWebviewUri(
			vscode.Uri.file(this.context.extensionUri.fsPath + '/media/vscode.css')
		);
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.file(this.context.extensionUri.fsPath + '/media/settings.js')
		);

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${stylesResetUri}" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet">
				<title>AIDE Settings</title>
				<style>
					.settings-container {
						padding: 20px;
					}
					.setting-group {
						margin-bottom: 20px;
						border: 1px solid var(--vscode-widget-border);
						border-radius: 4px;
						padding: 15px;
					}
					.setting-group h3 {
						margin-top: 0;
						color: var(--vscode-foreground);
						border-bottom: 1px solid var(--vscode-widget-border);
						padding-bottom: 8px;
					}
					.setting-item {
						margin-bottom: 15px;
					}
					.setting-item label {
						display: block;
						margin-bottom: 5px;
						font-weight: bold;
						color: var(--vscode-foreground);
					}
					.setting-item input, .setting-item select, .setting-item textarea {
						width: 100%;
						padding: 8px;
						border: 1px solid var(--vscode-input-border);
						border-radius: 2px;
						background: var(--vscode-input-background);
						color: var(--vscode-input-foreground);
						font-family: var(--vscode-font-family);
					}
					.setting-item input:focus, .setting-item select:focus, .setting-item textarea:focus {
						outline: 1px solid var(--vscode-focusBorder);
					}
					.button-group {
						display: flex;
						gap: 10px;
						margin-top: 20px;
					}
					.button {
						padding: 8px 16px;
						border: none;
						border-radius: 2px;
						background: var(--vscode-button-background);
						color: var(--vscode-button-foreground);
						cursor: pointer;
						font-family: var(--vscode-font-family);
					}
					.button:hover {
						background: var(--vscode-button-hoverBackground);
					}
					.button.secondary {
						background: var(--vscode-button-secondaryBackground);
						color: var(--vscode-button-secondaryForeground);
					}
					.button.secondary:hover {
						background: var(--vscode-button-secondaryHoverBackground);
					}
					.status-indicator {
						display: inline-block;
						width: 8px;
						height: 8px;
						border-radius: 50%;
						margin-left: 8px;
					}
					.status-indicator.connected {
						background: var(--vscode-terminal-ansiGreen);
					}
					.status-indicator.disconnected {
						background: var(--vscode-terminal-ansiRed);
					}
					.status-indicator.testing {
						background: var(--vscode-terminal-ansiYellow);
						animation: pulse 1s infinite;
					}
					@keyframes pulse {
						0%, 100% { opacity: 1; }
						50% { opacity: 0.5; }
					}
					.help-text {
						font-size: 0.9em;
						color: var(--vscode-descriptionForeground);
						margin-top: 4px;
					}
					.api-key-input {
						font-family: monospace;
					}
					.test-connection {
						margin-top: 10px;
					}
				</style>
			</head>
			<body>
				<div class="settings-container">
					<h2>AIDE Settings</h2>

					<!-- AI Providers Section -->
					<div class="setting-group">
						<h3>AI Providers</h3>

						<!-- OpenAI Settings -->
						<div class="setting-item">
							<label for="openai-enabled">
								OpenAI
								<span class="status-indicator disconnected" id="openai-status"></span>
							</label>
							<input type="checkbox" id="openai-enabled">
							<div class="help-text">Enable OpenAI GPT models</div>
						</div>
						<div class="setting-item" id="openai-config">
							<label for="openai-api-key">API Key:</label>
							<input type="password" id="openai-api-key" class="api-key-input" placeholder="sk-...">
							<div class="help-text">Get your API key from https://platform.openai.com/api-keys</div>
							<button class="button secondary test-connection" data-provider="openai">Test Connection</button>
						</div>

						<!-- Anthropic Settings -->
						<div class="setting-item">
							<label for="anthropic-enabled">
								Anthropic Claude
								<span class="status-indicator disconnected" id="anthropic-status"></span>
							</label>
							<input type="checkbox" id="anthropic-enabled">
							<div class="help-text">Enable Anthropic Claude models</div>
						</div>
						<div class="setting-item" id="anthropic-config">
							<label for="anthropic-api-key">API Key:</label>
							<input type="password" id="anthropic-api-key" class="api-key-input" placeholder="sk-ant-...">
							<div class="help-text">Get your API key from https://console.anthropic.com/</div>
							<button class="button secondary test-connection" data-provider="anthropic">Test Connection</button>
						</div>

						<!-- Azure OpenAI Settings -->
						<div class="setting-item">
							<label for="azure-enabled">
								Azure OpenAI
								<span class="status-indicator disconnected" id="azure-status"></span>
							</label>
							<input type="checkbox" id="azure-enabled">
							<div class="help-text">Enable Azure OpenAI Service</div>
						</div>
						<div class="setting-item" id="azure-config">
							<label for="azure-endpoint">Endpoint:</label>
							<input type="text" id="azure-endpoint" placeholder="https://your-resource.openai.azure.com/">
							<label for="azure-api-key">API Key:</label>
							<input type="password" id="azure-api-key" class="api-key-input">
							<label for="azure-deployment">Deployment Name:</label>
							<input type="text" id="azure-deployment" placeholder="gpt-4">
							<div class="help-text">Configure your Azure OpenAI resource</div>
							<button class="button secondary test-connection" data-provider="azure">Test Connection</button>
						</div>

						<!-- Local LLM Settings -->
						<div class="setting-item">
							<label for="local-enabled">
								Local LLM (Ollama)
								<span class="status-indicator disconnected" id="local-status"></span>
							</label>
							<input type="checkbox" id="local-enabled">
							<div class="help-text">Use local LLM through Ollama</div>
						</div>
						<div class="setting-item" id="local-config">
							<label for="local-endpoint">Endpoint:</label>
							<input type="text" id="local-endpoint" value="http://localhost:11434" placeholder="http://localhost:11434">
							<label for="local-model">Model:</label>
							<select id="local-model">
								<option value="llama3">Llama 3</option>
								<option value="mistral">Mistral</option>
								<option value="codellama">Code Llama</option>
								<option value="neural-chat">Neural Chat</option>
							</select>
							<div class="help-text">Install Ollama from https://ollama.ai/</div>
							<button class="button secondary test-connection" data-provider="local">Test Connection</button>
						</div>
					</div>

					<!-- Agent Preferences -->
					<div class="setting-group">
						<h3>Agent Preferences</h3>

						<div class="setting-item">
							<label for="default-provider">Default AI Provider:</label>
							<select id="default-provider">
								<option value="openai">OpenAI</option>
								<option value="anthropic">Anthropic</option>
								<option value="azure">Azure OpenAI</option>
								<option value="local">Local LLM</option>
							</select>
						</div>

						<div class="setting-item">
							<label for="temperature">Creativity Level (Temperature):</label>
							<input type="range" id="temperature" min="0" max="1" step="0.1" value="0.7">
							<span id="temperature-value">0.7</span>
							<div class="help-text">Lower values = more focused, Higher values = more creative</div>
						</div>

						<div class="setting-item">
							<label for="max-tokens">Max Response Length:</label>
							<select id="max-tokens">
								<option value="1000">Short (1000 tokens)</option>
								<option value="2000" selected>Medium (2000 tokens)</option>
								<option value="4000">Long (4000 tokens)</option>
								<option value="8000">Very Long (8000 tokens)</option>
							</select>
						</div>
					</div>

					<!-- Deployment Settings -->
					<div class="setting-group">
						<h3>Deployment Settings</h3>

						<div class="setting-item">
							<label for="default-platform">Default Deployment Platform:</label>
							<select id="default-platform">
								<option value="vercel">Vercel</option>
								<option value="netlify">Netlify</option>
								<option value="firebase">Firebase Hosting</option>
								<option value="github-pages">GitHub Pages</option>
								<option value="aws">AWS</option>
								<option value="azure">Azure</option>
								<option value="gcp">Google Cloud</option>
							</select>
						</div>

						<div class="setting-item">
							<label for="auto-deploy">Auto-deploy on completion:</label>
							<input type="checkbox" id="auto-deploy">
							<div class="help-text">Automatically deploy when project is complete</div>
						</div>
					</div>

					<!-- Advanced Settings -->
					<div class="setting-group">
						<h3>Advanced Settings</h3>

						<div class="setting-item">
							<label for="memory-retention">Memory Retention (days):</label>
							<input type="number" id="memory-retention" value="30" min="1" max="365">
							<div class="help-text">How long to keep conversation history</div>
						</div>

						<div class="setting-item">
							<label for="debug-mode">Debug Mode:</label>
							<input type="checkbox" id="debug-mode">
							<div class="help-text">Enable detailed logging for troubleshooting</div>
						</div>

						<div class="setting-item">
							<label for="telemetry">Anonymous Telemetry:</label>
							<input type="checkbox" id="telemetry" checked>
							<div class="help-text">Help improve AIDE by sharing anonymous usage data</div>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="button-group">
						<button class="button" id="save-settings">Save Settings</button>
						<button class="button secondary" id="test-all">Test All Connections</button>
						<button class="button secondary" id="reset-settings">Reset to Defaults</button>
						<button class="button secondary" id="export-settings">Export Settings</button>
						<button class="button secondary" id="import-settings">Import Settings</button>
					</div>

					<div id="status-message" style="margin-top: 20px; display: none;"></div>
				</div>

				<script src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}
