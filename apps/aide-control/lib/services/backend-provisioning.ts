/**
 * Main Backend Provisioning Service
 * Orchestrates all provisioning services for AIDE users
 */

import { GitHubProvisioningService } from './github-provisioning';
import { FirebaseProvisioningService } from './firebase-provisioning';
import { UsageTrackingService } from './usage-tracking';
import { getAdminApp } from '../firebase-admin';

interface UserProvisioningRequest {
	userId: string;
	email: string;
	displayName: string;
	plan: 'free' | 'professional' | 'enterprise';
	projectName: string;
	projectType: 'nextjs' | 'python' | 'react' | 'node' | 'custom';
	githubUsername?: string;
	services?: ('github' | 'firebase')[];
	projectId?: string;
	environmentType?: 'development' | 'staging' | 'production';
}

interface ProvisioningResult {
	success: boolean;
	projectId?: string;
	services: {
		github?: {
			repositoryUrl: string;
			repositoryId: string;
		};
		firebase?: {
			projectId: string;
			apiKey: string;
			databaseUrl: string;
			storageBucket: string;
		};
		user?: {
			uid: string;
			customToken: string;
		};
	};
	errors?: string[];
}

export class BackendProvisioningService {
	private githubService: GitHubProvisioningService;
	private firebaseService: FirebaseProvisioningService;
	private usageService: UsageTrackingService;
	private adminApp = getAdminApp();
	private db = this.adminApp.firestore();
	private auth = this.adminApp.auth();

	constructor() {
		this.githubService = new GitHubProvisioningService({
			appId: process.env.GITHUB_APP_ID!,
			privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
			installationId: process.env.GITHUB_INSTALLATION_ID!,
			organizationName: process.env.GITHUB_ORGANIZATION_NAME,
		});

		this.firebaseService = new FirebaseProvisioningService({
			serviceAccountPath: process.env.GOOGLE_APPLICATION_CREDENTIALS!,
			parentProject: process.env.GOOGLE_CLOUD_PROJECT!,
		});

		this.usageService = new UsageTrackingService();
	}

	/**
	 * Provision a complete environment for a new user
	 */
	async provisionUser(request: UserProvisioningRequest): Promise<ProvisioningResult> {
		const result: ProvisioningResult = {
			success: false,
			services: {},
			errors: [],
		};

		try {
			console.log(`Starting provisioning for user: ${request.userId}`);

			// Step 1: Create Firebase user and authentication
			const userResult = await this.createUserAccount(request);
			if (userResult.success) {
				result.services.user = userResult.data;
			} else {
				result.errors?.push('Failed to create user account');
			}

			// Step 2: Create GitHub repository
			try {
				const githubResult = await this.githubService.createRepository(request.userId, {
					name: request.projectName,
					description: `AIDE project: ${request.projectName}`,
					private: true,
					template: request.projectType,
					topics: ['aide-generated', request.projectType],
				});

				result.services.github = {
					repositoryUrl: githubResult.repoUrl,
					repositoryId: githubResult.repoId.toString(),
				};

				// Grant access to GitHub username if provided
				if (request.githubUsername) {
					const repoName = githubResult.repoUrl.split('/').pop()!;
					await this.githubService.addCollaborator(
						process.env.GITHUB_ORGANIZATION_NAME!,
						repoName,
						request.githubUsername,
						'admin'
					);
				}
			} catch (error) {
				console.error('GitHub provisioning failed:', error);
				result.errors?.push(`GitHub: ${error.message}`);
			}

			// Step 3: Create Firebase project (optional for free tier)
			if (request.plan !== 'free') {
				try {
					const firebaseResult = await this.firebaseService.createUserProject({
						projectId: `${request.projectName}-${Date.now()}`,
						displayName: `${request.displayName}'s ${request.projectName}`,
						userId: request.userId,
						locationId: 'us-central',
					});

					result.services.firebase = {
						projectId: firebaseResult.projectId,
						apiKey: firebaseResult.apiKeys.web,
						databaseUrl: firebaseResult.databaseUrl,
						storageBucket: firebaseResult.storageBucket,
					};
				} catch (error) {
					console.error('Firebase provisioning failed:', error);
					result.errors?.push(`Firebase: ${error.message}`);
				}
			}

			// Step 4: Setup user in main database
			await this.setupUserProfile(request, result);

			// Step 5: Initialize usage tracking
			await this.usageService.recordUsage({
				userId: request.userId,
				type: 'api_call',
				amount: 1,
				metadata: { action: 'user_provisioning' },
				timestamp: new Date().toISOString(),
			});

			result.success = result.errors?.length === 0;
			console.log(`Provisioning completed for user: ${request.userId}, Success: ${result.success}`);

			return result;
		} catch (error) {
			console.error('Provisioning failed:', error);
			result.errors?.push(`General: ${error.message}`);
			return result;
		}
	}

