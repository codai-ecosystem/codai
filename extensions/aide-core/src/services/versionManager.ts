import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as semver from 'semver';
import { createLogger } from './loggerService';

export interface VersionInfo {
	current: string;
	previous: string;
	changeType: 'major' | 'minor' | 'patch';
	changes: ChangeInfo[];
	timestamp: Date;
	buildNumber: number;
}

export interface ChangeInfo {
	type: 'feature' | 'fix' | 'breaking' | 'docs' | 'style' | 'refactor' | 'test' | 'chore';
	scope?: string;
	description: string;
	files: string[];
	author?: string;
	timestamp: Date;
}

export interface UpstreamInfo {
	vscodeVersion: string;
	lastSync: Date;
	compatibilityStatus: 'compatible' | 'needs-review' | 'incompatible';
	pendingUpdates: string[];
}

/**
 * Autonomous Version Management System
 * Handles automatic versioning, changelog generation, and diff tracking
 */
export class VersionManager {
	private versionHistory: VersionInfo[] = [];
	private upstreamInfo: UpstreamInfo | null = null;
	private configPath: string;
	private readonly logger = createLogger('VersionManager');

	constructor() {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		this.configPath = workspaceFolder
			? path.join(workspaceFolder.uri.fsPath, '.aide', 'version.json')
			: '';
		this.loadVersionHistory();
	}

	/**
	 * Load version history from storage
	 */
	private async loadVersionHistory(): Promise<void> {
		try {
			if (!this.configPath) return;

			const configDir = path.dirname(this.configPath);
			await fs.mkdir(configDir, { recursive: true });

			if (await this.fileExists(this.configPath)) {
				const content = await fs.readFile(this.configPath, 'utf8');
				const data = JSON.parse(content);
				this.versionHistory = data.history || [];
				this.upstreamInfo = data.upstream || null;
			}
		} catch (error) {
			this.logger.error('Failed to load version history:', error);
		}
	}

	/**
	 * Save version history to storage
	 */
	private async saveVersionHistory(): Promise<void> {
		try {
			if (!this.configPath) return;

			const data = {
				history: this.versionHistory,
				upstream: this.upstreamInfo,
				lastUpdated: new Date(),
			};

			await fs.writeFile(this.configPath, JSON.stringify(data, null, 2));
		} catch (error) {
			this.logger.error('Failed to save version history:', error);
		}
	}

	/**
	 * Analyze changes and determine version bump type
	 */
	async analyzeChanges(changedFiles: string[]): Promise<'major' | 'minor' | 'patch'> {
		const changes = await this.detectChangeTypes(changedFiles);

		// Check for breaking changes
		if (changes.some(c => c.type === 'breaking')) {
			return 'major';
		}

		// Check for new features
		if (changes.some(c => c.type === 'feature')) {
			return 'minor';
		}

		// Default to patch
		return 'patch';
	}

	/**
	 * Detect types of changes from file modifications
	 */
	private async detectChangeTypes(changedFiles: string[]): Promise<ChangeInfo[]> {
		const changes: ChangeInfo[] = [];

		for (const file of changedFiles) {
			const changeType = this.inferChangeType(file);
			const scope = this.inferScope(file);

			changes.push({
				type: changeType,
				scope,
				description: `Modified ${path.basename(file)}`,
				files: [file],
				timestamp: new Date(),
			});
		}

		return changes;
	}

	/**
	 * Infer change type from file path and content
	 */
	private inferChangeType(filePath: string): ChangeInfo['type'] {
		const fileName = path.basename(filePath).toLowerCase();
		const dirName = path.dirname(filePath).toLowerCase();

		// Test files
		if (fileName.includes('test') || dirName.includes('test')) {
			return 'test';
		}

		// Documentation
		if (fileName.endsWith('.md') || fileName.endsWith('.txt')) {
			return 'docs';
		}

		// Plugin files - likely features
		if (dirName.includes('plugin')) {
			return 'feature';
		}

		// Service files - could be features or fixes
		if (dirName.includes('service')) {
			return 'feature';
		}

		// Package.json changes
		if (fileName === 'package.json') {
			return 'chore';
		}

		// Default to fix
		return 'fix';
	}

	/**
	 * Infer scope from file path
	 */
	private inferScope(filePath: string): string | undefined {
		const parts = filePath.split(path.sep);

		if (parts.includes('plugins')) {
			return 'plugins';
		}
		if (parts.includes('services')) {
			return 'services';
		}
		if (parts.includes('agents')) {
			return 'agents';
		}
		if (parts.includes('ui')) {
			return 'ui';
		}
		if (parts.includes('memory')) {
			return 'memory';
		}

		return undefined;
	}

	/**
	 * Generate new version based on current version and change type
	 */
	async generateNewVersion(changeType: 'major' | 'minor' | 'patch'): Promise<string> {
		const currentVersion = await this.getCurrentVersion();
		return semver.inc(currentVersion, changeType) || currentVersion;
	}

	/**
	 * Get current version from package.json
	 */
	private async getCurrentVersion(): Promise<string> {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) return '0.1.0';

			const packageJsonPath = path.join(workspaceFolder.uri.fsPath, 'package.json');
			const content = await fs.readFile(packageJsonPath, 'utf8');
			const packageJson = JSON.parse(content);

