import * as vscode from 'vscode';
import { Octokit } from '@octokit/rest';
import { createLogger } from './loggerService';

export interface GitHubRepository {
	name: string;
	fullName: string;
	description?: string;
	private: boolean;
	htmlUrl: string;
	cloneUrl: string;
	sshUrl: string;
	defaultBranch: string;
	createdAt: string;
	updatedAt: string;
}

export interface GitHubUser {
	login: string;
	id: number;
	name?: string;
	email?: string;
	bio?: string;
	company?: string;
	location?: string;
	avatarUrl: string;
}

export class GitHubService {
	private octokit: Octokit | null = null;
	private currentUser: GitHubUser | null = null;
	private readonly logger = createLogger('GitHubService');

	constructor() {
		this.initializeFromStoredToken();
	}

	/**
	 * Initialize GitHub service with stored authentication token
	 */
	private async initializeFromStoredToken(): Promise<void> {
		try {
			// Try to get token from VS Code authentication API
			const session = await vscode.authentication.getSession('github', ['repo', 'user'], {
				silent: true,
			});

			if (session) {
				await this.initialize(session.accessToken);
			}
		} catch (error) {
			this.logger.debug('No existing GitHub session found');
		}
	}

	/**
	 * Authenticate with GitHub using VS Code's authentication API
	 */
	async authenticate(): Promise<boolean> {
		try {
			const session = await vscode.authentication.getSession('github', ['repo', 'user'], {
				createIfNone: true,
			});

			if (session) {
				await this.initialize(session.accessToken);
				return true;
			}

			return false;
		} catch (error) {
			this.logger.error('GitHub authentication failed:', error);
			vscode.window.showErrorMessage('Failed to authenticate with GitHub. Please try again.');
			return false;
		}
	}

	/**
	 * Initialize the GitHub service with an access token
	 */
	private async initialize(token: string): Promise<void> {
		this.octokit = new Octokit({
			auth: token,
			userAgent: 'AIDE-VSCode-Extension/1.0.0',
		});

		// Get current user information
		try {
			const { data } = await this.octokit.rest.users.getAuthenticated();
			this.currentUser = {
				login: data.login,
				id: data.id,
				name: data.name || undefined,
				email: data.email || undefined,
				bio: data.bio || undefined,
				company: data.company || undefined,
				location: data.location || undefined,
				avatarUrl: data.avatar_url,
			};
		} catch (error) {
			this.logger.error('Failed to get user information:', error);
		}
	}

	/**
	 * Check if the service is authenticated
	 */
	isAuthenticated(): boolean {
		return this.octokit !== null && this.currentUser !== null;
	}

	/**
	 * Get current authenticated user
	 */
	getCurrentUser(): GitHubUser | null {
		return this.currentUser;
	}

	/**
	 * Create a new GitHub repository
	 */
	async createRepository(
		name: string,
		description?: string,
		isPrivate: boolean = false
	): Promise<GitHubRepository | null> {
		if (!this.octokit) {
			throw new Error('GitHub service not authenticated');
		}

		try {
			const { data } = await this.octokit.rest.repos.createForAuthenticatedUser({
				name,
				description,
				private: isPrivate,
				auto_init: true,
				gitignore_template: 'Node',
			});

			return {
				name: data.name,
				fullName: data.full_name,
				description: data.description || undefined,
				private: data.private,
				htmlUrl: data.html_url,
				cloneUrl: data.clone_url,
				sshUrl: data.ssh_url,
				defaultBranch: data.default_branch,
				createdAt: data.created_at,
				updatedAt: data.updated_at,
			};
		} catch (error: any) {
			this.logger.error('Failed to create repository:', error);

			if (error.status === 422) {
				vscode.window.showErrorMessage(`Repository "${name}" already exists or name is invalid.`);
			} else {
				vscode.window.showErrorMessage('Failed to create repository. Please try again.');
			}

			return null;
		}
	}

	/**
	 * Get user's repositories
	 */
	async getRepositories(type: 'all' | 'owner' | 'member' = 'owner'): Promise<GitHubRepository[]> {
		if (!this.octokit) {
			throw new Error('GitHub service not authenticated');
		}

		try {
			const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
				type,
				sort: 'updated',
				per_page: 100,
			});

