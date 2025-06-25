import * as vscode from 'vscode';

/**
 * Refactoring Assistant Plugin for AIDE
 * Provides intelligent code refactoring suggestions and automated transformations
 */
export class RefactoringAssistantPlugin {
	readonly id = 'aide.refactoringAssistant';
	readonly name = 'AIDE Refactoring Assistant';
	readonly version = '1.0.0';
	readonly description =
		'Provides intelligent code refactoring suggestions and automated transformations';

	private refactoringCommands: Map<string, RefactoringCommand> = new Map();

	constructor() {
		this.initializeRefactoringCommands();
	}

	private initializeRefactoringCommands(): void {
		this.refactoringCommands.set('extractMethod', {
			id: 'extractMethod',
			title: 'Extract Method',
			description: 'Extract selected code into a new method',
			languages: ['typescript', 'javascript', 'python', 'java', 'csharp'],
			execute: async (doc, sel) => {
				if (sel instanceof vscode.Selection) {
					return this.extractMethod(doc, sel);
				}
				return { success: false, message: 'Selection required for extract method' };
			},
		});

		this.refactoringCommands.set('extractVariable', {
			id: 'extractVariable',
			title: 'Extract Variable',
			description: 'Extract selected expression into a variable',
			languages: ['typescript', 'javascript', 'python', 'java', 'csharp'],
			execute: async (doc, sel) => {
				if (sel instanceof vscode.Selection) {
					return this.extractVariable(doc, sel);
				}
				return { success: false, message: 'Selection required for extract variable' };
			},
		});

		this.refactoringCommands.set('renameSymbol', {
			id: 'renameSymbol',
			title: 'Rename Symbol',
			description: 'Rename symbol and update all references',
			languages: ['typescript', 'javascript', 'python', 'java', 'csharp'],
			execute: async (doc, pos) => {
				if (pos instanceof vscode.Position) {
					return this.renameSymbol(doc, pos);
				}
				return this.renameSymbol(doc, pos.active);
			},
		});

		this.refactoringCommands.set('inlineMethod', {
			id: 'inlineMethod',
			title: 'Inline Method',
			description: 'Replace method calls with method body',
			languages: ['typescript', 'javascript', 'python', 'java'],
			execute: async (doc, pos) => {
				if (pos instanceof vscode.Position) {
					return this.inlineMethod(doc, pos);
				}
				return this.inlineMethod(doc, pos.active);
			},
		});

		this.refactoringCommands.set('moveClass', {
			id: 'moveClass',
			title: 'Move Class',
			description: 'Move class to a different file or namespace',
			languages: ['typescript', 'javascript', 'java', 'csharp'],
			execute: async (doc, pos) => {
				if (pos instanceof vscode.Position) {
					return this.moveClass(doc, pos);
				}
				return this.moveClass(doc, pos.active);
			},
		});
	}

	/**
	 * Extract selected code into a new method
	 */
	async extractMethod(
		document: vscode.TextDocument,
		selection: vscode.Selection
	): Promise<RefactoringResult> {
		const selectedText = document.getText(selection);
		const language = document.languageId;

		if (!selectedText.trim()) {
			return {
				success: false,
				message: 'No code selected for extraction',
			};
		}

		// Analyze the selected code
		const analysis = this.analyzeCodeForExtraction(selectedText, language);
		if (!analysis.canExtract) {
			return {
				success: false,
				message: analysis.reason || 'Cannot extract the selected code',
			};
		}

		// Generate method name suggestion
		const methodName = await this.suggestMethodName(selectedText, language);

		// Extract parameters and return type
		const { parameters, returnType } = this.extractParametersAndReturn(selectedText, language);

		// Generate the new method
		const newMethod = this.generateMethod(
			methodName,
			parameters,
			returnType,
			selectedText,
			language
		);

		// Generate method call
		const methodCall = this.generateMethodCall(methodName, parameters, language);

		return {
			success: true,
			changes: [
				{
					type: 'replace',
					range: selection,
					newText: methodCall,
				},
				{
					type: 'insert',
					position: this.findInsertionPoint(document, selection),
					newText: newMethod,
				},
			],
			message: `Successfully extracted method: ${methodName}`,
		};
	}

