import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron';
import { join } from 'path';
import { MemoryGraphEngine } from '@aide/memory-graph';
import { AgentRuntime } from '@aide/agent-runtime';
import Store from 'electron-store';

/**
 * AIDE Electron Main Process
 * Handles window management, native integrations, and agent runtime
 */

interface AideStore {
	windowBounds: {
		width: number;
		height: number;
		x?: number;
		y?: number;
	};
	memoryGraphs: Record<string, unknown>;
	recentProjects: string[];
	userPreferences: {
		theme: 'light' | 'dark' | 'system';
		autoSave: boolean;
		aiProvider: string;
	};
}

class AideApplication {
	private mainWindow: BrowserWindow | null = null;
	private memoryGraph: MemoryGraphEngine;
	private agentRuntime: AgentRuntime;
	private store: Store<AideStore>;

	constructor() {
		this.store = new Store<AideStore>({
			defaults: {
				windowBounds: { width: 1400, height: 900 },
				memoryGraphs: {},
				recentProjects: [],
				userPreferences: {
					theme: 'system',
					autoSave: true,
					aiProvider: 'openai',
				},
			},
		});

		this.memoryGraph = new MemoryGraphEngine();
		this.agentRuntime = new AgentRuntime(this.memoryGraph);
	}
	async initialize() {
		await app.whenReady();

		// Agent runtime is already initialized in constructor
		// await this.agentRuntime.initialize();

		// Create main window
		this.createMainWindow();

		// Set up menu
		this.createMenu();

		// Set up IPC handlers
		this.setupIpcHandlers();

		// Handle app events
		this.setupAppEvents();
	}

	private createMainWindow() {
		const bounds = this.store.get('windowBounds');

		this.mainWindow = new BrowserWindow({
			...bounds,
			minWidth: 1200,
			minHeight: 800,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
				webSecurity: false, // For development - should be enabled in production
			},
			titleBarStyle: 'hiddenInset',
			show: false,
		});

		// Load the React app
		if (process.env.NODE_ENV === 'development') {
			this.mainWindow.loadURL('http://localhost:3000');
			this.mainWindow.webContents.openDevTools();
		} else {
			this.mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
		}

		this.mainWindow.once('ready-to-show', () => {
			this.mainWindow?.show();
		});

		// Save window bounds on close
		this.mainWindow.on('close', () => {
			if (this.mainWindow) {
				this.store.set('windowBounds', this.mainWindow.getBounds());
			}
		});

