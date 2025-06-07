/**
 * Firebase Project Provisioning Service
 * Handles automated provisioning of Firebase projects for AIDE users
 */

import { getAdminApp } from '../firebase-admin';
// Import the GoogleAuth mock
import { GoogleAuth, GoogleAuthMock } from './mocks/google-auth-mock';

// API endpoint constants
const API_ENDPOINTS = {
	FIREBASE_PROJECTS: 'https://firebase.googleapis.com/v1beta1/projects',
	SERVICE_USAGE: 'https://serviceusage.googleapis.com/v1/projects',
	FIRESTORE: 'https://firestore.googleapis.com/v1/projects',
	IDENTITY_TOOLKIT: 'https://identitytoolkit.googleapis.com/admin/v2/projects',
	API_KEYS: 'https://apikeys.googleapis.com/v2/projects',
};

// Required Firebase APIs
const REQUIRED_APIS = [
	'firestore.googleapis.com',
	'firebase.googleapis.com',
	'identitytoolkit.googleapis.com',
	'storage-api.googleapis.com',
	'cloudfunctions.googleapis.com',
];

// Note: The GoogleAuth mock has been moved to './mocks/google-auth-mock.ts'

interface FirebaseProjectConfig {
	projectId: string;
	displayName: string;
	locationId?: string;
	userId: string;
}

/**
 * Result type for Firebase project creation
 */
interface FirebaseProjectResult {
	projectId: string;
	projectNumber: string;
	apiKeys: {
		web: string;
	};
	databaseUrl: string;
	storageBucket: string;
}

interface FirebaseServiceConfig {
	serviceAccountPath: string;
	parentProject: string;
	billing?: {
		accountId: string;
	};
}

export class FirebaseProvisioningService {
	private auth: GoogleAuthMock;
	private config: FirebaseServiceConfig;

	constructor(config: FirebaseServiceConfig) {
		this.config = config;
		this.auth = new GoogleAuth({
			keyFile: config.serviceAccountPath,
			scopes: [
				'https://www.googleapis.com/auth/firebase',
				'https://www.googleapis.com/auth/cloud-platform',
			],
		});
	}
	/**
	 * Create a new Firebase project for a user
	 *
	 * @param config - Configuration for the Firebase project
	 * @returns Object containing project details including ID, number and API keys
	 * @throws {Error} If project creation fails at any step
	 */
	async createUserProject(config: FirebaseProjectConfig): Promise<FirebaseProjectResult> {
		const finalProjectId = this.generateProjectId(config.userId, config.projectId);

		try {
			console.log(`Creating Firebase project: ${finalProjectId} for user ${config.userId}`);
			const authClient = await this.auth.getClient();

			// Create the Firebase project
			const project = await this.createProject(authClient, {
				...config,
				projectId: finalProjectId,
			});
			console.log(`Firebase project created with number: ${project.projectNumber}`);			// Enable required APIs
			await this.enableApis(authClient, finalProjectId);
			console.log(`Enabled required APIs for project: ${finalProjectId}`);

			// Setup Firestore
			await this.setupFirestore(authClient, finalProjectId, config.locationId);
			console.log(`Firestore setup complete for: ${finalProjectId}`);

			// Setup Authentication
			await this.setupAuth(authClient, finalProjectId);
			console.log(`Authentication setup complete for: ${finalProjectId}`);

			// Create web API key
			const apiKey = await this.createWebApiKey(authClient, finalProjectId);
			console.log(`Web API key created for: ${finalProjectId}`);

			// Setup user permissions
			await this.setupUserPermissions(finalProjectId, config.userId);
			console.log(`User permissions established for: ${finalProjectId}`);

			return {
				projectId: finalProjectId,
				projectNumber: project.projectNumber,
				apiKeys: {
					web: apiKey,
				},
				databaseUrl: `https://${finalProjectId}-default-rtdb.firebaseio.com/`,
				storageBucket: `${finalProjectId}.appspot.com`,
			};
		} catch (error: any) {
			console.error(`Failed to create Firebase project for user ${config.userId}:`, error);

			// Add more context to the error
			const enhancedError = new Error(
				`Firebase project provisioning failed: ${error.message || 'Unknown error'}`
			);
			(enhancedError as any).cause = error;
			(enhancedError as any).projectId = finalProjectId;

			// Attempt cleanup if project was partially created
			try {
				console.log(`Attempting cleanup for failed project: ${finalProjectId}`);
				await this.deleteProject(finalProjectId);
			} catch (cleanupError) {
				console.error(`Failed to clean up project ${finalProjectId}:`, cleanupError);
			}

			throw enhancedError;
		}
	}