	/**
	 * Extract selected expression into a variable
	 */
	async extractVariable(
		document: vscode.TextDocument,
		selection: vscode.Selection
	): Promise<RefactoringResult> {
		const selectedText = document.getText(selection);
		const language = document.languageId;

		if (!selectedText.trim()) {
			return {
				success: false,
				message: 'No expression selected for extraction',
			};
		}

		// Suggest variable name
		const variableName = await this.suggestVariableName(selectedText, language);

		// Determine variable type
		const variableType = this.inferType(selectedText, language);

		// Generate variable declaration
		const variableDeclaration = this.generateVariableDeclaration(
			variableName,
			variableType,
			selectedText,
			language
		);

		// Find insertion point for the variable declaration
		const insertionPoint = this.findVariableInsertionPoint(document, selection);

		return {
			success: true,
			changes: [
				{
					type: 'insert',
					position: insertionPoint,
					newText: variableDeclaration + '\n',
				},
				{
					type: 'replace',
					range: selection,
					newText: variableName,
				},
			],
			message: `Successfully extracted variable: ${variableName}`,
		};
	}

	/**
	 * Rename symbol and update all references
	 */
	async renameSymbol(
		document: vscode.TextDocument,
		position: vscode.Position
	): Promise<RefactoringResult> {
		// Get symbol at position
		const wordRange = document.getWordRangeAtPosition(position);
		if (!wordRange) {
			return {
				success: false,
				message: 'No symbol found at cursor position',
			};
		}

		const currentName = document.getText(wordRange);

		// Prompt for new name
		const newName = await vscode.window.showInputBox({
			prompt: `Rename '${currentName}' to:`,
			value: currentName,
			validateInput: input => {
				if (!input || input.trim().length === 0) {
					return 'Name cannot be empty';
				}
				if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(input)) {
					return 'Invalid identifier name';
				}
				return null;
			},
		});

		if (!newName || newName === currentName) {
			return {
				success: false,
				message: 'Rename operation cancelled',
			};
		}

		// Find all references
		const references = await this.findAllReferences(document, position, currentName);

		const changes: RefactoringChange[] = references.map(ref => ({
			type: 'replace',
			range: ref.range,
			newText: newName,
		}));

