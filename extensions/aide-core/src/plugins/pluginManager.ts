import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { BaseAgent } from '../agents/baseAgent';
import { MemoryGraph } from '../memory/memoryGraph';
import { createLogger } from '../services/loggerService';

export interface PluginManifest {
	id: string;
	name: string;
	version: string;
	description: string;
	author: string;
	main: string;
	engines: {
		aide: string;
	};
	activationEvents: string[];
	contributes: {
		agents?: AgentContribution[];
		commands?: CommandContribution[];
		views?: ViewContribution[];
		settings?: SettingContribution[];
		templates?: TemplateContribution[];
	};
	dependencies?: Record<string, string>;
}

export interface AgentContribution {
	id: string;
	name: string;
	description: string;
	capabilities: string[];
	priority: number;
}

export interface CommandContribution {
	command: string;
	title: string;
	category?: string;
	when?: string;
}

export interface ViewContribution {
	id: string;
	name: string;
	when?: string;
	type: 'tree' | 'webview' | 'panel';
}

export interface SettingContribution {
	key: string;
	type: 'string' | 'number' | 'boolean' | 'object';
	default: any;
	description: string;
}

export interface TemplateContribution {
	id: string;
	name: string;
	description: string;
	projectType: string;
	files: Record<string, string>;
}

export interface Plugin {
	manifest: PluginManifest;
	instance: any;
	context: vscode.ExtensionContext;
	activated: boolean;
}

export class PluginManager {
	private plugins: Map<string, Plugin> = new Map();
	private registeredAgents: Map<string, BaseAgent> = new Map();
	private memoryGraph: MemoryGraph;
	private readonly logger = createLogger('PluginManager');

	constructor(memoryGraph: MemoryGraph) {
		this.memoryGraph = memoryGraph;
	}

