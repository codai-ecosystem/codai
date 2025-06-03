/**
 * Mock implementation of VSCode API for testing
 */
import * as sinon from 'sinon';

export const workspace = {
	workspaceFolders: [
		{
			uri: {
				fsPath: '/mock/workspace'
			}
		}
	]
};

export const window = {
	showInformationMessage: sinon.stub(),
	showErrorMessage: sinon.stub(),
	showWarningMessage: sinon.stub(),
	createOutputChannel: sinon.stub().returns({
		appendLine: sinon.stub(),
		append: sinon.stub(),
		clear: sinon.stub(),
		show: sinon.stub(),
		hide: sinon.stub(),
		dispose: sinon.stub()
	})
};

export const commands = {
	registerCommand: sinon.stub(),
	executeCommand: sinon.stub()
};

export const ExtensionContext = class {
	subscriptions = [];
	workspaceState = {
		get: sinon.stub(),
		update: sinon.stub(),
		keys: sinon.stub().returns([])
	};
	globalState = {
		get: sinon.stub(),
		update: sinon.stub(),
		keys: sinon.stub().returns([])
	};
	extensionPath = '/mock/extension';
	asAbsolutePath = sinon.stub().callsFake((relativePath: string) => `/mock/extension/${relativePath}`);
};
