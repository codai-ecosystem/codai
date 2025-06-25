import * as vscode from 'vscode';
import { SimpleTestAgent } from './agents/simpleTestAgent';

export function activate(context: vscode.ExtensionContext) {
	console.log('Test Simple Plugin activated!');

	// Register the agent
	const agent = new SimpleTestAgent();

	// Register a test command
	const command = vscode.commands.registerCommand('test-simple-plugin.sayHello', () => {
		vscode.window.showInformationMessage('Hello from Test Simple Plugin!');
	});

	context.subscriptions.push(command);
}

export function deactivate() {
	console.log('Test Simple Plugin deactivated');
}