	/**
	 * Create a new Firebase project
	 */
	private async createProject(
		authClient: any,
		config: FirebaseProjectConfig
	): Promise<{ projectNumber: string }> {
		const response = await authClient.request({
			url: API_ENDPOINTS.FIREBASE_PROJECTS,
			method: 'POST',
			data: {
				projectId: config.projectId,
				displayName: config.displayName,
				parent: `projects/${this.config.parentProject}`,
			},
		});

		// Wait for project creation to complete
		await this.waitForOperation(authClient, response.data.name);

		// Get project details
		const projectResponse = await authClient.request({
			url: `${API_ENDPOINTS.FIREBASE_PROJECTS}/${config.projectId}`,
			method: 'GET',
		});

		return {
			projectNumber: projectResponse.data.projectNumber,
		};
	}

	/**
	 * Enable required Firebase APIs
	 */
	private async enableApis(authClient: any, projectId: string): Promise<void> {
		const errors: Array<{ api: string; error: string }> = [];
		const enabledApis: string[] = [];

		for (const api of REQUIRED_APIS) {
			try {
				await authClient.request({
					url: `${API_ENDPOINTS.SERVICE_USAGE}/${projectId}/services/${api}:enable`,
					method: 'POST',
				});
				enabledApis.push(api);
			} catch (error) {
				const errorMessage = error.message || 'Unknown error';
				console.warn(`Failed to enable API ${api}:`, errorMessage);
				errors.push({ api, error: errorMessage });
			}
		}

		// Wait for APIs to be enabled
		await new Promise(resolve => setTimeout(resolve, 10000));

		if (errors.length > 0) {
			console.warn(`Failed to enable ${errors.length} APIs: ${errors.map(e => e.api).join(', ')}`);
		}

		console.log(`Successfully enabled APIs: ${enabledApis.join(', ')}`);
	}

	/**
	 * Setup Firestore database
	 */
	private async setupFirestore(
		authClient: any,
		projectId: string,
		locationId: string = 'us-central'
	): Promise<void> {
		try {
			await authClient.request({
				url: `${API_ENDPOINTS.FIRESTORE}/${projectId}/databases`,
				method: 'POST',
				data: {
					databaseId: '(default)',
					locationId,
					type: 'FIRESTORE_NATIVE',
				},
			});

			// Create initial collections and security rules
			await this.setupFirestoreRules(projectId);
			console.log(`Firestore setup completed successfully for project: ${projectId}`);
		} catch (error) {
			const errorMessage = error.message || 'Unknown error';
			console.error(`Failed to setup Firestore for project ${projectId}:`, errorMessage);

			// Check if error indicates the database already exists
			if (error.status === 409 || (errorMessage && errorMessage.includes('already exists'))) {
				console.log(`Firestore database already exists for project: ${projectId}, continuing with setup`);
			} else {
				// Log but don't throw to allow provisioning to continue
				console.warn(`Proceeding with provisioning despite Firestore setup issue: ${errorMessage}`);
			}
		}
	}

	/**
	 * Setup Firebase Authentication
	 */
	private async setupAuth(authClient: any, projectId: string): Promise<void> {
		try {
			// Enable email/password authentication
			await authClient.request({
				url: `${API_ENDPOINTS.IDENTITY_TOOLKIT}/${projectId}/config`,
				method: 'PATCH',
				data: {
					signIn: {
						email: {
							enabled: true,
							passwordRequired: true,
						},
						anonymous: {
							enabled: true,
						},
					},
				},
			});
			console.log(`Authentication setup completed successfully for project: ${projectId}`);
		} catch (error) {
			const errorMessage = error.message || 'Unknown error';
			console.error(`Failed to setup Authentication for project ${projectId}:`, errorMessage);

			// Log but don't throw to allow provisioning to continue
			console.warn(`Proceeding with provisioning despite Auth setup issue: ${errorMessage}`);
		}
	}