	/**
	 * Create user account and authentication
	 */
	private async createUserAccount(request: UserProvisioningRequest): Promise<{
		success: boolean;
		data?: { uid: string; customToken: string };
	}> {
		try {
			const auth = this.auth;

			// Create user in Firebase Auth
			const userRecord = await auth.createUser({
				uid: request.userId,
				email: request.email,
				displayName: request.displayName,
				emailVerified: false,
			});

			// Generate custom token for authentication
			const customToken = await auth.createCustomToken(userRecord.uid);

			return {
				success: true,
				data: {
					uid: userRecord.uid,
					customToken,
				},
			};
		} catch (error) {
			console.error('Failed to create user account:', error);
			return { success: false };
		}
	}

	/**
	 * Setup user profile in Firestore
	 */
	private async setupUserProfile(
		request: UserProvisioningRequest,
		provisioningResult: ProvisioningResult
	): Promise<void> {
		try {
			const userDoc = {
				uid: request.userId,
				email: request.email,
				displayName: request.displayName,
				plan: request.plan,
				status: 'active',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				services: {
					github: provisioningResult.services.github || null,
					firebase: provisioningResult.services.firebase || null,
				},
				preferences: {
					notifications: true,
					theme: 'dark',
					language: 'en',
				},
				metadata: {
					firstProject: request.projectName,
					projectType: request.projectType,
					githubUsername: request.githubUsername,
				},
			};

			await this.db.collection('users').doc(request.userId).set(userDoc);

			// Create initial project document
			if (provisioningResult.services.github) {
				await this.db
					.collection('users')
					.doc(request.userId)
					.collection('projects')
					.add({
						name: request.projectName,
						type: request.projectType,
						status: 'active',
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
						github: provisioningResult.services.github,
						firebase: provisioningResult.services.firebase || null,
					});
			}

			console.log('User profile setup completed');
		} catch (error) {
			console.error('Failed to setup user profile:', error);
			throw error;
		}
	}
	/**
	 * Upgrade user plan and provision additional resources
	 */
	async upgradeUserPlan(
		userId: string,
		newPlan: 'free' | 'professional' | 'enterprise'
	): Promise<ProvisioningResult> {
		const result: ProvisioningResult = {
			success: false,
			services: {},
			errors: [],
		};

		try {
			// Update user plan
			await this.usageService.updateUserPlan(userId, newPlan);

			// Get user data
			const userDoc = await this.db.collection('users').doc(userId).get();
			if (!userDoc.exists) {
				throw new Error('User not found');
			}

			const userData = userDoc.data()!; // Provision Firebase project if upgrading from free
			const currentPlan = userData.plan as string;
			if (currentPlan === 'free' && newPlan !== 'free') {
				try {
					const firebaseResult = await this.firebaseService.createUserProject({
						projectId: `${userData.displayName}-upgrade-${Date.now()}`,
						displayName: `${userData.displayName}'s Upgraded Project`,
						userId,
						locationId: 'us-central',
					});

					result.services.firebase = {
						projectId: firebaseResult.projectId,
						apiKey: firebaseResult.apiKeys.web,
						databaseUrl: firebaseResult.databaseUrl,
						storageBucket: firebaseResult.storageBucket,
					};

					// Update user document with new Firebase project
					await this.db.collection('users').doc(userId).update({
						'services.firebase': result.services.firebase,
						plan: newPlan,
						updatedAt: new Date().toISOString(),
					});
				} catch (error) {
					console.error('Firebase upgrade provisioning failed:', error);
					result.errors?.push(`Firebase upgrade: ${error.message}`);
				}
			}

			result.success = result.errors?.length === 0;
			return result;
		} catch (error) {
			console.error('Plan upgrade failed:', error);
			result.errors?.push(`Upgrade: ${error.message}`);
			return result;
		}
	}

