// Central Codai Platform API Integration
export class CodaiAPI {
	private baseUrl: string;
	private apiKey: string;

	constructor() {
		this.baseUrl = process.env.CODAI_CENTRAL_API || 'https://api.codai.ro';
		this.apiKey = process.env.CODAI_API_KEY || '';
	}

	private getHeaders(accessToken?: string) {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};

		if (this.apiKey) {
			headers['X-API-Key'] = this.apiKey;
		}

		if (accessToken) {
			headers['Authorization'] = `Bearer ${accessToken}`;
		}

		return headers;
	}

	/**
	 * Get user profile from central platform
	 */
	async getUserProfile(userId: string, accessToken: string) {
		try {
			const response = await fetch(`${this.baseUrl}/users/${userId}`, {
				method: 'GET',
				headers: this.getHeaders(accessToken),
			});

			if (!response.ok) {
				throw new Error(`Failed to get user profile: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Get user profile error:', error);
			throw error;
		}
	}

	/**
	 * Get user projects from central platform
	 */
	async getUserProjects(userId: string, accessToken: string) {
		try {
			const response = await fetch(`${this.baseUrl}/users/${userId}/projects`, {
				method: 'GET',
				headers: this.getHeaders(accessToken),
			});

			if (!response.ok) {
				throw new Error(`Failed to get user projects: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Get user projects error:', error);
			throw error;
		}
	}

	/**
	 * Create new project
	 */
	async createProject(projectData: {
		name: string;
		description?: string;
		template?: string;
		visibility: 'public' | 'private';
	}, accessToken: string) {
		try {
			const response = await fetch(`${this.baseUrl}/projects`, {
				method: 'POST',
				headers: this.getHeaders(accessToken),
				body: JSON.stringify(projectData),
			});

			if (!response.ok) {
				throw new Error(`Failed to create project: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Create project error:', error);
			throw error;
		}
	}

	/**
	 * Get project details
	 */
	async getProject(projectId: string, accessToken: string) {
		try {
			const response = await fetch(`${this.baseUrl}/projects/${projectId}`, {
				method: 'GET',
				headers: this.getHeaders(accessToken),
			});

			if (!response.ok) {
				throw new Error(`Failed to get project: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Get project error:', error);
			throw error;
		}
	}

	/**
	 * Update project
	 */
	async updateProject(projectId: string, updateData: Partial<{
		name: string;
		description: string;
		visibility: 'public' | 'private';
	}>, accessToken: string) {
		try {
			const response = await fetch(`${this.baseUrl}/projects/${projectId}`, {
				method: 'PATCH',
				headers: this.getHeaders(accessToken),
				body: JSON.stringify(updateData),
			});

			if (!response.ok) {
				throw new Error(`Failed to update project: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Update project error:', error);
			throw error;
		}
	}

	/**
	 * Delete project
	 */
	async deleteProject(projectId: string, accessToken: string) {
		try {
			const response = await fetch(`${this.baseUrl}/projects/${projectId}`, {
				method: 'DELETE',
				headers: this.getHeaders(accessToken),
			});

			if (!response.ok) {
				throw new Error(`Failed to delete project: ${response.statusText}`);
			}

			return response.ok;
		} catch (error) {
			console.error('Delete project error:', error);
			throw error;
		}
	}

	/**
	 * Get system health status
	 */
	async getSystemHealth() {
		try {
			const response = await fetch(`${this.baseUrl}/health`, {
				method: 'GET',
				headers: this.getHeaders(),
			});

			if (!response.ok) {
				throw new Error(`Health check failed: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Health check error:', error);
			throw error;
		}
	}
}

// Export singleton instance
export const codaiAPI = new CodaiAPI();