	async loadPlugin(pluginPath: string): Promise<boolean> {
		try {
			// Read plugin manifest
			const manifestPath = vscode.Uri.file(`${pluginPath}/package.json`);
			const manifestData = await vscode.workspace.fs.readFile(manifestPath);
			const manifest: PluginManifest = JSON.parse(manifestData.toString());

			// Validate manifest
			if (!this.validateManifest(manifest)) {
				vscode.window.showErrorMessage(`Invalid plugin manifest: ${manifest.name}`);
				return false;
			}

			// Check if plugin already loaded
			if (this.plugins.has(manifest.id)) {
				vscode.window.showWarningMessage(`Plugin already loaded: ${manifest.name}`);
				return false;
			}

			// Load plugin module
			const pluginMainPath = `${pluginPath}/${manifest.main}`;
			const pluginModule = await import(pluginMainPath);

			// Create plugin context
			const pluginContext = this.createPluginContext(manifest, pluginPath);

			// Create plugin instance
			const plugin: Plugin = {
				manifest,
				instance: pluginModule,
				context: pluginContext,
				activated: false,
			};

			// Register plugin
			this.plugins.set(manifest.id, plugin);

			// Register contributions
			await this.registerContributions(plugin);

			vscode.window.showInformationMessage(`Plugin loaded: ${manifest.name}`);
			return true;
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to load plugin: ${error}`);
			return false;
		}
	}

	async unloadPlugin(pluginId: string): Promise<boolean> {
		try {
			const plugin = this.plugins.get(pluginId);
			if (!plugin) {
				return false;
			}

			// Deactivate plugin
			if (plugin.activated && plugin.instance.deactivate) {
				await plugin.instance.deactivate();
			}

			// Unregister contributions
			await this.unregisterContributions(plugin);

			// Remove plugin
			this.plugins.delete(pluginId);

			vscode.window.showInformationMessage(`Plugin unloaded: ${plugin.manifest.name}`);
			return true;
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to unload plugin: ${error}`);
			return false;
		}
	}

	async activatePlugin(pluginId: string): Promise<boolean> {
		try {
			const plugin = this.plugins.get(pluginId);
			if (!plugin || plugin.activated) {
				return false;
			}

			// Activate plugin
			if (plugin.instance.activate) {
				await plugin.instance.activate(plugin.context);
			}

			plugin.activated = true;
			vscode.window.showInformationMessage(`Plugin activated: ${plugin.manifest.name}`);
			return true;
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to activate plugin: ${error}`);
			return false;
		}
	}

	async discoverPlugins(): Promise<PluginManifest[]> {
		const discoveredPlugins: PluginManifest[] = [];

		try {
			// Check workspace folders for plugins
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (workspaceFolders) {
				for (const folder of workspaceFolders) {
					const pluginsDir = vscode.Uri.joinPath(folder.uri, '.aide', 'plugins');

					try {
						const pluginDirs = await vscode.workspace.fs.readDirectory(pluginsDir);

						for (const [dirName, type] of pluginDirs) {
							if (type === vscode.FileType.Directory) {
								const manifestPath = vscode.Uri.joinPath(pluginsDir, dirName, 'package.json');

								try {
									const manifestData = await vscode.workspace.fs.readFile(manifestPath);
									const manifest: PluginManifest = JSON.parse(manifestData.toString());
									discoveredPlugins.push(manifest);
								} catch {
									// Skip invalid manifests
								}
							}
						}
					} catch {
						// Plugins directory doesn't exist
					}
				}
			}

			// Check global plugins directory
			const globalPluginsPath = vscode.Uri.file(
				`${process.env.HOME || process.env.USERPROFILE}/.aide/plugins`
			);
			try {
				const globalPluginDirs = await vscode.workspace.fs.readDirectory(globalPluginsPath);

				for (const [dirName, type] of globalPluginDirs) {
					if (type === vscode.FileType.Directory) {
						const manifestPath = vscode.Uri.joinPath(globalPluginsPath, dirName, 'package.json');

						try {
							const manifestData = await vscode.workspace.fs.readFile(manifestPath);
							const manifest: PluginManifest = JSON.parse(manifestData.toString());
							discoveredPlugins.push(manifest);
						} catch {
							// Skip invalid manifests
						}
					}
				}
			} catch {
				// Global plugins directory doesn't exist
			}
		} catch (error) {
			this.logger.error('Error discovering plugins:', error);
		}
		return discoveredPlugins;
	}

	async discoverAndLoadPlugins(): Promise<void> {
		try {
			const discoveredPlugins = await this.discoverPlugins();

			for (const manifest of discoveredPlugins) {
				// Find the plugin directory path
				let pluginPath = '';

				// Check workspace folders first
				const workspaceFolders = vscode.workspace.workspaceFolders;
				if (workspaceFolders) {
					for (const folder of workspaceFolders) {
						const workspacePluginPath = vscode.Uri.joinPath(
							folder.uri,
							'.aide',
							'plugins',
							manifest.id
						).fsPath;

						try {
							await vscode.workspace.fs.stat(vscode.Uri.file(workspacePluginPath));
							pluginPath = workspacePluginPath;
							break;
						} catch {
							// Continue searching
						}
					}
				}

				// Check global plugins if not found in workspace
				if (!pluginPath) {
					const globalPluginPath = `${process.env.HOME || process.env.USERPROFILE}/.aide/plugins/${manifest.id}`;
					try {
						await vscode.workspace.fs.stat(vscode.Uri.file(globalPluginPath));
						pluginPath = globalPluginPath;
					} catch {
						// Plugin path not found
						this.logger.warn(`Plugin ${manifest.id} directory not found`);
						continue;
					}
				}

				if (pluginPath) {
					await this.loadPlugin(pluginPath);
				}
			}
		} catch (error) {
			this.logger.error('Error discovering and loading plugins:', error);
			throw error;
		}
	}

	getLoadedPlugins(): PluginManifest[] {
		return Array.from(this.plugins.values()).map(plugin => plugin.manifest);
	}

	getPlugin(pluginId: string): Plugin | undefined {
		return this.plugins.get(pluginId);
	}

	getRegisteredAgent(agentId: string): BaseAgent | undefined {
		return this.registeredAgents.get(agentId);
	}

	getAllRegisteredAgents(): BaseAgent[] {
		return Array.from(this.registeredAgents.values());
	}

	private validateManifest(manifest: PluginManifest): boolean {
		return !!(
			manifest.id &&
			manifest.name &&
			manifest.version &&
			manifest.main &&
			manifest.engines?.aide
		);
	}

	private createPluginContext(
		manifest: PluginManifest,
		pluginPath: string
	): vscode.ExtensionContext {
		// Create a simplified extension context for plugins
		const storageUri = vscode.Uri.file(`${pluginPath}/.storage`);
		const globalStorageUri = vscode.Uri.file(
			`${process.env.HOME || process.env.USERPROFILE}/.aide/storage/${manifest.id}`
		);
		return {
			subscriptions: [],
			workspaceState: {
				get: async (key: string, defaultValue?: any) => {
					const value = await this.readPluginStorage(manifest.id, key, false);
					return value !== undefined ? value : defaultValue;
				},
				update: async (key: string, value: any) => {
					await this.writePluginStorage(manifest.id, key, value, false);
				},
				keys: () => this.getStorageKeys(manifest.id, false),
			},
			globalState: {
				get: async (key: string, defaultValue?: any) => {
					const value = await this.readPluginStorage(manifest.id, key, true);
					return value !== undefined ? value : defaultValue;
				},
				update: async (key: string, value: any) => {
					await this.writePluginStorage(manifest.id, key, value, true);
				},
				keys: () => this.getStorageKeys(manifest.id, true),
				setKeysForSync: (keys: string[]) => this.setStorageKeysForSync(manifest.id, keys),
			},
			extensionUri: vscode.Uri.file(pluginPath),
			extensionPath: pluginPath,
			storagePath: `${pluginPath}/.storage`,
			globalStoragePath: `${process.env.HOME || process.env.USERPROFILE}/.aide/storage/${manifest.id}`,
			logPath: `${pluginPath}/.logs`,
			storageUri,
			globalStorageUri,
			logUri: vscode.Uri.file(`${pluginPath}/.logs`),
			asAbsolutePath: (relativePath: string) => `${pluginPath}/${relativePath}`,
			secrets: {
				get: async (key: string) => await this.readPluginSecret(manifest.id, key),
				store: async (key: string, value: string) =>
					await this.writePluginSecret(manifest.id, key, value),
				delete: async (key: string) => await this.writePluginSecret(manifest.id, key, ''),
			},
			environmentVariableCollection: {
				persistent: false,
				replace: (variable: string, value: string) => {},
				append: (variable: string, value: string) => {},
				prepend: (variable: string, value: string) => {},
				get: (variable: string) => undefined,
				forEach: (callback: (variable: string, mutator: any, collection: any) => any) => {},
				delete: (variable: string) => {},
				clear: () => {},
				[Symbol.iterator]: function* () {},
			},
			extension: {
				id: manifest.id,
				extensionUri: vscode.Uri.file(pluginPath),
				extensionPath: pluginPath,
				isActive: true,
				packageJSON: manifest,
				exports: undefined,
				activate: async () => {},
			},
			extensionMode: vscode.ExtensionMode.Development,
			languageModelAccessInformation: {
				onDidChange: new vscode.EventEmitter<void>().event,
				canSendRequest: () => false,
			},
		} as any;
	}

	private async registerContributions(plugin: Plugin): Promise<void> {
		const { manifest } = plugin;

		// Register agents
		if (manifest.contributes?.agents) {
			for (const agentContrib of manifest.contributes.agents) {
				try {
					const AgentClass = plugin.instance[agentContrib.id];
					if (AgentClass) {
						const agent = new AgentClass(this.memoryGraph);
						this.registeredAgents.set(agentContrib.id, agent);
					}
				} catch (error) {
					this.logger.error(`Failed to register agent ${agentContrib.id}:`, error);
				}
			}
		}

		// Register commands
		if (manifest.contributes?.commands) {
			for (const cmdContrib of manifest.contributes.commands) {
				try {
					const command = vscode.commands.registerCommand(cmdContrib.command, (...args: any[]) => {
						const handler = plugin.instance[cmdContrib.command.replace('.', '_')];
						if (handler) {
							return handler.apply(plugin.instance, args);
						}
					});
					plugin.context.subscriptions.push(command);
				} catch (error) {
					this.logger.error(`Failed to register command ${cmdContrib.command}:`, error);
				}
			}
		}

		// Register views would go here
		// Register settings would go here
		// Register templates would go here
	}

	private async unregisterContributions(plugin: Plugin): Promise<void> {
		// Remove registered agents
		if (plugin.manifest.contributes?.agents) {
			for (const agentContrib of plugin.manifest.contributes.agents) {
				this.registeredAgents.delete(agentContrib.id);
			}
		}

		// Dispose all subscriptions
		plugin.context.subscriptions.forEach(subscription => {
			subscription.dispose();
		});
		plugin.context.subscriptions.length = 0;
	}

	/**
	 * Read storage file for plugin
	 */
	private async readPluginStorage(pluginId: string, key: string, isGlobal = false): Promise<any> {
		try {
			const storageDir = isGlobal
				? path.join(process.env.HOME || process.env.USERPROFILE || '', '.aide', 'storage', pluginId)
				: path.join(
						vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
						'.aide',
						'storage',
						pluginId
					);

			const storageFile = path.join(storageDir, 'storage.json');

			if (await this.fileExists(storageFile)) {
				const content = await fs.readFile(storageFile, 'utf8');
				const data = JSON.parse(content);
				return data[key];
			}
			return undefined;
		} catch (error) {
			this.logger.error(`Failed to read plugin storage for ${pluginId}:`, error);
			return undefined;
		}
	}

	/**
	 * Write storage file for plugin
	 */
	private async writePluginStorage(
		pluginId: string,
		key: string,
		value: any,
		isGlobal = false
	): Promise<void> {
		try {
			const storageDir = isGlobal
				? path.join(process.env.HOME || process.env.USERPROFILE || '', '.aide', 'storage', pluginId)
				: path.join(
						vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
						'.aide',
						'storage',
						pluginId
					);

			await fs.mkdir(storageDir, { recursive: true });
			const storageFile = path.join(storageDir, 'storage.json');
			let data: Record<string, any> = {};
			if (await this.fileExists(storageFile)) {
				const content = await fs.readFile(storageFile, 'utf8');
				data = JSON.parse(content);
			}

			data[key] = value;
			await fs.writeFile(storageFile, JSON.stringify(data, null, 2));
		} catch (error) {
			this.logger.error(`Failed to write plugin storage for ${pluginId}:`, error);
		}
	}

	/**
	 * Read secrets file for plugin
	 */
	private async readPluginSecret(pluginId: string, key: string): Promise<string | undefined> {
		try {
			const secretsDir = path.join(
				process.env.HOME || process.env.USERPROFILE || '',
				'.aide',
				'secrets',
				pluginId
			);
			const secretsFile = path.join(secretsDir, 'secrets.json');

			if (await this.fileExists(secretsFile)) {
				const content = await fs.readFile(secretsFile, 'utf8');
				const data = JSON.parse(content);
				return data[key];
			}
			return undefined;
		} catch (error) {
			this.logger.error(`Failed to read plugin secret for ${pluginId}:`, error);
			return undefined;
		}
	}

	/**
	 * Write secrets file for plugin
	 */
	private async writePluginSecret(pluginId: string, key: string, value: string): Promise<void> {
		try {
			const secretsDir = path.join(
				process.env.HOME || process.env.USERPROFILE || '',
				'.aide',
				'secrets',
				pluginId
			);
			await fs.mkdir(secretsDir, { recursive: true });
			const secretsFile = path.join(secretsDir, 'secrets.json');
			let data: Record<string, any> = {};
			if (await this.fileExists(secretsFile)) {
				const content = await fs.readFile(secretsFile, 'utf8');
				data = JSON.parse(content);
			}

			data[key] = value;
			await fs.writeFile(secretsFile, JSON.stringify(data, null, 2));
		} catch (error) {
			this.logger.error(`Failed to write plugin secret for ${pluginId}:`, error);
		}
	}

	/**
	 * Check if file exists
	 */
	private async fileExists(filePath: string): Promise<boolean> {
		try {
			await fs.access(filePath);
			return true;
		} catch {
			return false;
		}
	}
	/**
	 * Get all storage keys for a plugin
	 */
	private getStorageKeys(pluginId: string, isGlobal: boolean): string[] {
		try {
			const storageType = isGlobal ? 'global' : 'workspace';
			const storageFile = path.join(this.getPluginDataDir(pluginId), `${storageType}.json`);

			if (!fsSync.existsSync(storageFile)) {
				return [];
			}

			const data = JSON.parse(fsSync.readFileSync(storageFile, 'utf8'));
			return Object.keys(data);
		} catch (error) {
			this.logger.error(`Failed to get storage keys for plugin ${pluginId}:`, error);
			return [];
		}
	}

	/**
	 * Set which keys should be synchronized across devices (VS Code cloud sync)
	 */
	private setStorageKeysForSync(pluginId: string, keys: string[]): void {
		try {
			const syncFile = path.join(this.getPluginDataDir(pluginId), 'sync-keys.json');
			fsSync.writeFileSync(syncFile, JSON.stringify({ syncKeys: keys }, null, 2));
		} catch (error) {
			this.logger.error(`Failed to set sync keys for plugin ${pluginId}:`, error);
		}
	}

	/**
	 * Get the data directory for a plugin
	 */
	private getPluginDataDir(pluginId: string): string {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (workspaceFolders && workspaceFolders.length > 0) {
			return path.join(workspaceFolders[0].uri.fsPath, '.aide', 'plugins', pluginId);
		}
		// Fallback to global storage
		return path.join(require('os').homedir(), '.aide', 'plugins', pluginId);
	}

	// ...existing code...
}

export class PluginAPI {
	private memoryGraph: MemoryGraph;

	constructor(memoryGraph: MemoryGraph) {
		this.memoryGraph = memoryGraph;
	}
	// Provide safe access to AIDE functionality for plugins
	addMemoryNode(
		type: 'intent' | 'feature' | 'screen' | 'logic' | 'relationship' | 'decision',
		content: string,
		metadata?: any
	): void {
		this.memoryGraph.addNode(type, content, {
			...metadata,
			source: 'plugin',
		});
	}

	getMemoryNodes(
		type?: 'intent' | 'feature' | 'screen' | 'logic' | 'relationship' | 'decision'
	): any[] {
		// Since getNodes doesn't exist, we'll use getNode and filter
		const allNodes = this.memoryGraph.getNode('');
		if (!type) {
			return [allNodes];
		}
		// This is a simplified implementation - in reality we'd need to traverse the graph
		return allNodes ? [allNodes] : [];
	}

	showMessage(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
		switch (type) {
			case 'info':
				vscode.window.showInformationMessage(message);
				break;
			case 'warning':
				vscode.window.showWarningMessage(message);
				break;
			case 'error':
				vscode.window.showErrorMessage(message);
				break;
		}
	}

	getWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
		return vscode.workspace.workspaceFolders?.[0];
	}

	async readFile(filePath: string): Promise<string> {
		const uri = vscode.Uri.file(filePath);
		const data = await vscode.workspace.fs.readFile(uri);
		return data.toString();
	}

	async writeFile(filePath: string, content: string): Promise<void> {
		const uri = vscode.Uri.file(filePath);
		await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
	}

	// Add more API methods as needed
}
