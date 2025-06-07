/**
 * Mock VS Code module for testing outside of VS Code environment
 */

// Mock workspace
const workspace = {
	workspaceFolders: [
		{
			uri: { fsPath: 'e:\\GitHub\\AIDE\\test-workspace' },
			name: 'test-workspace',
			index: 0
		}
	],
	getConfiguration: (section) => ({
		get: (key, defaultValue) => defaultValue,
		has: (key) => false,
		inspect: (key) => undefined,
		update: (key, value, target) => Promise.resolve()
	}),
	createFileSystemWatcher: (pattern) => ({
		onDidCreate: () => ({ dispose: () => { } }),
		onDidChange: () => ({ dispose: () => { } }),
		onDidDelete: () => ({ dispose: () => { } }),
		dispose: () => { }
	}),
	onDidChangeWorkspaceFolders: () => ({ dispose: () => { } }),
	onDidChangeConfiguration: () => ({ dispose: () => { } }),
	asRelativePath: (path) => path,
	findFiles: () => Promise.resolve([]),
	fs: {
		readFile: () => Promise.resolve(Buffer.from('')),
		writeFile: () => Promise.resolve(),
		createDirectory: () => Promise.resolve(),
		delete: () => Promise.resolve(),
		stat: () => Promise.resolve({
			type: 1, // File
			ctime: Date.now(),
			mtime: Date.now(),
			size: 0
		})
	}
};

// Mock window
const window = {
	showInformationMessage: (message, ...items) => {
		console.log('INFO:', message);
		return Promise.resolve(items[0]);
	},
	showWarningMessage: (message, ...items) => {
		console.log('WARNING:', message);
		return Promise.resolve(items[0]);
	},
	showErrorMessage: (message, ...items) => {
		console.log('ERROR:', message);
		return Promise.resolve(items[0]);
	},
	showQuickPick: (items) => Promise.resolve(items[0]),
	showInputBox: (options) => Promise.resolve('test-input'),
	showOpenDialog: (options) => Promise.resolve([{ fsPath: 'test-file.txt' }]),
	showSaveDialog: (options) => Promise.resolve({ fsPath: 'test-save.txt' }),
	createOutputChannel: (name) => ({
		appendLine: (line) => console.log(`[${name}]`, line),
		append: (text) => console.log(`[${name}]`, text),
		show: () => { },
		hide: () => { },
		dispose: () => { },
		clear: () => { }
	}),
	createTerminal: (options) => ({
		name: options?.name || 'terminal',
		sendText: (text) => console.log('TERMINAL:', text),
		show: () => { },
		hide: () => { },
		dispose: () => { }
	}),
	withProgress: (options, task) => {
		console.log('PROGRESS:', options.title);
		return task({
			report: (progress) => console.log('PROGRESS UPDATE:', progress.message)
		});
	}
};

// Mock commands
const commands = {
	registerCommand: (command, callback) => {
		console.log('REGISTERED COMMAND:', command);
		return { dispose: () => { } };
	},
	executeCommand: (command, ...args) => {
		console.log('EXECUTE COMMAND:', command, args);
		return Promise.resolve();
	},
	getCommands: () => Promise.resolve([])
};

// Mock extensions
const extensions = {
	getExtension: (id) => undefined,
	all: [],
	onDidChange: () => ({ dispose: () => { } })
};

// Mock languages
const languages = {
	createDiagnosticCollection: (name) => ({
		set: (uri, diagnostics) => { },
		delete: (uri) => { },
		clear: () => { },
		dispose: () => { }
	}),
	getDiagnostics: () => [],
	onDidChangeDiagnostics: () => ({ dispose: () => { } })
};

// Mock Uri
const Uri = {
	file: (path) => ({ fsPath: path, scheme: 'file', toString: () => `file://${path}` }),
	parse: (uri) => ({ fsPath: uri.replace('file://', ''), scheme: 'file' })
};

// Mock Range and Position
const Position = class {
	constructor(line, character) {
		this.line = line;
		this.character = character;
	}
};

const Range = class {
	constructor(start, end) {
		this.start = start;
		this.end = end;
	}
};

// Mock StatusBarAlignment
const StatusBarAlignment = {
	Left: 1,
	Right: 2
};

// Mock ExtensionContext
const createMockContext = () => ({
	subscriptions: [],
	workspaceState: {
		get: (key, defaultValue) => defaultValue,
		update: (key, value) => Promise.resolve(),
		keys: () => []
	},
	globalState: {
		get: (key, defaultValue) => defaultValue,
		update: (key, value) => Promise.resolve(),
		keys: () => [],
		setKeysForSync: (keys) => { }
	},
	extensionPath: 'e:\\GitHub\\AIDE\\extensions\\aide-core',
	extensionUri: Uri.file('e:\\GitHub\\AIDE\\extensions\\aide-core'),
	storagePath: 'e:\\GitHub\\AIDE\\extensions\\aide-core\\storage',
	globalStoragePath: 'e:\\GitHub\\AIDE\\extensions\\aide-core\\global-storage',
	logPath: 'e:\\GitHub\\AIDE\\extensions\\aide-core\\logs',
	extensionMode: 1, // Development
	secrets: {
		get: (key) => Promise.resolve(undefined),
		store: (key, value) => Promise.resolve(),
		delete: (key) => Promise.resolve()
	}
});

// Export the mock VS Code API
module.exports = {
	workspace,
	window,
	commands,
	extensions,
	languages,
	Uri,
	Position,
	Range,
	StatusBarAlignment,
	createMockContext,

	// Mock enums and constants
	DiagnosticSeverity: {
		Error: 0,
		Warning: 1,
		Information: 2,
		Hint: 3
	},

	CompletionItemKind: {
		Text: 0,
		Method: 1,
		Function: 2,
		Constructor: 3,
		Field: 4,
		Variable: 5,
		Class: 6,
		Interface: 7,
		Module: 8,
		Property: 9,
		Unit: 10,
		Value: 11,
		Enum: 12,
		Keyword: 13,
		Snippet: 14,
		Color: 15,
		File: 16,
		Reference: 17
	},

	SymbolKind: {
		File: 0,
		Module: 1,
		Namespace: 2,
		Package: 3,
		Class: 4,
		Method: 5,
		Property: 6,
		Field: 7,
		Constructor: 8,
		Enum: 9,
		Interface: 10,
		Function: 11,
		Variable: 12,
		Constant: 13,
		String: 14,
		Number: 15,
		Boolean: 16,
		Array: 17
	}
};