		return {
			success: true,
			changes,
			message: `Successfully renamed '${currentName}' to '${newName}' (${changes.length} references updated)`,
		};
	}

	/**
	 * Inline method - replace method calls with method body
	 */
	async inlineMethod(
		document: vscode.TextDocument,
		position: vscode.Position
	): Promise<RefactoringResult> {
		// This is a simplified implementation
		return {
			success: false,
			message: 'Inline method refactoring is not yet implemented',
		};
	}

	/**
	 * Move class to a different file
	 */
	async moveClass(
		document: vscode.TextDocument,
		position: vscode.Position
	): Promise<RefactoringResult> {
		// This is a simplified implementation
		return {
			success: false,
			message: 'Move class refactoring is not yet implemented',
		};
	}

	private analyzeCodeForExtraction(code: string, language: string): ExtractionAnalysis {
		// Basic analysis - can be extended
		if (code.trim().length < 10) {
			return {
				canExtract: false,
				reason: 'Selected code is too short to extract',
			};
		}

		// Check for incomplete statements
		const openBraces = (code.match(/\{/g) || []).length;
		const closeBraces = (code.match(/\}/g) || []).length;

		if (openBraces !== closeBraces) {
			return {
				canExtract: false,
				reason: 'Selected code contains incomplete statements',
			};
		}

		return {
			canExtract: true,
		};
	}

	private async suggestMethodName(code: string, language: string): Promise<string> {
		// Simple heuristic-based method name suggestion
		const keywords = code
			.toLowerCase()
			.match(/\b(get|set|find|create|delete|update|calculate|process|handle|validate)\w*/g);

		if (keywords && keywords.length > 0) {
			return this.toCamelCase(keywords[0]);
		}

		// Default to extracted method
		return 'extractedMethod';
	}

	private async suggestVariableName(expression: string, language: string): Promise<string> {
		// Simple heuristic-based variable name suggestion
		if (expression.includes('.length')) {
			return 'length';
		}
		if (expression.includes('.count')) {
			return 'count';
		}
		if (expression.includes('new ')) {
			const match = expression.match(/new\s+(\w+)/);
			if (match) {
				return this.toCamelCase(match[1]);
			}
		}

		return 'extractedValue';
	}

	private extractParametersAndReturn(
		code: string,
		language: string
	): { parameters: Parameter[]; returnType: string } {
		// Simplified parameter extraction
		const parameters: Parameter[] = [];
		const returnType = 'void'; // Default for now

		return { parameters, returnType };
	}

	private generateMethod(
		name: string,
		parameters: Parameter[],
		returnType: string,
		body: string,
		language: string
	): string {
		switch (language) {
			case 'typescript':
			case 'javascript':
				const paramList = parameters.map(p => `${p.name}: ${p.type}`).join(', ');
				return `\n\tprivate ${name}(${paramList}): ${returnType} {\n\t\t${body.replace(/\n/g, '\n\t\t')}\n\t}\n`;

			case 'python':
				const pythonParams = parameters.map(p => p.name).join(', ');
				return `\n\tdef ${name}(self${pythonParams ? ', ' + pythonParams : ''}):\n\t\t${body.replace(/\n/g, '\n\t\t')}\n`;

			default:
				return `\n\t// Generated method for ${language}\n\t${body}\n`;
		}
	}

	private generateMethodCall(name: string, parameters: Parameter[], language: string): string {
		const args = parameters.map(p => p.name).join(', ');
		return `this.${name}(${args})`;
	}

	private generateVariableDeclaration(
		name: string,
		type: string,
		value: string,
		language: string
	): string {
		switch (language) {
			case 'typescript':
				return `\t\tconst ${name}: ${type} = ${value};`;
			case 'javascript':
				return `\t\tconst ${name} = ${value};`;
			case 'python':
				return `\t\t${name} = ${value}`;
			case 'java':
			case 'csharp':
				return `\t\t${type} ${name} = ${value};`;
			default:
				return `\t\t${name} = ${value};`;
		}
	}

	private findInsertionPoint(
		document: vscode.TextDocument,
		selection: vscode.Selection
	): vscode.Position {
		// Find the end of the current function/class to insert the new method
		let line = selection.end.line;
		while (line < document.lineCount - 1) {
			const lineText = document.lineAt(line).text;
			if (lineText.trim() === '}' && lineText.indexOf('}') < 4) {
				return new vscode.Position(line, 0);
			}
			line++;
		}
		return new vscode.Position(document.lineCount, 0);
	}

	private findVariableInsertionPoint(
		document: vscode.TextDocument,
		selection: vscode.Selection
	): vscode.Position {
		// Insert at the beginning of the current line
		return new vscode.Position(selection.start.line, 0);
	}

	private async findAllReferences(
		document: vscode.TextDocument,
		position: vscode.Position,
		symbolName: string
	): Promise<SymbolReference[]> {
		const references: SymbolReference[] = [];
		const text = document.getText();
		const regex = new RegExp(`\\b${symbolName}\\b`, 'g');

		let match;
		while ((match = regex.exec(text)) !== null) {
			const startPos = document.positionAt(match.index);
			const endPos = document.positionAt(match.index + symbolName.length);
			references.push({
				range: new vscode.Range(startPos, endPos),
				uri: document.uri,
			});
		}

		return references;
	}

	private inferType(expression: string, language: string): string {
		// Simple type inference
		if (expression.includes('new ')) {
			const match = expression.match(/new\s+(\w+)/);
			if (match) {
				return match[1];
			}
		}

		if (expression.includes('.length') || expression.includes('.count')) {
			return 'number';
		}

		if (expression.startsWith('"') || expression.startsWith("'")) {
			return 'string';
		}

		if (/^\d+$/.test(expression)) {
			return 'number';
		}

		if (expression === 'true' || expression === 'false') {
			return 'boolean';
		}

		return language === 'typescript' ? 'any' : 'auto';
	}

	private toCamelCase(str: string): string {
		return str.charAt(0).toLowerCase() + str.slice(1);
	}
}

export interface RefactoringCommand {
	id: string;
	title: string;
	description: string;
	languages: string[];
	execute: (
		document: vscode.TextDocument,
		selectionOrPosition: vscode.Selection | vscode.Position
	) => Promise<RefactoringResult>;
}

export interface RefactoringResult {
	success: boolean;
	message: string;
	changes?: RefactoringChange[];
}

export interface RefactoringChange {
	type: 'insert' | 'replace' | 'delete';
	range?: vscode.Range;
	position?: vscode.Position;
	newText: string;
}

export interface Parameter {
	name: string;
	type: string;
}

export interface ExtractionAnalysis {
	canExtract: boolean;
	reason?: string;
}

export interface SymbolReference {
	range: vscode.Range;
	uri: vscode.Uri;
}
