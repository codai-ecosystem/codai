import { BaseAgent } from './baseAgent';
import { AgentResponse } from './agentManager';
import { IMemoryGraph } from '../interfaces/IMemoryGraph';
import * as vscode from 'vscode';
import { createLogger } from '../services/loggerService';

/**
 * Code Agent for AIDE Extension
 * Specializes in code generation, refactoring, and code analysis
 */

export interface CodeGenerationRequest {
	type: 'function' | 'class' | 'component' | 'module' | 'test';
	description: string;
	language: string;
	framework?: string;
	context?: {
		existingCode?: string;
		dependencies?: string[];
		patterns?: string[];
	};
}

export interface RefactoringRequest {
	code: string;
	operation: 'extract-function' | 'rename' | 'optimize' | 'modernize';
	language: string;
	options?: Record<string, any>;
}

export interface CodeAnalysisResult {
	complexity: number;
	maintainability: number;
	issues: Array<{
		type: 'error' | 'warning' | 'suggestion';
		message: string;
		line?: number;
		severity: number;
	}>;
	suggestions: string[];
	dependencies: string[];
}

export class CodeAgent extends BaseAgent {
	private status: string = 'ready';
	private readonly logger = createLogger('CodeAgent');
	constructor(memoryGraph: IMemoryGraph, aiService: any) {
		super(memoryGraph, 'code-agent', aiService);
	}
	/**
	 * Process a message and return a response (required by BaseAgent)
	 */
	async process(message: string, intentId: string): Promise<AgentResponse> {
		try {
			// Parse the message to determine the code operation
			if (message.includes('generate') || message.includes('create')) {
				const request: CodeGenerationRequest = {
					type: 'function',
					description: message,
					language: this.extractLanguage(message) || 'typescript'
				};
				const code = await this.generateCode(request);
				return {
					agent: this.agentType,
					message: 'Code generated successfully',
					metadata: { code, language: request.language }
				};
			} else if (message.includes('refactor') || message.includes('improve')) {
				const request: RefactoringRequest = {
					code: message,
					operation: 'optimize',
					language: this.extractLanguage(message) || 'typescript'
				};
				const refactoredCode = await this.refactorCode(request);
				return {
					agent: this.agentType,
					message: 'Code refactored successfully',
					metadata: { code: refactoredCode }
				};
			} else if (message.includes('analyze') || message.includes('review')) {
				const analysis = await this.analyzeCode(message, this.extractLanguage(message) || 'typescript');
				return {
					agent: this.agentType,
					message: 'Code analysis completed',
					metadata: analysis
				};
			}

			return {
				agent: this.agentType,
				message: 'Unknown code operation requested'
			};
		} catch (error) {
			return {
				agent: this.agentType,
				message: `Code processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			};
		}
	}

	/**
	 * Get current status (required by BaseAgent)
	 */
	async getStatus(): Promise<Record<string, any>> {
		return {
			status: this.status,
			type: 'code-agent',
			capabilities: ['generation', 'refactoring', 'analysis', 'testing', 'conversion']
		};
	}

	/**
	 * Extract language from message
	 */
	private extractLanguage(message: string): string | null {
		const languages = ['typescript', 'javascript', 'python', 'java', 'csharp', 'cpp', 'go', 'rust'];
		for (const lang of languages) {
			if (message.toLowerCase().includes(lang)) {
				return lang;
			}
		}
		return null;
	}
	/**
	 * Generate code based on natural language description
	 */
	async generateCode(request: CodeGenerationRequest): Promise<string> {
		try {
			this.status = 'Generating code...';

			// Analyze the request
			const analysis = await this.analyzeCodeRequest(request);

			// Generate appropriate code structure
			const code = await this.createCodeStructure(request, analysis);

			// Apply language-specific formatting
			const formattedCode = await this.formatCode(code, request.language);

			this.status = 'Code generation completed';
			return formattedCode;

		} catch (error) {
			this.status = 'Error in code generation';
			throw error;
		}
	}

	/**
	 * Refactor existing code
	 */
	async refactorCode(request: RefactoringRequest): Promise<string> {
		try {
			this.status = 'Refactoring code...';

			let refactoredCode = request.code;

			switch (request.operation) {
				case 'extract-function':
					refactoredCode = await this.extractFunction(request);
					break;
				case 'rename':
					refactoredCode = await this.renameIdentifiers(request);
					break;
				case 'optimize':
					refactoredCode = await this.optimizeCode(request);
					break;
				case 'modernize':
					refactoredCode = await this.modernizeCode(request);
					break;
			}

			this.status = 'Code refactoring completed';
			return refactoredCode;

		} catch (error) {
			this.status = 'Error in code refactoring';
			throw error;
		}
	}

	/**
	 * Analyze code quality and complexity
	 */
	async analyzeCode(code: string, language: string): Promise<CodeAnalysisResult> {
		try {
			this.status = 'Analyzing code...';

			const result: CodeAnalysisResult = {
				complexity: this.calculateComplexity(code, language),
				maintainability: this.calculateMaintainability(code, language),
				issues: await this.findCodeIssues(code, language),
				suggestions: await this.generateSuggestions(code, language),
				dependencies: this.extractDependencies(code, language)
			};

			this.status = 'Code analysis completed';
			return result;

		} catch (error) {
			this.status = 'Error in code analysis';
			throw error;
		}
	}

	/**
	 * Generate unit tests for given code
	 */
	async generateTests(code: string, language: string, framework?: string): Promise<string> {
		try {
			this.status = 'Generating tests...';

			// Parse code to identify testable functions/methods
			const testableElements = this.identifyTestableElements(code, language);

			// Generate test cases
			const testCases = await this.createTestCases(testableElements, language, framework);

			// Format test file
			const testCode = await this.formatTestFile(testCases, language, framework);

			this.status = 'Test generation completed';
			return testCode;

		} catch (error) {
			this.status = 'Error in test generation';
			throw error;
		}
	}

	/**
	 * Convert code between languages
	 */
	async convertLanguage(code: string, fromLang: string, toLang: string): Promise<string> {
		try {
			this.status = `Converting from ${fromLang} to ${toLang}...`;

			// Parse source code structure
			const ast = await this.parseCodeStructure(code, fromLang);

			// Map language constructs
			const mappedStructure = await this.mapLanguageConstructs(ast, fromLang, toLang);

			// Generate target language code
			const convertedCode = await this.generateTargetCode(mappedStructure, toLang);

			this.status = 'Language conversion completed';
			return convertedCode;

		} catch (error) {
			this.status = 'Error in language conversion';
			throw error;
		}
	}

	/**
	 * Analyze code request to understand requirements
	 */
	private async analyzeCodeRequest(request: CodeGenerationRequest): Promise<any> {
		return {
			patterns: this.identifyPatterns(request.description),
			structure: this.determineStructure(request.type, request.language),
			dependencies: request.context?.dependencies || [],
			complexity: this.estimateComplexity(request.description)
		};
	}

	/**
	 * Create code structure based on request and analysis
	 */
	private async createCodeStructure(request: CodeGenerationRequest, analysis: any): Promise<string> {
		const templates = this.getLanguageTemplates(request.language);
		const template = templates[request.type] || templates.default;

		// Process template with request context
		return this.processTemplate(template, {
			description: request.description,
			language: request.language,
			framework: request.framework,
			...analysis
		});
	}

	/**
	 * Format code according to language conventions
	 */
	private async formatCode(code: string, language: string): Promise<string> {
		// Apply language-specific formatting rules
		const formatters = {
			typescript: this.formatTypeScript,
			javascript: this.formatJavaScript,
			python: this.formatPython,
			java: this.formatJava,
			csharp: this.formatCSharp
		};

		const formatter = formatters[language as keyof typeof formatters];
		return formatter ? formatter.call(this, code) : code;
	}

	/**
	 * Extract function from code block
	 */
	private async extractFunction(request: RefactoringRequest): Promise<string> {
		const { code, options } = request;
		const selection = options?.selection;

		if (!selection) {
			throw new Error('Selection required for function extraction');
		}

		// Identify selected code block
		const selectedCode = this.extractSelectedCode(code, selection);

		// Generate function name and parameters
		const functionName = options?.functionName || 'extractedFunction';
		const parameters = this.identifyParameters(selectedCode, code);

		// Create function
		const functionCode = this.createFunction(functionName, parameters, selectedCode, request.language);

		// Replace selected code with function call
		const updatedCode = this.replaceWithFunctionCall(code, selection, functionName, parameters);

		return `${functionCode}\n\n${updatedCode}`;
	}

	/**
	 * Rename identifiers in code
	 */
	private async renameIdentifiers(request: RefactoringRequest): Promise<string> {
		const { code, options } = request;
		const { oldName, newName } = options || {};

		if (!oldName || !newName) {
			throw new Error('Old and new names required for renaming');
		}

		// Use regex to replace identifiers (basic implementation)
		const identifierRegex = new RegExp(`\\b${oldName}\\b`, 'g');
		return code.replace(identifierRegex, newName);
	}

	/**
	 * Optimize code for performance and readability
	 */
	private async optimizeCode(request: RefactoringRequest): Promise<string> {
		let { code } = request;
		const { language } = request;

		// Apply language-specific optimizations
		switch (language) {
			case 'javascript':
			case 'typescript':
				code = this.optimizeJavaScript(code);
				break;
			case 'python':
				code = this.optimizePython(code);
				break;
		}

		return code;
	}

	/**
	 * Modernize code to use latest language features
	 */
	private async modernizeCode(request: RefactoringRequest): Promise<string> {
		let { code } = request;
		const { language } = request;

		// Apply modernization patterns
		switch (language) {
			case 'javascript':
				code = this.modernizeJavaScript(code);
				break;
			case 'typescript':
				code = this.modernizeTypeScript(code);
				break;
			case 'python':
				code = this.modernizePython(code);
				break;
		}

		return code;
	}

	/**
	 * Calculate cyclomatic complexity
	 */
	private calculateComplexity(code: string, language: string): number {
		// Simple complexity calculation based on control structures
		const controlKeywords = {
			javascript: ['if', 'else', 'while', 'for', 'switch', 'case', 'try', 'catch'],
			typescript: ['if', 'else', 'while', 'for', 'switch', 'case', 'try', 'catch'],
			python: ['if', 'elif', 'else', 'while', 'for', 'try', 'except', 'with'],
			java: ['if', 'else', 'while', 'for', 'switch', 'case', 'try', 'catch']
		};

		const keywords = controlKeywords[language as keyof typeof controlKeywords] || controlKeywords.javascript;
		let complexity = 1; // Base complexity

		for (const keyword of keywords) {
			const regex = new RegExp(`\\b${keyword}\\b`, 'g');
			const matches = code.match(regex);
			if (matches) {
				complexity += matches.length;
			}
		}

		return complexity;
	}

	/**
	 * Calculate maintainability index
	 */
	private calculateMaintainability(code: string, language: string): number {
		const lines = code.split('\n').length;
		const complexity = this.calculateComplexity(code, language);
		const commentRatio = this.calculateCommentRatio(code, language);

		// Simplified maintainability calculation
		const maintainability = Math.max(0, 171 - 5.2 * Math.log(lines) - 0.23 * complexity + 16.2 * Math.log(lines) + 50 * commentRatio);

		return Math.min(100, maintainability);
	}

	/**
	 * Find code issues and potential problems
	 */
	private async findCodeIssues(code: string, language: string): Promise<Array<any>> {
		const issues: Array<any> = [];

		// Basic issue detection
		if (code.includes('console.log') && (language === 'javascript' || language === 'typescript')) {
			issues.push({
				type: 'warning',
				message: 'Remove console.log statements before production',
				severity: 2
			});
		}

		if (code.includes('TODO') || code.includes('FIXME')) {
			issues.push({
				type: 'suggestion',
				message: 'Address TODO/FIXME comments',
				severity: 1
			});
		}

		// Check for long functions
		const functionLengths = this.analyzeFunctionLengths(code, language);
		functionLengths.forEach((length, index) => {
			if (length > 50) {
				issues.push({
					type: 'warning',
					message: `Function is too long (${length} lines). Consider breaking it down.`,
					severity: 2
				});
			}
		});

		return issues;
	}

	/**
	 * Generate improvement suggestions
	 */
	private async generateSuggestions(code: string, language: string): Promise<string[]> {
		const suggestions: string[] = [];

		// Add type annotations for TypeScript
		if (language === 'typescript' && !code.includes(': ')) {
			suggestions.push('Consider adding type annotations for better type safety');
		}

		// Suggest async/await over callbacks
		if (code.includes('.then(') && (language === 'javascript' || language === 'typescript')) {
			suggestions.push('Consider using async/await instead of Promise chains');
		}

		// Suggest const over let/var
		if (code.includes('var ') || code.includes('let ')) {
			suggestions.push('Use const for variables that are not reassigned');
		}

		return suggestions;
	}

	/**
	 * Extract dependencies from code
	 */
	private extractDependencies(code: string, language: string): string[] {
		const dependencies: string[] = [];

		// Extract imports/requires based on language
		const patterns = {
			javascript: [/import .+ from ['"`]([^'"`]+)['"`]/g, /require\(['"`]([^'"`]+)['"`]\)/g],
			typescript: [/import .+ from ['"`]([^'"`]+)['"`]/g, /require\(['"`]([^'"`]+)['"`]\)/g],
			python: [/import ([^\s]+)/g, /from ([^\s]+) import/g]
		};

		const langPatterns = patterns[language as keyof typeof patterns] || patterns.javascript;

		for (const pattern of langPatterns) {
			let match;
			while ((match = pattern.exec(code)) !== null) {
				dependencies.push(match[1]);
			}
		}

		return [...new Set(dependencies)]; // Remove duplicates
	}

	// Language-specific formatting methods
	private formatTypeScript(code: string): string {
		// Basic TypeScript formatting
		return code
			.replace(/;\s*}/g, ';\n}')
			.replace(/{\s*/g, ' {\n  ')
			.replace(/}\s*/g, '\n}\n');
	}

	private formatJavaScript(code: string): string {
		// Basic JavaScript formatting
		return this.formatTypeScript(code); // Same as TypeScript for now
	}

	private formatPython(code: string): string {
		// Basic Python formatting
		return code
			.replace(/:\s*/g, ':\n    ')
			.replace(/\n\s*\n\s*\n/g, '\n\n'); // Remove multiple blank lines
	}

	private formatJava(code: string): string {
		// Basic Java formatting
		return this.formatTypeScript(code); // Similar to TypeScript
	}

	private formatCSharp(code: string): string {
		// Basic C# formatting
		return this.formatTypeScript(code); // Similar to TypeScript
	}

	// Helper methods for analysis
	private identifyPatterns(description: string): string[] {
		const patterns: string[] = [];

		if (description.toLowerCase().includes('crud')) patterns.push('crud');
		if (description.toLowerCase().includes('api')) patterns.push('api');
		if (description.toLowerCase().includes('component')) patterns.push('component');
		if (description.toLowerCase().includes('service')) patterns.push('service');
		if (description.toLowerCase().includes('util')) patterns.push('utility');

		return patterns;
	}

	private determineStructure(type: string, language: string): any {
		const structures = {
			function: { hasReturn: true, hasParameters: true },
			class: { hasConstructor: true, hasMethods: true, hasProperties: true },
			component: { hasProps: true, hasState: true, hasRender: true },
			module: { hasExports: true, hasImports: true }
		};

		return structures[type as keyof typeof structures] || {};
	}

	private estimateComplexity(description: string): number {
		const complexityKeywords = ['loop', 'condition', 'async', 'promise', 'callback', 'event'];
		let complexity = 1;

		for (const keyword of complexityKeywords) {
			if (description.toLowerCase().includes(keyword)) {
				complexity++;
			}
		}

		return complexity;
	}

	private getLanguageTemplates(language: string): Record<string, string> {
		const templates: Record<string, Record<string, string>> = {
			typescript: {
				function: `/**\n * {{description}}\n */\nfunction {{name}}({{parameters}}): {{returnType}} {\n  {{body}}\n}`,
				class: `/**\n * {{description}}\n */\nclass {{name}} {\n  {{properties}}\n\n  constructor({{constructorParams}}) {\n    {{constructorBody}}\n  }\n\n  {{methods}}\n}`,
				component: `import React from 'react';\n\ninterface {{name}}Props {\n  {{props}}\n}\n\nconst {{name}}: React.FC<{{name}}Props> = ({{propParams}}) => {\n  {{body}}\n\n  return (\n    {{jsx}}\n  );\n};\n\nexport default {{name}};`
			},
			javascript: {
				function: `/**\n * {{description}}\n */\nfunction {{name}}({{parameters}}) {\n  {{body}}\n}`,
				class: `/**\n * {{description}}\n */\nclass {{name}} {\n  constructor({{constructorParams}}) {\n    {{constructorBody}}\n  }\n\n  {{methods}}\n}`
			}
		};

		return templates[language] || templates.typescript;
	}

	private processTemplate(template: string, context: any): string {
		let processed = template;

		for (const [key, value] of Object.entries(context)) {
			const placeholder = new RegExp(`{{${key}}}`, 'g');
			processed = processed.replace(placeholder, String(value));
		}

		return processed;
	}

	private calculateCommentRatio(code: string, language: string): number {
		const lines = code.split('\n');
		let commentLines = 0;

		const commentPatterns = {
			javascript: [/^\s*\/\//, /^\s*\/\*/, /\*\/\s*$/],
			typescript: [/^\s*\/\//, /^\s*\/\*/, /\*\/\s*$/],
			python: [/^\s*#/],
			java: [/^\s*\/\//, /^\s*\/\*/, /\*\/\s*$/]
		};

		const patterns = commentPatterns[language as keyof typeof commentPatterns] || commentPatterns.javascript;

		for (const line of lines) {
			for (const pattern of patterns) {
				if (pattern.test(line)) {
					commentLines++;
					break;
				}
			}
		}

		return lines.length > 0 ? commentLines / lines.length : 0;
	}

	private analyzeFunctionLengths(code: string, language: string): number[] {
		// Simplified function length analysis
		const functionRegex = /function\s+\w+\s*\([^)]*\)\s*{([^{}]*{[^{}]*})*[^{}]*}/g;
		const lengths: number[] = [];
		let match;

		while ((match = functionRegex.exec(code)) !== null) {
			const functionBody = match[0];
			const lines = functionBody.split('\n').length;
			lengths.push(lines);
		}

		return lengths;
	}

	// Additional helper methods for refactoring
	private extractSelectedCode(code: string, selection: any): string {
		const lines = code.split('\n');
		return lines.slice(selection.start, selection.end + 1).join('\n');
	}

	private identifyParameters(selectedCode: string, fullCode: string): string[] {
		// Simplified parameter identification
		const variableRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
		const variables = new Set<string>();
		let match;

		while ((match = variableRegex.exec(selectedCode)) !== null) {
			variables.add(match[1]);
		}

		return Array.from(variables);
	}

	private createFunction(name: string, parameters: string[], body: string, language: string): string {
		const paramStr = parameters.join(', ');

		switch (language) {
			case 'typescript':
				return `function ${name}(${paramStr}): any {\n${body}\n}`;
			case 'javascript':
				return `function ${name}(${paramStr}) {\n${body}\n}`;
			default:
				return `function ${name}(${paramStr}) {\n${body}\n}`;
		}
	}

	private replaceWithFunctionCall(code: string, selection: any, functionName: string, parameters: string[]): string {
		const lines = code.split('\n');
		const paramStr = parameters.join(', ');
		const functionCall = `${functionName}(${paramStr});`;

		lines.splice(selection.start, selection.end - selection.start + 1, functionCall);
		return lines.join('\n');
	}

	// Optimization methods
	private optimizeJavaScript(code: string): string {
		return code
			.replace(/var\s+/g, 'const ') // Replace var with const
			.replace(/function\s*\(/g, '(') // Convert to arrow functions where appropriate
			.replace(/\s+console\.log\([^)]*\);\s*/g, ''); // Remove console.log statements
	}

	private optimizePython(code: string): string {
		return code
			.replace(/\bprint\([^)]*\)\s*/g, '') // Remove print statements
			.replace(/\s+#.*$/gm, ''); // Remove comments
	}

	// Modernization methods
	private modernizeJavaScript(code: string): string {
		return code
			.replace(/var\s+/g, 'const ')
			.replace(/function\s+(\w+)\s*\(/g, 'const $1 = (')
			.replace(/\)\s*{/g, ') => {');
	}

	private modernizeTypeScript(code: string): string {
		return this.modernizeJavaScript(code)
			.replace(/:\s*any\b/g, ': unknown'); // Replace any with unknown
	}

	private modernizePython(code: string): string {
		return code
			.replace(/print\s+([^(])/g, 'print($1)') // Add parentheses to print
			.replace(/xrange\(/g, 'range('); // Python 3 range
	}

	// Additional helper methods for test generation
	private identifyTestableElements(code: string, language: string): any[] {
		// Simple implementation to identify functions/methods
		const elements: any[] = [];

		if (language === 'typescript' || language === 'javascript') {
			const functionRegex = /function\s+(\w+)\s*\([^)]*\)/g;
			let match;
			while ((match = functionRegex.exec(code)) !== null) {
				elements.push({
					type: 'function',
					name: match[1],
					code: match[0]
				});
			}
		}

		return elements;
	}

	private async createTestCases(elements: any[], language: string, framework?: string): Promise<any[]> {
		// Generate basic test cases for each element
		return elements.map(element => ({
			name: `test ${element.name}`,
			code: `// Test for ${element.name}\n// TODO: Implement test logic`
		}));
	}

	private async formatTestFile(testCases: any[], language: string, framework?: string): Promise<string> {
		const header = framework === 'jest'
			? "import { describe, test, expect } from '@jest/globals';\n\n"
			: "// Test file\n\n";

		const tests = testCases.map(test => `${test.name}() {\n  ${test.code}\n}`).join('\n\n');

		return header + tests;
	}

	// Helper methods for language conversion
	private async parseCodeStructure(code: string, language: string): Promise<any> {
		// Simplified AST representation
		return {
			type: 'program',
			body: code.split('\n').map(line => ({ type: 'line', content: line }))
		};
	}

	private async mapLanguageConstructs(ast: any, fromLang: string, toLang: string): Promise<any> {
		// Basic language mapping
		const mappings: Record<string, Record<string, string>> = {
			'javascript->python': {
				'function': 'def',
				'var': '',
				'let': '',
				'const': '',
				'{': ':',
				'}': ''
			},
			'python->javascript': {
				'def': 'function',
				':': '{',
				'    ': '  '
			}
		};

		const mapping = mappings[`${fromLang}->${toLang}`] || {};

		return {
			...ast,
			mapping: mapping
		};
	}

	private async generateTargetCode(structure: any, language: string): Promise<string> {
		// Basic code generation
		const lines = structure.body.map((item: any) => item.content);
		return lines.join('\n');
	}
}
