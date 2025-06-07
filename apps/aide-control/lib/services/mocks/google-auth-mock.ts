/**
 * TEMPORARY: Mock Google Auth Implementation
 *
 * This file provides a temporary mock implementation of the GoogleAuth class from google-auth-library
 * It should be replaced with the actual implementation when the dependency issue is resolved.
 *
 * @todo Replace with actual google-auth-library implementation
 * Install proper package with: npm install google-auth-library
 */

/**
 * Mock Google Auth interface
 */
export interface GoogleAuthMock {
	getAccessToken(): Promise<string>;
	getClient(): Promise<any>;
}

/**
 * Mock implementation of GoogleAuth
 * This is a placeholder until the actual google-auth-library is installed
 */
export class MockGoogleAuth implements GoogleAuthMock {
	private config: any;
	private mockProjectId: string = 'mock-project-id';

	/**
	 * @param config - Configuration options (currently not used in mock)
	 */
	constructor(config?: any) {
		this.config = config;
		console.warn('Using MockGoogleAuth - not suitable for production. Install google-auth-library.');

		if (config?.keyFile) {
			console.log(`Mock using configuration from: ${config.keyFile}`);
		}

		// Extract project ID from config if available
		if (config?.projectId) {
			this.mockProjectId = config.projectId;
		}
	}

	/**
	 * Returns a mock access token for development purposes
	 * @returns A fake access token string
	 */
	async getAccessToken(): Promise<string> {
		console.warn('MockGoogleAuth.getAccessToken() - Using development mock');
		// Return a placeholder token for development
		return `mock-token-${Date.now()}`;
	}

	/**
	 * Returns a mock API client for development
	 * @returns A minimally functional mock client
	 */
	async getClient(): Promise<any> {
		console.warn('MockGoogleAuth.getClient() - Using development mock');
		// Return a minimal mock client
		return {
			request: async () => ({ data: { name: `projects/${this.mockProjectId}`, projectId: this.mockProjectId } }),
			projectId: this.mockProjectId
		};
	}
}

// Mock export - replace with actual import when google-auth-library is installed
export const GoogleAuth = MockGoogleAuth;