		this.mainWindow.on('closed', () => {
			this.mainWindow = null;
		});
	}

	private createMenu() {
		const template: Electron.MenuItemConstructorOptions[] = [
			{
				label: 'AIDE',
				submenu: [
					{
						label: 'New Project...',
						accelerator: 'CmdOrCtrl+N',
						click: () => this.handleNewProject(),
					},
					{
						label: 'Open Project...',
						accelerator: 'CmdOrCtrl+O',
						click: () => this.handleOpenProject(),
					},
					{ type: 'separator' },
					{
						label: 'Preferences...',
						accelerator: 'CmdOrCtrl+,',
						click: () => this.handlePreferences(),
					},
					{ type: 'separator' },
					{
						label: 'Quit',
						accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
						click: () => app.quit(),
					},
				],
			},
			{
				label: 'Conversation',
				submenu: [
					{
						label: 'New Conversation',
						accelerator: 'CmdOrCtrl+Shift+N',
						click: () => this.sendToRenderer('new-conversation'),
					},
					{
						label: 'Clear History',
						click: () => this.sendToRenderer('clear-conversation'),
					},
				],
			},
			{
				label: 'Memory Graph',
				submenu: [
					{
						label: 'Show Graph View',
						accelerator: 'CmdOrCtrl+G',
						click: () => this.sendToRenderer('toggle-memory-graph'),
					},
					{
						label: 'Export Graph...',
						click: () => this.handleExportGraph(),
					},
					{
						label: 'Import Graph...',
						click: () => this.handleImportGraph(),
					},
				],
			},
			{
				label: 'Deploy',
				submenu: [
					{
						label: 'Deploy to Web',
						click: () => this.sendToRenderer('deploy-web'),
					},
					{
						label: 'Deploy to Mobile',
						click: () => this.sendToRenderer('deploy-mobile'),
					},
					{
						label: 'Build Desktop App',
						click: () => this.sendToRenderer('deploy-desktop'),
					},
				],
			},
			{
				label: 'View',
				submenu: [
					{ role: 'reload' },
					{ role: 'forceReload' },
					{ role: 'toggleDevTools' },
					{ type: 'separator' },
					{ role: 'resetZoom' },
					{ role: 'zoomIn' },
					{ role: 'zoomOut' },
					{ type: 'separator' },
					{ role: 'togglefullscreen' },
				],
			},
			{
				label: 'Window',
				submenu: [
					{ role: 'minimize' },
					{ role: 'close' },
				],
			},
		];

		const menu = Menu.buildFromTemplate(template);
		Menu.setApplicationMenu(menu);
	}

	private setupIpcHandlers() {
		// Memory graph operations
		ipcMain.handle('memory-graph:get', () => {
			return this.memoryGraph.toJSON();
		});

		ipcMain.handle('memory-graph:save', (_, data) => {
			// Save memory graph to store
			this.store.set('memoryGraphs.current', data);
			return true;
		});

		// Agent runtime operations
		ipcMain.handle('agent:execute-task', async (_, task) => {
			return await this.agentRuntime.executeTask(task);
		});
		ipcMain.handle('agent:get-status', () => {
			return this.agentRuntime.getAgentStatuses();
		});

		// User preferences
		ipcMain.handle('preferences:get', () => {
			return this.store.get('userPreferences');
		});

		ipcMain.handle('preferences:set', (_, preferences) => {
			this.store.set('userPreferences', preferences);
			return true;
		});
	}

	private setupAppEvents() {
		app.on('window-all-closed', () => {
			if (process.platform !== 'darwin') {
				app.quit();
			}
		});

		app.on('activate', () => {
			if (BrowserWindow.getAllWindows().length === 0) {
				this.createMainWindow();
			}
		});
	}

	private async handleNewProject() {
		const result = await dialog.showMessageBox({
			type: 'question',
			buttons: ['Web App', 'Mobile App', 'Desktop App', 'Cancel'],
			defaultId: 0,
			message: 'What type of project would you like to create?',
		});

		if (result.response < 3) {
			const projectTypes = ['web', 'mobile', 'desktop'];
			this.sendToRenderer('new-project', {
				type: projectTypes[result.response],
			});
		}
	}

	private async handleOpenProject() {
		const result = await dialog.showOpenDialog({
			properties: ['openDirectory'],
			message: 'Select AIDE project directory',
		});

		if (!result.canceled && result.filePaths.length > 0) {
			this.sendToRenderer('open-project', {
				path: result.filePaths[0],
			});
		}
	}

	private handlePreferences() {
		this.sendToRenderer('show-preferences');
	}

	private async handleExportGraph() {
		const result = await dialog.showSaveDialog({
			defaultPath: 'memory-graph.json',
			filters: [
				{ name: 'JSON Files', extensions: ['json'] },
				{ name: 'All Files', extensions: ['*'] },
			],
		});

		if (!result.canceled && result.filePath) {
			this.sendToRenderer('export-graph', {
				path: result.filePath,
			});
		}
	}

	private async handleImportGraph() {
		const result = await dialog.showOpenDialog({
			filters: [
				{ name: 'JSON Files', extensions: ['json'] },
				{ name: 'All Files', extensions: ['*'] },
			],
		});

		if (!result.canceled && result.filePaths.length > 0) {
			this.sendToRenderer('import-graph', {
				path: result.filePaths[0],
			});
		}
	}

	private sendToRenderer(channel: string, data?: unknown) {
		if (this.mainWindow) {
			this.mainWindow.webContents.send(channel, data);
		}
	}
}

// Initialize AIDE application
const aide = new AideApplication();
aide.initialize().catch(console.error);