			return packageJson.version || '0.1.0';
		} catch (error) {
			this.logger.error('Failed to get current version:', error);
			return '0.1.0';
		}
	}

	/**
	 * Update version in package.json
	 */
	async updateVersion(newVersion: string): Promise<void> {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) return;

			const packageJsonPath = path.join(workspaceFolder.uri.fsPath, 'package.json');
			const content = await fs.readFile(packageJsonPath, 'utf8');
			const packageJson = JSON.parse(content);

			const previousVersion = packageJson.version;
			packageJson.version = newVersion;

			await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, '\t'));

			// Record version change
			const changes = await this.detectChangeTypes([packageJsonPath]);
			const versionInfo: VersionInfo = {
				current: newVersion,
				previous: previousVersion,
				changeType: this.getChangeType(previousVersion, newVersion),
				changes,
				timestamp: new Date(),
				buildNumber: this.generateBuildNumber(),
			};

			this.versionHistory.push(versionInfo);
			await this.saveVersionHistory();

			this.logger.info(`Version updated from ${previousVersion} to ${newVersion}`);
		} catch (error) {
			this.logger.error('Failed to update version:', error);
		}
	}

	/**
	 * Determine change type between two versions
	 */
	private getChangeType(oldVersion: string, newVersion: string): 'major' | 'minor' | 'patch' {
		const diff = semver.diff(oldVersion, newVersion);
		if (diff === 'major') return 'major';
		if (diff === 'minor') return 'minor';
		return 'patch';
	}

	/**
	 * Generate incremental build number
	 */
	private generateBuildNumber(): number {
		const lastVersion = this.versionHistory[this.versionHistory.length - 1];
		return lastVersion ? lastVersion.buildNumber + 1 : 1;
	}

	/**
	 * Generate changelog from version history
	 */
	async generateChangelog(): Promise<string> {
		let changelog = '# Changelog\n\n';
		changelog += 'All notable changes to the AIDE extension will be documented in this file.\n\n';

		// Sort versions by timestamp (newest first)
		const sortedVersions = [...this.versionHistory].sort(
			(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
		);

		for (const version of sortedVersions) {
			changelog += `## [${version.current}] - ${new Date(version.timestamp).toISOString().split('T')[0]}\n\n`;

			// Group changes by type
			const changesByType = this.groupChangesByType(version.changes);

			for (const [type, changes] of Object.entries(changesByType)) {
				if (changes.length === 0) continue;

				changelog += `### ${this.formatChangeTypeHeader(type)}\n\n`;

				for (const change of changes) {
					const scope = change.scope ? `**${change.scope}**: ` : '';
					changelog += `- ${scope}${change.description}\n`;
				}

				changelog += '\n';
			}
		}

		return changelog;
	}

	/**
	 * Group changes by type
	 */
	private groupChangesByType(changes: ChangeInfo[]): Record<string, ChangeInfo[]> {
		return changes.reduce(
			(groups, change) => {
				const type = change.type;
				if (!groups[type]) {
					groups[type] = [];
				}
				groups[type].push(change);
				return groups;
			},
			{} as Record<string, ChangeInfo[]>
		);
	}
	/**
	 * Format change type for display
	 */
	private formatChangeTypeHeader(type: string): string {
		const headers: Record<string, string> = {
			feature: 'Added',
			fix: 'Fixed',
			breaking: 'BREAKING CHANGES',
			docs: 'Documentation',
			style: 'Style Changes',
			refactor: 'Code Refactoring',
			test: 'Tests',
			chore: 'Maintenance',
		};

		return headers[type] || 'Changed';
	}

	/**
	 * Check for VS Code upstream updates
	 */
	async checkUpstreamUpdates(): Promise<UpstreamInfo> {
		try {
			// This would typically make an API call to check VS Code releases
			// For now, we'll simulate the check
			const currentVSCodeVersion = vscode.version;

			this.upstreamInfo = {
				vscodeVersion: currentVSCodeVersion,
				lastSync: new Date(),
				compatibilityStatus: 'compatible',
				pendingUpdates: [],
			};

			await this.saveVersionHistory();
			return this.upstreamInfo;
		} catch (error) {
			this.logger.error('Failed to check upstream updates:', error);
			return {
				vscodeVersion: vscode.version,
				lastSync: new Date(),
				compatibilityStatus: 'needs-review',
				pendingUpdates: [],
			};
		}
	}

	/**
	 * Get version history
	 */
	getVersionHistory(): VersionInfo[] {
		return [...this.versionHistory];
	}

	/**
	 * Get upstream info
	 */
	getUpstreamInfo(): UpstreamInfo | null {
		return this.upstreamInfo;
	}

	/**
	 * Check if file exists
	 */
	private async fileExists(filePath: string): Promise<boolean> {
		try {
			await fs.access(filePath);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Write changelog to file
	 */
	async writeChangelog(): Promise<void> {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) return;

			const changelogPath = path.join(workspaceFolder.uri.fsPath, 'CHANGELOG.md');
			const changelog = await this.generateChangelog();

			await fs.writeFile(changelogPath, changelog);
			this.logger.info('Changelog written to CHANGELOG.md');
		} catch (error) {
			this.logger.error('Failed to write changelog:', error);
		}
	}
}
