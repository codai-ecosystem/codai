/**
 * AIDE System Integration Test
 * Tests the complete AIDE plugin architecture
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { EventEmitter } from 'events';

// Mock VS Code API
const mockVscode = {
	commands: {
		registerCommand: jest.fn(),
		executeCommand: jest.fn()
	},
	window: {
		showInformationMessage: jest.fn(),
		showErrorMessage: jest.fn(),
		createOutputChannel: jest.fn(() => ({
			appendLine: jest.fn(),
			show: jest.fn(),
			dispose: jest.fn()
		}))
	},
	workspace: {
		getConfiguration: jest.fn(() => ({
			get: jest.fn(),
			update: jest.fn()
		})),
		workspaceFolders: []
	},
	ExtensionContext: jest.fn(),
	Disposable: jest.fn(() => ({ dispose: jest.fn() })),
	Uri: {
		file: jest.fn((path: string) => ({ fsPath: path }))
	}
};

// Mock modules
jest.mock('vscode', () => mockVscode, { virtual: true });

// Import our AIDE modules after mocking
import { AIDECore } from '../../extensions/aide-core/src/aideCore';
import { PluginManager } from '../../extensions/aide-core/src/plugins/pluginManager';
import { ConversationService } from '../../extensions/aide-core/src/services/conversationService';
import { MemoryService } from '../../extensions/aide-core/src/services/memoryService';
import { ProjectService } from '../../extensions/aide-core/src/services/projectService';
import { CodeCompletionAgent } from '../../extensions/aide-core/src/agents/codeCompletionAgent';
import { CodeAnalysisAgent } from '../../extensions/aide-core/src/agents/codeAnalysisAgent';
import { ConversationAgent } from '../../extensions/aide-core/src/agents/conversationAgent';

describe('AIDE System Integration Tests', () => {
	let aideCore: AIDECore;
	let pluginManager: PluginManager;
	let mockContext: any;

	beforeEach(() => {
		// Create mock extension context
		mockContext = {
			subscriptions: [],
			extensionPath: '/mock/path',
			globalState: {
				get: jest.fn(),
				update: jest.fn()
			},
			workspaceState: {
				get: jest.fn(),
				update: jest.fn()
			}
		};

		// Reset all mocks
		jest.clearAllMocks();
	});

	afterEach(() => {
		if (aideCore) {
			aideCore.dispose();
		}
	});

	describe('Core System Initialization', () => {
		it('should initialize AIDE core successfully', async () => {
			aideCore = new AIDECore();
			await aideCore.activate(mockContext);

			expect(aideCore).toBeDefined();
			expect(aideCore.isActive()).toBe(true);
		});

		it('should register all required commands', async () => {
			aideCore = new AIDECore();
			await aideCore.activate(mockContext);

			// Verify essential commands are registered
			const registeredCommands = mockVscode.commands.registerCommand.mock.calls.map(call => call[0]);

			expect(registeredCommands).toContain('aide.askQuestion');
			expect(registeredCommands).toContain('aide.showConversation');
			expect(registeredCommands).toContain('aide.analyzeCode');
			expect(registeredCommands).toContain('aide.memoryViewer');
		});
	});

	describe('Plugin System', () => {
		beforeEach(async () => {
			aideCore = new AIDECore();
			await aideCore.activate(mockContext);
			pluginManager = aideCore.getPluginManager();
		});

		it('should load core plugins automatically', () => {
			const plugins = pluginManager.getActivePlugins();

			// Should have at least conversation and analysis plugins
			expect(plugins.length).toBeGreaterThan(0);

			const pluginNames = plugins.map(p => p.name);
			expect(pluginNames).toContain('ConversationPlugin');
			expect(pluginNames).toContain('CodeAnalysisPlugin');
		});

		it('should allow plugin registration and activation', async () => {
			const testPlugin = {
				id: 'test-plugin',
				name: 'Test Plugin',
				version: '1.0.0',
				activate: jest.fn(),
				deactivate: jest.fn(),
				onEvent: jest.fn()
			};

			await pluginManager.registerPlugin(testPlugin);
			const isActive = pluginManager.isPluginActive('test-plugin');

			expect(isActive).toBe(true);
			expect(testPlugin.activate).toHaveBeenCalled();
		});

		it('should handle plugin lifecycle correctly', async () => {
			const testPlugin = {
				id: 'lifecycle-test',
				name: 'Lifecycle Test Plugin',
				version: '1.0.0',
				activate: jest.fn(),
				deactivate: jest.fn(),
				onEvent: jest.fn()
			};

			// Register and activate
			await pluginManager.registerPlugin(testPlugin);
			expect(testPlugin.activate).toHaveBeenCalled();

			// Deactivate
			await pluginManager.deactivatePlugin('lifecycle-test');
			expect(testPlugin.deactivate).toHaveBeenCalled();
			expect(pluginManager.isPluginActive('lifecycle-test')).toBe(false);
		});
	});

	describe('Service Integration', () => {
		let conversationService: ConversationService;
		let memoryService: MemoryService;
		let projectService: ProjectService;

		beforeEach(async () => {
			aideCore = new AIDECore();
			await aideCore.activate(mockContext);

			conversationService = aideCore.getConversationService();
			memoryService = aideCore.getMemoryService();
			projectService = aideCore.getProjectService();
		});

		it('should initialize all core services', () => {
			expect(conversationService).toBeDefined();
			expect(memoryService).toBeDefined();
			expect(projectService).toBeDefined();
		});

		it('should handle conversation flow', async () => {
			const conversationId = await conversationService.startConversation();
			expect(conversationId).toBeDefined();

			const message = await conversationService.addMessage(conversationId, {
				content: 'Test message',
				role: 'user',
				timestamp: new Date()
			});

			expect(message).toBeDefined();
			expect(message.content).toBe('Test message');

			const conversation = conversationService.getConversation(conversationId);
			expect(conversation).toBeDefined();
			expect(conversation!.messages.length).toBe(1);
		});

		it('should manage memory correctly', async () => {
			const testData = { key: 'value', timestamp: new Date().toISOString() };

			await memoryService.store('test-key', testData);
			const retrieved = await memoryService.retrieve('test-key');

			expect(retrieved).toEqual(testData);
		});

		it('should analyze project structure', async () => {
			// Mock a simple project structure
			const mockFiles = [
				'/src/index.ts',
				'/src/utils.ts',
				'/package.json',
				'/README.md'
			];

			// Mock file system operations
			const originalAnalyze = projectService.analyzeProject;
			projectService.analyzeProject = jest.fn().mockResolvedValue({
				files: mockFiles,
				languages: ['typescript'],
				frameworks: ['node'],
				dependencies: ['jest', 'typescript']
			});

			const analysis = await projectService.analyzeProject('/mock/project');

			expect(analysis).toBeDefined();
			expect(analysis.files).toEqual(mockFiles);
			expect(analysis.languages).toContain('typescript');
		});
	});

	describe('Agent System', () => {
		let codeCompletionAgent: CodeCompletionAgent;
		let codeAnalysisAgent: CodeAnalysisAgent;
		let conversationAgent: ConversationAgent;

		beforeEach(async () => {
			aideCore = new AIDECore();
			await aideCore.activate(mockContext);

			codeCompletionAgent = new CodeCompletionAgent();
			codeAnalysisAgent = new CodeAnalysisAgent();
			conversationAgent = new ConversationAgent();
		});

		it('should provide code completions', async () => {
			const mockCompletion = {
				text: 'console.log("Hello World");',
				range: { start: 0, end: 0 },
				confidence: 0.9
			};

			// Mock the completion generation
			const originalGenerate = codeCompletionAgent.generateCompletion;
			codeCompletionAgent.generateCompletion = jest.fn().mockResolvedValue(mockCompletion);

			const completion = await codeCompletionAgent.generateCompletion('console.', {
				language: 'typescript',
				context: 'function test() {'
			});

			expect(completion).toBeDefined();
			expect(completion.text).toBe('console.log("Hello World");');
		});

		it('should analyze code for issues', async () => {
			const mockAnalysis = {
				issues: [
					{
						type: 'warning',
						message: 'Unused variable',
						line: 5,
						column: 10
					}
				],
				suggestions: [
					{
						type: 'optimization',
						message: 'Consider using const instead of let',
						line: 3
					}
				],
				metrics: {
					complexity: 2,
					maintainability: 85
				}
			};

			const originalAnalyze = codeAnalysisAgent.analyzeCode;
			codeAnalysisAgent.analyzeCode = jest.fn().mockResolvedValue(mockAnalysis);

			const analysis = await codeAnalysisAgent.analyzeCode(`
				function test() {
					let unused = 5;
					console.log("Hello");
				}
			`, { language: 'typescript' });

			expect(analysis).toBeDefined();
			expect(analysis.issues.length).toBe(1);
			expect(analysis.suggestions.length).toBe(1);
		});

		it('should handle conversational interactions', async () => {
			const mockResponse = {
				content: 'I can help you with that code issue.',
				confidence: 0.95,
				suggestions: ['Check variable names', 'Review function structure']
			};

			const originalProcess = conversationAgent.processMessage;
			conversationAgent.processMessage = jest.fn().mockResolvedValue(mockResponse);

			const response = await conversationAgent.processMessage(
				'How can I fix this TypeScript error?',
				{ language: 'typescript', codeContext: 'const x: string = 5;' }
			);

			expect(response).toBeDefined();
			expect(response.content).toContain('help you');
		});
	});

	describe('Event System', () => {
		beforeEach(async () => {
			aideCore = new AIDECore();
			await aideCore.activate(mockContext);
		});

		it('should emit and handle events correctly', (done) => {
			const eventManager = aideCore.getEventManager();

			eventManager.on('test-event', (data) => {
				expect(data).toEqual({ message: 'test' });
				done();
			});

			eventManager.emit('test-event', { message: 'test' });
		});

		it('should allow event subscription and unsubscription', () => {
			const eventManager = aideCore.getEventManager();
			const handler = jest.fn();

			// Subscribe
			eventManager.on('subscription-test', handler);
			eventManager.emit('subscription-test', { data: 'test' });
			expect(handler).toHaveBeenCalledWith({ data: 'test' });

			// Unsubscribe
			handler.mockClear();
			eventManager.off('subscription-test', handler);
			eventManager.emit('subscription-test', { data: 'test2' });
			expect(handler).not.toHaveBeenCalled();
		});
	});

	describe('Error Handling', () => {
		beforeEach(async () => {
			aideCore = new AIDECore();
			await aideCore.activate(mockContext);
		});

		it('should handle service initialization errors gracefully', async () => {
			// Mock a service that fails to initialize
			const failingService = {
				initialize: jest.fn().mockRejectedValue(new Error('Service failed')),
				dispose: jest.fn()
			};

			// This should not throw
			expect(() => {
				aideCore.registerService('failing-service', failingService);
			}).not.toThrow();
		});

		it('should handle plugin loading errors', async () => {
			const failingPlugin = {
				id: 'failing-plugin',
				name: 'Failing Plugin',
				version: '1.0.0',
				activate: jest.fn().mockRejectedValue(new Error('Plugin failed')),
				deactivate: jest.fn(),
				onEvent: jest.fn()
			};

			const pluginManager = aideCore.getPluginManager();

			// Should handle the error gracefully
			await expect(pluginManager.registerPlugin(failingPlugin)).rejects.toThrow('Plugin failed');
			expect(pluginManager.isPluginActive('failing-plugin')).toBe(false);
		});
	});

	describe('Configuration Management', () => {
		beforeEach(async () => {
			aideCore = new AIDECore();
			await aideCore.activate(mockContext);
		});

		it('should load and apply configuration correctly', () => {
			const config = aideCore.getConfiguration();

			expect(config).toBeDefined();
			expect(typeof config.get).toBe('function');
			expect(typeof config.update).toBe('function');
		});

		it('should handle configuration changes', () => {
			mockVscode.workspace.getConfiguration.mockReturnValue({
				get: jest.fn((key) => {
					if (key === 'aide.enableCodeCompletion') return true;
					if (key === 'aide.maxMemoryEntries') return 1000;
					return undefined;
				}),
				update: jest.fn()
			});

			const config = aideCore.getConfiguration();

			expect(config.get('aide.enableCodeCompletion')).toBe(true);
			expect(config.get('aide.maxMemoryEntries')).toBe(1000);
		});
	});

	describe('Performance and Resource Management', () => {
		beforeEach(async () => {
			aideCore = new AIDECore();
			await aideCore.activate(mockContext);
		});

		it('should dispose resources properly', () => {
			const disposeSpy = jest.fn();
			mockContext.subscriptions.push({ dispose: disposeSpy });

			aideCore.dispose();

			expect(disposeSpy).toHaveBeenCalled();
		});

		it('should handle concurrent operations', async () => {
			const conversationService = aideCore.getConversationService();

			// Start multiple conversations concurrently
			const promises = Array(5).fill(0).map(() =>
				conversationService.startConversation()
			);

			const conversationIds = await Promise.all(promises);

			expect(conversationIds.length).toBe(5);
			expect(new Set(conversationIds).size).toBe(5); // All should be unique
		});
	});
});