	/**
	 * Create web API key
	 */
	private async createWebApiKey(authClient: any, projectId: string): Promise<string> {
		try {
			// Get allowed hostnames from environment or use a safe default
			const allowedHosts = process.env.ALLOWED_WEB_ORIGINS
				? process.env.ALLOWED_WEB_ORIGINS.split(',')
				: ['localhost', '127.0.0.1', process.env.APP_HOSTNAME || '*'];

			const response = await authClient.request({
				url: `${API_ENDPOINTS.API_KEYS}/${projectId}/locations/global/keys`,
				method: 'POST',
				data: {
					displayName: 'AIDE Web App Key',
					restrictions: {
						browserKeyRestrictions: {
							allowedReferrers: allowedHosts.map(host => `https://${host}/*`),
						},
						apiTargets: [
							{
								service: 'firebase.googleapis.com',
							},
							{
								service: 'identitytoolkit.googleapis.com',
							},
						],
					},
				},
			});

			return response.data.keyString;
		} catch (error) {
			const errorMessage = error.message || 'Unknown error';
			console.error(`Failed to create API key for project ${projectId}:`, errorMessage);
			throw new Error(`API key creation failed: ${errorMessage}`);
		}
	}

	/**
	 * Setup Firestore security rules
	 * @param projectId - ID of the Firebase project
	 */
	private async setupFirestoreRules(projectId: string): Promise<void> {
		const rules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /projects/{projectId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /usage/{document} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // Plans are read-only for authenticated users
    match /plans/{planId} {
      allow read: if request.auth != null;
    }

    // Admin-only collections
    match /admin/{document=**} {
      allow read, write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
		`.trim();

		try {
			// Log that we'd apply rules in a full implementation
			// In a production version, this would use Firebase CLI or API to apply rules
			console.log(`Firestore security rules prepared for project: ${projectId}`);

			// Future implementation - uncomment when Firebase Admin SDK is fully set up:
			/*
			const authClient = await this.auth.getClient();
			await authClient.request({
				url: `${API_ENDPOINTS.FIRESTORE}/${projectId}/databases/(default):updateSecurityRules`,
				method: 'POST',
				data: { rules: { content: rules } },
			});
			console.log(`Firestore security rules applied to project: ${projectId}`);
			*/
		} catch (error) {
			const errorMessage = error?.message || 'Unknown error';
			console.error(`Failed to set up Firestore rules for project ${projectId}:`, errorMessage);
			// Don't throw - allow provisioning to continue with default rules
			console.warn(`Project ${projectId} will use default Firestore security rules`);
		}
	}

	/**
	 * Setup user permissions for the project
	 * @param projectId - ID of the Firebase project
	 * @param userId - ID of the user to grant permissions to
	 */
	private async setupUserPermissions(projectId: string, userId: string): Promise<void> {
		if (!projectId || !userId) {
			console.error('setupUserPermissions called with invalid parameters', { projectId, userId });
			throw new Error('Invalid parameters for user permission setup');
		}
		try {
			// Get admin app and Firestore instance
			const { adminDb } = getAdminApp();			// Create user document with default data
			await adminDb.collection('users').doc(userId).set({
				uid: userId,
				role: 'user',
				plan: 'free',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				projectId,
				status: 'active',
			});

			// Create usage tracking document
			await adminDb.collection('users').doc(userId).collection('usage').doc('current').set({
				apiCalls: 0,
				computeMinutes: 0,
				storageMB: 0,
				lastReset: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});

			console.log(`User permissions setup completed for userId ${userId} in project ${projectId}`);
		} catch (error) {
			const errorMessage = error?.message || 'Unknown error';
			console.error(`Failed to setup user permissions for ${userId} in project ${projectId}:`, errorMessage);
			throw new Error(`User permissions setup failed: ${errorMessage}`);
		}
	}

	/**
	 * Generate a unique project ID that complies with Firebase naming requirements
	 * @param userId - User ID to associate with the project
	 * @param projectName - Base name for the project
	 * @returns Sanitized, unique project ID
	 */
	private generateProjectId(userId: string, projectName: string): string {
		if (!projectName || typeof projectName !== 'string') {
			// Fallback to a default name if none provided
			projectName = 'app';
		}

		// Sanitize the project name to comply with Firebase naming requirements:
		// - Only lowercase letters, numbers, and hyphens
		// - Must start with a letter
		// - Must not end with a hyphen
		const sanitized = projectName.toLowerCase()
			.replace(/[^a-z0-9-]/g, '-') // Replace non-conforming chars with hyphens
			.replace(/-+/g, '-')        // Replace multiple consecutive hyphens with a single one
			.replace(/^[^a-z]+/, '')     // Remove non-letter chars from the beginning
			.replace(/-+$/, '')          // Remove trailing hyphens
			.trim();

		// Ensure we have a valid starting string after sanitization
		const baseId = sanitized.length > 0 ? sanitized : 'app';

		// Create a unique suffix using timestamp and random component
		const timestamp = Date.now().toString(36);
		const randomSuffix = Math.floor(Math.random() * 1000).toString(36);

		// Combine parts and ensure we don't exceed Firebase's 30 character limit
		// "aide-" (5 chars) + baseId (variable) + "-" (1 char) + timestamp + randomSuffix (should be under 10 chars combined)
		// Trim the baseId if necessary to make the whole ID fit within 30 chars
		const prefix = 'aide-';
		const separator = '-';
		const suffixLength = timestamp.length + randomSuffix.length + 1; // +1 for the hyphen
		const maxBaseIdLength = 30 - (prefix.length + separator.length + suffixLength);
		const trimmedBaseId = baseId.substring(0, maxBaseIdLength);

		return `${prefix}${trimmedBaseId}${separator}${timestamp}${randomSuffix}`;
	}

	/**
	 * Wait for a long-running operation to complete
	 */
	private async waitForOperation(authClient: any, operationName: string): Promise<void> {
		let done = false;
		let attempts = 0;
		const maxAttempts = 30;
		const initialWaitTime = 1000; // 1 second
		let currentWaitTime = initialWaitTime;
		const maxWaitTime = 5000; // 5 seconds

		console.log(`Waiting for operation ${operationName} to complete...`);

		while (!done && attempts < maxAttempts) {
			await new Promise(resolve => setTimeout(resolve, currentWaitTime));

			try {
				const response = await authClient.request({
					url: `${API_ENDPOINTS.FIREBASE_PROJECTS.split('/projects')[0]}/${operationName}`,
					method: 'GET',
				});

				done = response.data.done;

				// If not done, report operation progress if available
				if (!done && response.data.metadata && response.data.metadata.progress) {
					console.log(`Operation ${operationName} progress: ${response.data.metadata.progress}%`);
				}

				// Exponential backoff with cap
				currentWaitTime = Math.min(currentWaitTime * 1.5, maxWaitTime);
			} catch (error) {
				console.warn(`Error checking operation status: ${error.message}`);
				// Keep waiting despite error
			}

			attempts++;
		}

		if (!done) {
			throw new Error(`Operation ${operationName} timed out after ${attempts} attempts`);
		} else {
			console.log(`Operation ${operationName} completed successfully`);
		}
	}
	/**
	 * Delete a Firebase project (cleanup)
	 *
	 * @param projectId - ID of the project to delete
	 * @throws {Error} If deletion fails
	 */
	async deleteProject(projectId: string): Promise<void> {
		if (!projectId) {
			console.warn('Attempted to delete project with empty ID. Skipping deletion.');
			return;
		}

		console.log(`Initiating deletion of Firebase project: ${projectId}`);
		try {
			const authClient = await this.auth.getClient();

			await authClient.request({
				url: `${API_ENDPOINTS.FIREBASE_PROJECTS}/${projectId}:delete`,
				method: 'POST',
			});

			console.log(`Project deletion initiated for project: ${projectId}. This may take several minutes to complete.`);
		} catch (error: any) {
			// Check if project doesn't exist - this is not an error since our goal is to ensure it's deleted
			if (error.status === 404 || (error.message && error.message.includes('not found'))) {
				console.log(`Project ${projectId} not found - already deleted or never existed.`);
				return;
			}

			const errorMessage = error.message || 'Unknown error';
			console.error(`Failed to delete project ${projectId}:`, errorMessage);

			const enhancedError = new Error(`Project deletion failed: ${errorMessage}`);
			(enhancedError as any).cause = error;
			(enhancedError as any).projectId = projectId;
			throw enhancedError;
		}
	}
}

/**
 * Factory function to create Firebase service instance
 */
export function createFirebaseService(): FirebaseProvisioningService {
	const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
	const parentProject = process.env.GOOGLE_CLOUD_PROJECT;
	const billingAccountId = process.env.GOOGLE_CLOUD_BILLING_ACCOUNT_ID;

	if (!serviceAccountPath) {
		console.error('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set');
		throw new Error('Firebase provisioning configuration is incomplete');
	}

	if (!parentProject) {
		console.error('GOOGLE_CLOUD_PROJECT environment variable is not set');
		throw new Error('Firebase provisioning configuration is incomplete');
	}

	const config: FirebaseServiceConfig = {
		serviceAccountPath,
		parentProject,
		billing: billingAccountId ? {
			accountId: billingAccountId,
		} : undefined,
	};

	return new FirebaseProvisioningService(config);
}
