import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from './loggerService';
import { FileSystemError } from '../utils/errorTypes';

/**
 * FileManager class responsible for file system operations
 * Extracted from BuilderAgent to improve maintainability
 */
export class FileManager {
	private readonly logger = createLogger('FileManager');
	private workspaceRoot: string | undefined;

	constructor() {
		this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		this.logger.debug(`FileManager initialized with workspace root: ${this.workspaceRoot}`);
	}

	/**
	 * Create a file with the given path and content
	 * @param filePath Path of the file to create
	 * @param content Content to write to the file
	 * @param overwrite Whether to overwrite existing file
	 */
	public async createFile(filePath: string, content: string, overwrite: boolean = false): Promise<void> {
		try {
			if (!this.workspaceRoot) {
				throw new FileSystemError('No workspace opened');
			}

			const fullPath = path.join(this.workspaceRoot, filePath);
			const directory = path.dirname(fullPath);

			// Create directory if it doesn't exist
			await this.ensureDirectoryExists(directory);

			// Check if file exists and handle based on overwrite flag
			if (fs.existsSync(fullPath) && !overwrite) {
				throw new FileSystemError(`File already exists: ${filePath}`);
			}

			// Write file
			fs.writeFileSync(fullPath, content, 'utf8');
			this.logger.info(`Created file: ${filePath}`);

			return;
		} catch (error) {
			this.logger.error(`Failed to create file ${filePath}:`, error);
			throw new FileSystemError(`Failed to create file ${filePath}: ${error}`);
		}
	}

	/**
	 * Read a file's contents
	 * @param filePath Path of the file to read
	 */
	public async readFile(filePath: string): Promise<string> {
		try {
			if (!this.workspaceRoot) {
				throw new FileSystemError('No workspace opened');
			}

			const fullPath = path.join(this.workspaceRoot, filePath);

			if (!fs.existsSync(fullPath)) {
				throw new FileSystemError(`File does not exist: ${filePath}`);
			}

			return fs.readFileSync(fullPath, 'utf8');
		} catch (error) {
			this.logger.error(`Failed to read file ${filePath}:`, error);
			throw new FileSystemError(`Failed to read file ${filePath}: ${error}`);
		}
	}

	/**
	 * Delete a file
	 * @param filePath Path of the file to delete
	 */
	public async deleteFile(filePath: string): Promise<void> {
		try {
			if (!this.workspaceRoot) {
				throw new FileSystemError('No workspace opened');
			}

			const fullPath = path.join(this.workspaceRoot, filePath);

			if (!fs.existsSync(fullPath)) {
				throw new FileSystemError(`File does not exist: ${filePath}`);
			}

			fs.unlinkSync(fullPath);
			this.logger.info(`Deleted file: ${filePath}`);
		} catch (error) {
			this.logger.error(`Failed to delete file ${filePath}:`, error);
			throw new FileSystemError(`Failed to delete file ${filePath}: ${error}`);
		}
	}

	/**
	 * Check if a file exists
	 * @param filePath Path of the file to check
	 */
	public fileExists(filePath: string): boolean {
		if (!this.workspaceRoot) {
			return false;
		}

		const fullPath = path.join(this.workspaceRoot, filePath);
		return fs.existsSync(fullPath);
	}

	/**
	 * Ensure directory exists, create if not
	 * @param directory Directory to check/create
	 */
	private async ensureDirectoryExists(directory: string): Promise<void> {
		try {
			if (!fs.existsSync(directory)) {
				fs.mkdirSync(directory, { recursive: true });
				this.logger.info(`Created directory: ${directory}`);
			}
		} catch (error) {
			this.logger.error(`Failed to create directory ${directory}:`, error);
			throw new FileSystemError(`Failed to create directory ${directory}: ${error}`);
		}
	}
}
