import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

export interface LogEntry {
	timestamp: Date;
	level: LogLevel;
	category: string;
	message: string;
	data?: any;
}

/**
 * Centralized logging service for AIDE Core
 * Provides structured logging with levels, categories, and optional file output
 */
export class LoggerService {
	private static instance: LoggerService;
	private logLevel: LogLevel = LogLevel.INFO;
	private enableFileLogging: boolean = false;
	private logFile?: string;
	private outputChannel: vscode.OutputChannel;

	private constructor() {
		this.outputChannel = vscode.window.createOutputChannel('AIDE Core');
		this.loadConfiguration();
	}

	public static getInstance(): LoggerService {
		if (!LoggerService.instance) {
			LoggerService.instance = new LoggerService();
		}
		return LoggerService.instance;
	}

	private loadConfiguration(): void {
		const config = vscode.workspace.getConfiguration('aide');
		const logLevelStr = config.get<string>('logging.level', 'info').toLowerCase();

		switch (logLevelStr) {
			case 'debug':
				this.logLevel = LogLevel.DEBUG;
				break;
			case 'info':
				this.logLevel = LogLevel.INFO;
				break;
			case 'warn':
				this.logLevel = LogLevel.WARN;
				break;
			case 'error':
				this.logLevel = LogLevel.ERROR;
				break;
			default:
				this.logLevel = LogLevel.INFO;
		}

		this.enableFileLogging = config.get<boolean>('logging.enableFileOutput', false);

		if (this.enableFileLogging && vscode.workspace.workspaceFolders) {
			const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
			this.logFile = path.join(workspaceRoot, '.aide', 'logs', 'aide-core.log');
		}
	}

	public debug(category: string, message: string, data?: any): void {
		this.log(LogLevel.DEBUG, category, message, data);
	}

	public info(category: string, message: string, data?: any): void {
		this.log(LogLevel.INFO, category, message, data);
	}

	public warn(category: string, message: string, data?: any): void {
		this.log(LogLevel.WARN, category, message, data);
	}

	public error(category: string, message: string, data?: any): void {
		this.log(LogLevel.ERROR, category, message, data);
	}

	private async log(level: LogLevel, category: string, message: string, data?: any): Promise<void> {
		if (level < this.logLevel) {
			return;
		}

		const entry: LogEntry = {
			timestamp: new Date(),
			level,
			category,
			message,
			data,
		};

		// Output to VS Code Output Channel
		const levelStr = this.getLevelString(level);
		const timestamp = entry.timestamp.toISOString();
		const logMessage = `[${timestamp}] [${levelStr}] [${category}] ${message}`;

		this.outputChannel.appendLine(logMessage);
		if (data) {
			this.outputChannel.appendLine(`  Data: ${JSON.stringify(data, null, 2)}`);
		}

		// Show error messages in VS Code UI
		if (level === LogLevel.ERROR) {
			vscode.window.showErrorMessage(`AIDE Error: ${message}`);
		} else if (level === LogLevel.WARN) {
			vscode.window.showWarningMessage(`AIDE Warning: ${message}`);
		}

		// Write to file if enabled
		if (this.enableFileLogging && this.logFile) {
			await this.writeToFile(entry);
		}
	}

	private async writeToFile(entry: LogEntry): Promise<void> {
		if (!this.logFile) return;

		try {
			const logLine = `${entry.timestamp.toISOString()} [${this.getLevelString(entry.level)}] [${entry.category}] ${entry.message}`;
			const dataLine = entry.data ? `\n  Data: ${JSON.stringify(entry.data)}` : '';
			const fullLine = logLine + dataLine + '\n';

			// Ensure directory exists
			const logDir = path.dirname(this.logFile);
			await fs.mkdir(logDir, { recursive: true });

			// Append to log file
			await fs.appendFile(this.logFile, fullLine);
		} catch (error) {
			// Fallback to console if file logging fails - we can't use this.logger.error here as it would cause infinite recursion
			// Using console.error directly as last resort fallback
			console.error('Failed to write to log file:', error);
		}
	}

	private getLevelString(level: LogLevel): string {
		switch (level) {
			case LogLevel.DEBUG:
				return 'DEBUG';
			case LogLevel.INFO:
				return 'INFO';
			case LogLevel.WARN:
				return 'WARN';
			case LogLevel.ERROR:
				return 'ERROR';
			default:
				return 'UNKNOWN';
		}
	}

	public showOutputChannel(): void {
		this.outputChannel.show();
	}

	public dispose(): void {
		this.outputChannel.dispose();
	}
}

// Convenience functions for common logging patterns
export function createLogger(category: string) {
	const logger = LoggerService.getInstance();
	return {
		debug: (message: string, data?: any) => logger.debug(category, message, data),
		info: (message: string, data?: any) => logger.info(category, message, data),
		warn: (message: string, data?: any) => logger.warn(category, message, data),
		error: (message: string, data?: any) => logger.error(category, message, data),
	};
}
