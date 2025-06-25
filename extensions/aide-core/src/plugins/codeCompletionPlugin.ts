import * as vscode from 'vscode';

/**
 * Code Completion Plugin for AIDE
 * Provides intelligent code completion using AI models
 */
export class CodeCompletionPlugin {
	readonly id = 'aide.codeCompletion';
	readonly name = 'AIDE Code Completion';
	readonly version = '1.0.0';
	readonly description = 'Provides intelligent code completion using AI models';

	private completionProvider: vscode.Disposable | undefined;

	async activate(context: vscode.ExtensionContext): Promise<void> {
		// Register completion provider for multiple languages
		this.completionProvider = vscode.languages.registerCompletionItemProvider(
			[
				{ scheme: 'file', language: 'typescript' },
				{ scheme: 'file', language: 'javascript' },
				{ scheme: 'file', language: 'python' },
				{ scheme: 'file', language: 'java' },
				{ scheme: 'file', language: 'csharp' },
			],
			new AICompletionProvider(),
			'.', // Trigger on dot
			'(' // Trigger on opening parenthesis
		);

		context.subscriptions.push(this.completionProvider);
	}

	async deactivate(): Promise<void> {
		if (this.completionProvider) {
			this.completionProvider.dispose();
		}
	}
}

class AICompletionProvider implements vscode.CompletionItemProvider {
	async provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken,
		context: vscode.CompletionContext
	): Promise<vscode.CompletionItem[]> {
		const line = document.lineAt(position.line);
		const linePrefix = line.text.substr(0, position.character);

		// Get context around the cursor
		const contextRange = new vscode.Range(
			Math.max(0, position.line - 10),
			0,
			Math.min(document.lineCount - 1, position.line + 5),
			0
		);
		const contextText = document.getText(contextRange);

		// Generate AI-powered completions
		const completions = await this.generateCompletions(
			linePrefix,
			contextText,
			document.languageId
		);

		return completions;
	}

	private async generateCompletions(
		linePrefix: string,
		context: string,
		language: string
	): Promise<vscode.CompletionItem[]> {
		const completions: vscode.CompletionItem[] = [];

		// Function completion
		if (
			linePrefix.includes('function ') ||
			linePrefix.includes('const ') ||
			linePrefix.includes('let ')
		) {
			const functionCompletion = new vscode.CompletionItem(
				'function template',
				vscode.CompletionItemKind.Function
			);
			functionCompletion.insertText = new vscode.SnippetString(
				'function ${1:functionName}(${2:params}) {\n\t${3:// implementation}\n\treturn ${4:result};\n}'
			);
			functionCompletion.documentation = new vscode.MarkdownString(
				'AI-generated function template'
			);
			completions.push(functionCompletion);
		}

		// Class completion
		if (linePrefix.includes('class ')) {
			const classCompletion = new vscode.CompletionItem(
				'class template',
				vscode.CompletionItemKind.Class
			);
			classCompletion.insertText = new vscode.SnippetString(
				'class ${1:ClassName} {\n\tconstructor(${2:params}) {\n\t\t${3:// initialization}\n\t}\n\n\t${4:// methods}\n}'
			);
			classCompletion.documentation = new vscode.MarkdownString('AI-generated class template');
			completions.push(classCompletion);
		}

		// Import completion
		if (linePrefix.includes('import ') || linePrefix.includes('from ')) {
			const importCompletion = new vscode.CompletionItem(
				'import statement',
				vscode.CompletionItemKind.Module
			);
			importCompletion.insertText = new vscode.SnippetString(
				"import { ${1:items} } from '${2:module}';"
			);
			importCompletion.documentation = new vscode.MarkdownString('AI-suggested import');
			completions.push(importCompletion);
		}

		// Error handling completion
		if (linePrefix.includes('try') || linePrefix.includes('catch')) {
			const errorHandlingCompletion = new vscode.CompletionItem(
				'try-catch block',
				vscode.CompletionItemKind.Snippet
			);
			errorHandlingCompletion.insertText = new vscode.SnippetString(
				"try {\n\t${1:// code that may throw}\n} catch (${2:error}) {\n\t${3:// error handling}\n\tconsole.error('${4:Error message}:', ${2:error});\n}"
			);
			errorHandlingCompletion.documentation = new vscode.MarkdownString(
				'AI-generated error handling'
			);
			completions.push(errorHandlingCompletion);
		}

		// Language-specific completions
		switch (language) {
			case 'typescript':
			case 'javascript':
				completions.push(...this.getJavaScriptCompletions(linePrefix));
				break;
			case 'python':
				completions.push(...this.getPythonCompletions(linePrefix));
				break;
			case 'java':
				completions.push(...this.getJavaCompletions(linePrefix));
				break;
		}

		return completions;
	}

	private getJavaScriptCompletions(linePrefix: string): vscode.CompletionItem[] {
		const completions: vscode.CompletionItem[] = [];

		// Async/await completion
		if (linePrefix.includes('async') || linePrefix.includes('await')) {
			const asyncCompletion = new vscode.CompletionItem(
				'async function',
				vscode.CompletionItemKind.Function
			);
			asyncCompletion.insertText = new vscode.SnippetString(
				"async function ${1:functionName}(${2:params}) {\n\ttry {\n\t\tconst ${3:result} = await ${4:asyncOperation};\n\t\treturn ${3:result};\n\t} catch (error) {\n\t\tconsole.error('Error in ${1:functionName}:', error);\n\t\tthrow error;\n\t}\n}"
			);
			completions.push(asyncCompletion);
		}

		return completions;
	}

	private getPythonCompletions(linePrefix: string): vscode.CompletionItem[] {
		const completions: vscode.CompletionItem[] = [];

		// Python function completion
		if (linePrefix.includes('def ')) {
			const pythonFunctionCompletion = new vscode.CompletionItem(
				'python function',
				vscode.CompletionItemKind.Function
			);
			pythonFunctionCompletion.insertText = new vscode.SnippetString(
				'def ${1:function_name}(${2:params}):\n\t"""${3:Description}\n\t\n\tArgs:\n\t\t${4:param_description}\n\t\n\tReturns:\n\t\t${5:return_description}\n\t"""\n\t${6:# implementation}\n\treturn ${7:result}'
			);
			completions.push(pythonFunctionCompletion);
		}

		return completions;
	}

	private getJavaCompletions(linePrefix: string): vscode.CompletionItem[] {
		const completions: vscode.CompletionItem[] = [];

		// Java method completion
		if (linePrefix.includes('public ') || linePrefix.includes('private ')) {
			const javaMethodCompletion = new vscode.CompletionItem(
				'java method',
				vscode.CompletionItemKind.Method
			);
			javaMethodCompletion.insertText = new vscode.SnippetString(
				'${1:public} ${2:returnType} ${3:methodName}(${4:params}) {\n\t${5:// implementation}\n\treturn ${6:result};\n}'
			);
			completions.push(javaMethodCompletion);
		}

		return completions;
	}
}
