/**
 * Test setup file for AIDE Core extension tests
 */

// Mock vscode module before importing anything else
jest.mock('vscode', () => {
	return {
		workspace: {
			workspaceFolders: [
				{
					uri: {
						fsPath: '/mock/workspace'
					}
				}
			]
		},
		window: {
			showInformationMessage: jest.fn(),
			showErrorMessage: jest.fn(),
			showWarningMessage: jest.fn(),
			createOutputChannel: jest.fn(() => ({
				appendLine: jest.fn(),
				append: jest.fn(),
				clear: jest.fn(),
				show: jest.fn(),
				hide: jest.fn(),
				dispose: jest.fn()
			}))
		},
		commands: {
			registerCommand: jest.fn(),
			executeCommand: jest.fn()
		},
		ExtensionContext: class {
			subscriptions = [];
			workspaceState = {
				get: jest.fn(),
				update: jest.fn(),
				keys: jest.fn(() => [])
			};
			globalState = {
				get: jest.fn(),
				update: jest.fn(),
				keys: jest.fn(() => [])
			};
			extensionPath = '/mock/extension';
			asAbsolutePath = jest.fn((relativePath: string) => `/mock/extension/${relativePath}`);
		}
	};
});