			return data.map((repo: any) => ({
				name: repo.name,
				fullName: repo.full_name,
				description: repo.description || undefined,
				private: repo.private,
				htmlUrl: repo.html_url,
				cloneUrl: repo.clone_url,
				sshUrl: repo.ssh_url,
				defaultBranch: repo.default_branch,
				createdAt: repo.created_at,
				updatedAt: repo.updated_at,
			}));
		} catch (error) {
			this.logger.error('Failed to get repositories:', error);
			vscode.window.showErrorMessage('Failed to fetch repositories.');
			return [];
		}
	}

	/**
	 * Clone a repository to local workspace
	 */
	async cloneRepository(repository: GitHubRepository, localPath: string): Promise<boolean> {
		try {
			// Use VS Code's git extension to clone
			const git = vscode.extensions.getExtension('vscode.git')?.exports;

			if (!git) {
				vscode.window.showErrorMessage('Git extension is not available.');
				return false;
			}

			// Use git command via terminal
			const terminal = vscode.window.createTerminal('AIDE Git Clone');
			terminal.sendText(`git clone ${repository.cloneUrl} "${localPath}"`);
			terminal.show();
			Promise.resolve(
				vscode.window.showInformationMessage(
					`Cloning repository ${repository.name}...`,
					'Open Folder'
				)
			)
				.then(selection => {
					if (selection === 'Open Folder') {
						vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(localPath), false);
					}
				})
				.catch((error: any) => {
					this.logger.error('Failed to show information message:', error);
				});

			return true;
		} catch (error) {
			this.logger.error('Failed to clone repository:', error);
			vscode.window.showErrorMessage('Failed to clone repository.');
			return false;
		}
	}

	/**
	 * Push local project to new GitHub repository
	 */
	async pushToRepository(repository: GitHubRepository, localPath: string): Promise<boolean> {
		try {
			const terminal = vscode.window.createTerminal('AIDE Git Push');

			// Initialize git if not already done
			terminal.sendText(`cd "${localPath}"`);
			terminal.sendText('git init');
			terminal.sendText('git add .');
			terminal.sendText('git commit -m "Initial commit from AIDE"');
			terminal.sendText(`git branch -M ${repository.defaultBranch}`);
			terminal.sendText(`git remote add origin ${repository.cloneUrl}`);
			terminal.sendText(`git push -u origin ${repository.defaultBranch}`);
			terminal.show();
			Promise.resolve(
				vscode.window.showInformationMessage(
					`Pushing to repository ${repository.name}...`,
					'View Repository'
				)
			)
				.then(selection => {
					if (selection === 'View Repository') {
						vscode.env.openExternal(vscode.Uri.parse(repository.htmlUrl));
					}
				})
				.catch((error: any) => {
					this.logger.error('Failed to show information message:', error);
				});

			return true;
		} catch (error) {
			this.logger.error('Failed to push to repository:', error);
			vscode.window.showErrorMessage('Failed to push to repository.');
			return false;
		}
	}

	/**
	 * Create a commit and push changes
	 */
	async commitAndPush(localPath: string, message: string): Promise<boolean> {
		try {
			const terminal = vscode.window.createTerminal('AIDE Git Commit');

			terminal.sendText(`cd "${localPath}"`);
			terminal.sendText('git add .');
			terminal.sendText(`git commit -m "${message}"`);
			terminal.sendText('git push');
			terminal.show();

			vscode.window.showInformationMessage('Changes committed and pushed successfully!');
			return true;
		} catch (error) {
			this.logger.error('Failed to commit and push:', error);
			vscode.window.showErrorMessage('Failed to commit and push changes.');
			return false;
		}
	}

	/**
	 * Get repository status
	 */
	async getRepositoryStatus(owner: string, repo: string) {
		if (!this.octokit) {
			throw new Error('GitHub service not authenticated');
		}

		try {
			const { data } = await this.octokit.rest.repos.get({
				owner,
				repo,
			});

			return {
				name: data.name,
				fullName: data.full_name,
				description: data.description,
				private: data.private,
				htmlUrl: data.html_url,
				defaultBranch: data.default_branch,
				stargazersCount: data.stargazers_count,
				forksCount: data.forks_count,
				openIssuesCount: data.open_issues_count,
				language: data.language,
				size: data.size,
				createdAt: data.created_at,
				updatedAt: data.updated_at,
				pushedAt: data.pushed_at,
			};
		} catch (error) {
			this.logger.error('Failed to get repository status:', error);
			return null;
		}
	}

	/**
	 * Create a release
	 */
	async createRelease(
		owner: string,
		repo: string,
		tagName: string,
		name: string,
		body?: string,
		isDraft: boolean = false
	): Promise<boolean> {
		if (!this.octokit) {
			throw new Error('GitHub service not authenticated');
		}

		try {
			await this.octokit.rest.repos.createRelease({
				owner,
				repo,
				tag_name: tagName,
				name,
				body,
				draft: isDraft,
			});

			vscode.window.showInformationMessage(`Release ${name} created successfully!`);
			return true;
		} catch (error) {
			this.logger.error('Failed to create release:', error);
			vscode.window.showErrorMessage('Failed to create release.');
			return false;
		}
	}
	/**
	 * Sign out from GitHub
	 */
	async signOut(): Promise<void> {
		try {
			this.octokit = null;
			this.currentUser = null;

			vscode.window.showInformationMessage('Successfully signed out from GitHub.');
		} catch (error) {
			this.logger.error('Failed to sign out:', error);
			vscode.window.showErrorMessage('Failed to sign out from GitHub.');
		}
	}
}
