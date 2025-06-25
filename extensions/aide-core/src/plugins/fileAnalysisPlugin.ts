import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../services/loggerService';

/**
 * File Analysis Plugin for AIDE
 * Provides comprehensive file analysis and insights
 */
export class FileAnalysisPlugin {
	readonly id = 'aide.fileAnalysis';
	readonly name = 'AIDE File Analysis';
	readonly version = '1.0.0';
	readonly description = 'Provides comprehensive file analysis and insights';

	private diagnosticCollection: vscode.DiagnosticCollection;
	private readonly logger = createLogger('FileAnalysisPlugin');

	constructor() {
		this.diagnosticCollection = vscode.languages.createDiagnosticCollection('aide-file-analysis');
	}

	/**
	 * Analyze a file for complexity, maintainability, and quality metrics
	 */
	async analyzeFile(document: vscode.TextDocument): Promise<FileAnalysisResult> {
		const content = document.getText();
		const lines = content.split('\n');

		const metrics = {
			totalLines: lines.length,
			codeLines: this.countCodeLines(lines),
			commentLines: this.countCommentLines(lines),
			blankLines: this.countBlankLines(lines),
			complexity: this.calculateComplexity(content),
			maintainabilityIndex: this.calculateMaintainabilityIndex(content),
			duplicateLines: this.findDuplicateLines(lines),
			functionCount: this.countFunctions(content),
			classCount: this.countClasses(content),
			importCount: this.countImports(content),
		};

		const issues = this.detectIssues(content, document.languageId);
		const suggestions = this.generateSuggestions(metrics, issues);

		return {
			filePath: document.fileName,
			metrics,
			issues,
			suggestions,
			analysisDate: new Date(),
		};
	}

	private countCodeLines(lines: string[]): number {
		return lines.filter(line => {
			const trimmed = line.trim();
			return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('/*');
		}).length;
	}

	private countCommentLines(lines: string[]): number {
		return lines.filter(line => {
			const trimmed = line.trim();
			return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
		}).length;
	}

	private countBlankLines(lines: string[]): number {
		return lines.filter(line => line.trim().length === 0).length;
	}

	private calculateComplexity(content: string): number {
		// Cyclomatic complexity calculation
		const keywords = [
			'if',
			'else',
			'while',
			'for',
			'switch',
			'case',
			'catch',
			'try',
			'&&',
			'||',
			'?',
		];
		let complexity = 1; // Base complexity

		keywords.forEach(keyword => {
			const regex = new RegExp(`\\b${keyword}\\b`, 'g');
			const matches = content.match(regex);
			if (matches) {
				complexity += matches.length;
			}
		});

		return complexity;
	}

	private calculateMaintainabilityIndex(content: string): number {
		// Simplified maintainability index calculation
		const loc = content.split('\n').length;
		const complexity = this.calculateComplexity(content);
		const halsteadVolume = this.calculateHalsteadVolume(content);

		// MI = 171 - 5.2 * ln(HV) - 0.23 * CC - 16.2 * ln(LOC)
		const mi = 171 - 5.2 * Math.log(halsteadVolume) - 0.23 * complexity - 16.2 * Math.log(loc);
		return Math.max(0, Math.min(100, mi));
	}

	private calculateHalsteadVolume(content: string): number {
		// Simplified Halstead volume calculation
		const operators = content.match(/[+\-*/=<>!&|?:;,(){}[\]]/g) || [];
		const operands = content.match(/\b\w+\b/g) || [];

		const uniqueOperators = new Set(operators).size;
		const uniqueOperands = new Set(operands).size;
		const totalOperators = operators.length;
		const totalOperands = operands.length;

		const vocabulary = uniqueOperators + uniqueOperands;
		const length = totalOperators + totalOperands;

		return length * Math.log2(vocabulary);
	}

	private findDuplicateLines(lines: string[]): number {
		const lineMap = new Map<string, number>();
		let duplicates = 0;

		lines.forEach(line => {
			const trimmed = line.trim();
			if (trimmed.length > 0) {
				const count = lineMap.get(trimmed) || 0;
				lineMap.set(trimmed, count + 1);
				if (count === 1) {
					duplicates += 2; // Count both the original and the duplicate
				} else if (count > 1) {
					duplicates += 1;
				}
			}
		});

		return duplicates;
	}

