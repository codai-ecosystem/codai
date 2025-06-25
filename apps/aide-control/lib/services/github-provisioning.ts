/**
 * Service for provisioning and managing GitHub repositories
 */
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

export interface GitHubRepoConfig {
	name: string;
	description?: string;
	private?: boolean;
	template?: string;
	topics?: string[];
}

export interface GitHubServiceConfig {
	appId: string;
	privateKey: string;
	installationId: string;
	organizationName?: string;
}

export class GitHubProvisioningService {
	private octokit: Octokit;
	private orgName?: string;

	constructor(config: GitHubServiceConfig) {
		this.octokit = new Octokit({
			authStrategy: createAppAuth,
			auth: {
				appId: config.appId,
				privateKey: config.privateKey,
				installationId: config.installationId,
			},
		});
		this.orgName = config.organizationName;
	}

	/**
	 * Create a new repository for a user
	 */
	async createRepository(
		userId: string,
		config: GitHubRepoConfig
	): Promise<{ repoUrl: string; repoId: number }> {
		try {
			const repoName = this.generateRepoName(userId, config.name);

			let response;

			if (this.orgName) {
				// Create in organization
				response = await this.octokit.repos.createInOrg({
					org: this.orgName,
					name: repoName,
					description: config.description || `AIDE project: ${config.name}`,
					private: config.private ?? true,
					auto_init: true,
					license_template: 'mit',
				});
			} else {
				// Create in user account (requires user token)
				response = await this.octokit.repos.createForAuthenticatedUser({
					name: repoName,
					description: config.description || `AIDE project: ${config.name}`,
					private: config.private ?? true,
					auto_init: true,
					license_template: 'mit',
				});
			}

			const repo = response.data;

			// Add topics if specified
			if (config.topics && config.topics.length > 0) {
				await this.octokit.repos.replaceAllTopics({
					owner: repo.owner.login,
					repo: repo.name,
					names: ['aide-generated', ...config.topics],
				});
			}

			// Create initial README if template specified
			if (config.template) {
				await this.createInitialFiles(repo.owner.login, repo.name, config.template);
			}

			return {
				repoUrl: repo.html_url,
				repoId: repo.id,
			};
		} catch (error) {
			console.error('Error creating GitHub repository:', error);
			throw new Error(`Failed to create repository: ${error.message}`);
		}
	}

	/**
	 * Set up repository with initial template files
	 */
	private async createInitialFiles(owner: string, repo: string, template: string): Promise<void> {
		try {
			const templates = this.getTemplateFiles(template);

			for (const file of templates) {
				await this.octokit.repos.createOrUpdateFileContents({
					owner,
					repo,
					path: file.path,
					message: `Add ${file.path}`,
					content: Buffer.from(file.content).toString('base64'),
				});
			}
		} catch (error) {
			console.error('Error creating initial files:', error);
			// Don't throw here as repo creation was successful
		}
	}

	/**
	 * Get template files for different project types
	 */
	private getTemplateFiles(template: string): Array<{ path: string; content: string }> {
		const templates: Record<string, Array<{ path: string; content: string }>> = {
			nextjs: [
				{
					path: 'package.json',
					content: JSON.stringify(
						{
							name: 'aide-nextjs-app',
							version: '0.1.0',
							private: true,
							scripts: {
								dev: 'next dev',
								build: 'next build',
								start: 'next start',
								lint: 'next lint',
							},
							dependencies: {
								next: '^14.0.0',
								react: '^18.0.0',
								'react-dom': '^18.0.0',
							},
							devDependencies: {
								'@types/node': '^20.0.0',
								'@types/react': '^18.0.0',
								'@types/react-dom': '^18.0.0',
								eslint: '^8.0.0',
								'eslint-config-next': '^14.0.0',
								typescript: '^5.0.0',
							},
						},
						null,
						2
					),
				},
				{
					path: 'app/page.tsx',
					content: `export default function Home() {
  return (
    <main>
      <h1>Welcome to your AIDE-generated Next.js app!</h1>
      <p>Start building your application by editing this file.</p>
    </main>
  );
}`,
				},
				{
					path: 'next.config.js',
					content: `/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = nextConfig;`,
				},
			],
			python: [
				{
					path: 'requirements.txt',
					content: `# Add your Python dependencies here
flask>=2.0.0
requests>=2.25.0`,
				},
				{
					path: 'main.py',
					content: `#!/usr/bin/env python3
"""
AIDE-generated Python application
"""

def main():
    print("Hello from your AIDE-generated Python app!")
    print("Start building your application by editing this file.")

if __name__ == "__main__":
    main()`,
				},
				{
					path: '.gitignore',
					content: `__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST
.env
venv/
ENV/`,
				},
			],
		};

		return templates[template] || [];
	}

	/**
	 * Generate a unique repository name
	 */
	private generateRepoName(userId: string, projectName: string): string {
		const sanitized = projectName
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, '-')
			.replace(/-+/g, '-')
			.trim();

		const timestamp = Date.now().toString(36);
		return `aide-${sanitized}-${timestamp}`;
	}

	/**
	 * Add a collaborator to a repository
	 */
	async addCollaborator(
		repoOwner: string,
		repoName: string,
		username: string,
		permission: 'pull' | 'triage' | 'push' | 'maintain' | 'admin' = 'push'
	): Promise<void> {
		try {
			await this.octokit.repos.addCollaborator({
				owner: repoOwner,
				repo: repoName,
				username,
				permission,
			});
		} catch (error) {
			console.error('Error adding collaborator:', error);
			throw new Error(`Failed to add collaborator: ${error.message}`);
		}
	}

	/**
	 * Delete a repository
	 */
	async deleteRepository(repoOwner: string, repoName: string): Promise<void> {
		try {
			await this.octokit.repos.delete({
				owner: repoOwner,
				repo: repoName,
			});
		} catch (error) {
			console.error('Error deleting repository:', error);
			throw new Error(`Failed to delete repository: ${error.message}`);
		}
	}
}