	/**
	 * Deprovision user resources (for account deletion)
	 */
	async deprovisionUser(userId: string): Promise<{ success: boolean; errors?: string[] }> {
		const errors: string[] = [];

		try {
			// Get user data
			const userDoc = await this.db.collection('users').doc(userId).get();
			if (!userDoc.exists) {
				return { success: true }; // Already deprovisioned
			}

			const userData = userDoc.data()!;

			// Delete GitHub repositories
			if (userData.services?.github) {
				try {
					const repoName = userData.services.github.repositoryUrl.split('/').pop()!;
					await this.githubService.deleteRepository(
						process.env.GITHUB_ORGANIZATION_NAME!,
						repoName
					);
				} catch (error) {
					errors.push(`GitHub cleanup: ${error.message}`);
				}
			}

			// Delete Firebase project
			if (userData.services?.firebase) {
				try {
					await this.firebaseService.deleteProject(userData.services.firebase.projectId);
				} catch (error) {
					errors.push(`Firebase cleanup: ${error.message}`);
				}
			}

			// Delete user data from Firestore
			await this.deleteUserData(userId); // Delete from Firebase Auth
			try {
				const auth = this.auth;
				await auth.deleteUser(userId);
			} catch (error) {
				errors.push(`Auth cleanup: ${error.message}`);
			}

			return { success: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
		} catch (error) {
			console.error('Deprovisioning failed:', error);
			errors.push(`General: ${error.message}`);
			return { success: false, errors };
		}
	}

	/**
	 * Delete all user data from Firestore
	 */
	private async deleteUserData(userId: string): Promise<void> {
		const userRef = this.db.collection('users').doc(userId);

		// Delete subcollections
		const subcollections = ['projects', 'usage', 'usage_events', 'notifications'];

		for (const subcollection of subcollections) {
			const snapshot = await userRef.collection(subcollection).get();
			const batch = this.db.batch();

			snapshot.docs.forEach(doc => {
				batch.delete(doc.ref);
			});

			await batch.commit();
		}

		// Delete main user document
		await userRef.delete();
	}

	/**
	 * Get provisioning status for a user
	 */
	async getProvisioningStatus(userId: string): Promise<{
		isProvisioned: boolean;
		services: {
			github: boolean;
			firebase: boolean;
			user: boolean;
		};
		plan: string;
		usage: any;
	}> {
		try {
			const userDoc = await this.db.collection('users').doc(userId).get();

			if (!userDoc.exists) {
				return {
					isProvisioned: false,
					services: { github: false, firebase: false, user: false },
					plan: 'free',
					usage: null,
				};
			}

			const userData = userDoc.data()!;
			const usage = await this.usageService.getCurrentUsage(userId);

			return {
				isProvisioned: true,
				services: {
					github: !!userData.services?.github,
					firebase: !!userData.services?.firebase,
					user: true,
				},
				plan: userData.plan || 'free',
				usage,
			};
		} catch (error) {
			console.error('Failed to get provisioning status:', error);
			throw error;
		}
	}
}

/**
 * Factory function to create backend provisioning service instance
 */
export function createBackendProvisioningService(): BackendProvisioningService {
	return new BackendProvisioningService();
}