	private countFunctions(content: string): number {
		const functionRegex =
			/\b(?:function|def|fn|func)\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:\([^)]*\)\s*=>|function)/g;
		return (content.match(functionRegex) || []).length;
	}

	private countClasses(content: string): number {
		const classRegex = /\b(?:class|interface|struct)\s+\w+/g;
		return (content.match(classRegex) || []).length;
	}

	private countImports(content: string): number {
		const importRegex = /\b(?:import|require|from|include|using)\s/g;
		return (content.match(importRegex) || []).length;
	}

	private detectIssues(content: string, languageId: string): AnalysisIssue[] {
		const issues: AnalysisIssue[] = [];

		// Long lines
		const lines = content.split('\n');
		lines.forEach((line, index) => {
			if (line.length > 120) {
				issues.push({
					type: 'style',
					severity: 'warning',
					message: `Line ${index + 1} is too long (${line.length} characters)`,
					line: index + 1,
					column: 120,
				});
			}
		});

		// Deeply nested code
		let currentDepth = 0;
		let maxDepth = 0;
		for (let i = 0; i < content.length; i++) {
			if (content[i] === '{') {
				currentDepth++;
				maxDepth = Math.max(maxDepth, currentDepth);
			} else if (content[i] === '}') {
				currentDepth--;
			}
		}

		if (maxDepth > 5) {
			issues.push({
				type: 'complexity',
				severity: 'warning',
				message: `Code is deeply nested (depth: ${maxDepth}). Consider refactoring.`,
				line: 1,
				column: 1,
			});
		}

		// TODO comments
		const todoRegex = /\/\/\s*TODO|\/\*\s*TODO|\#\s*TODO/gi;
		let match;
		while ((match = todoRegex.exec(content)) !== null) {
			const lineNumber = content.substring(0, match.index).split('\n').length;
			issues.push({
				type: 'todo',
				severity: 'info',
				message: 'TODO comment found',
				line: lineNumber,
				column: match.index,
			});
		}

		return issues;
	}

	private generateSuggestions(metrics: FileMetrics, issues: AnalysisIssue[]): string[] {
		const suggestions: string[] = [];

		if (metrics.complexity > 20) {
			suggestions.push(
				'Consider breaking down complex functions into smaller, more manageable pieces'
			);
		}

		if (metrics.maintainabilityIndex < 50) {
			suggestions.push(
				'This file may be difficult to maintain. Consider refactoring for better readability'
			);
		}

		if (metrics.duplicateLines > 10) {
			suggestions.push(
				'Consider extracting common code into reusable functions to reduce duplication'
			);
		}

		if (metrics.totalLines > 500) {
			suggestions.push('Large file detected. Consider splitting into multiple smaller files');
		}

		if (metrics.commentLines / metrics.codeLines < 0.1) {
			suggestions.push('Consider adding more comments to improve code documentation');
		}

		return suggestions;
	}

	/**
	 * Generate a comprehensive analysis report for a workspace
	 */
	async generateWorkspaceReport(): Promise<WorkspaceAnalysisReport> {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			throw new Error('No workspace folder found');
		}

		const allFiles: FileAnalysisResult[] = [];
		const fileExtensions = new Set<string>();
		let totalLinesOfCode = 0;

		for (const folder of workspaceFolders) {
			const files = await this.findSourceFiles(folder.uri.fsPath);

			for (const filePath of files) {
				try {
					const document = await vscode.workspace.openTextDocument(filePath);
					const analysis = await this.analyzeFile(document);
					allFiles.push(analysis);

					const ext = path.extname(filePath);
					fileExtensions.add(ext);
					totalLinesOfCode += analysis.metrics.codeLines;
				} catch (error) {
					this.logger.error(`Error analyzing file ${filePath}:`, error);
				}
			}
		}

		return {
			timestamp: new Date(),
			totalFiles: allFiles.length,
			totalLinesOfCode,
			languages: Array.from(fileExtensions),
			averageComplexity:
				allFiles.reduce((sum, f) => sum + f.metrics.complexity, 0) / allFiles.length,
			averageMaintainability:
				allFiles.reduce((sum, f) => sum + f.metrics.maintainabilityIndex, 0) / allFiles.length,
			filesWithIssues: allFiles.filter(f => f.issues.length > 0).length,
			topComplexFiles: allFiles
				.sort((a, b) => b.metrics.complexity - a.metrics.complexity)
				.slice(0, 10),
			fileDetails: allFiles,
		};
	}

	private async findSourceFiles(rootPath: string): Promise<string[]> {
		const sourceExtensions = [
			'.ts',
			'.js',
			'.py',
			'.java',
			'.cpp',
			'.c',
			'.cs',
			'.go',
			'.rs',
			'.php',
		];
		const files: string[] = [];

		const searchPattern = `**/*{${sourceExtensions.join(',')}}`;
		const foundFiles = await vscode.workspace.findFiles(searchPattern, '**/node_modules/**');

		return foundFiles.map(uri => uri.fsPath);
	}

	dispose(): void {
		this.diagnosticCollection.dispose();
	}
}

export interface FileMetrics {
	totalLines: number;
	codeLines: number;
	commentLines: number;
	blankLines: number;
	complexity: number;
	maintainabilityIndex: number;
	duplicateLines: number;
	functionCount: number;
	classCount: number;
	importCount: number;
}

export interface AnalysisIssue {
	type: 'style' | 'complexity' | 'duplication' | 'todo' | 'security' | 'performance';
	severity: 'error' | 'warning' | 'info';
	message: string;
	line: number;
	column: number;
}

export interface FileAnalysisResult {
	filePath: string;
	metrics: FileMetrics;
	issues: AnalysisIssue[];
	suggestions: string[];
	analysisDate: Date;
}

export interface WorkspaceAnalysisReport {
	timestamp: Date;
	totalFiles: number;
	totalLinesOfCode: number;
	languages: string[];
	averageComplexity: number;
	averageMaintainability: number;
	filesWithIssues: number;
	topComplexFiles: FileAnalysisResult[];
	fileDetails: FileAnalysisResult[];
}
