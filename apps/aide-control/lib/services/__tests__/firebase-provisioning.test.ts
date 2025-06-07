/**
 * Unit tests for Firebase Provisioning Service
 *
 * @group service
 * @group firebase-provisioning
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FirebaseProvisioningService } from '../firebase-provisioning';
import { MockGoogleAuth } from '../mocks/google-auth-mock';

// Mock firebase-admin modules
vi.mock('firebase-admin/app', () => ({
	initializeApp: vi.fn().mockReturnValue({}),
}));

vi.mock('firebase-admin/firestore', () => ({
	getFirestore: vi.fn().mockReturnValue({
		collection: vi.fn().mockReturnThis(),
		doc: vi.fn().mockReturnThis(),
		set: vi.fn().mockResolvedValue({}),
	}),
}));

vi.mock('firebase-admin/auth', () => ({
	getAuth: vi.fn().mockReturnValue({
		createUser: vi.fn().mockResolvedValue({ uid: 'test-user-id' }),
	}),
}));

// Mock the GoogleAuth class
vi.mock('../mocks/google-auth-mock', () => {
	const mockClient = {
		request: vi.fn().mockImplementation(({ url, method }) => {
			// Mock different responses based on the request URL and method
			if (url.includes('projects') && method === 'POST') {
				return { data: { name: 'operations/test-operation' } };
			}
			if (url.includes('operations/test-operation')) {
				return { data: { done: true } };
			}
			if (url.includes('projects/test-project-id')) {
				return { data: { projectNumber: '123456789' } };
			}
			if (url.includes('services') && url.includes('enable')) {
				return { data: {} };
			}
			if (url.includes('databases') && method === 'POST') {
				return { data: {} };
			}
			if (url.includes('config') && method === 'PATCH') {
				return { data: {} };
			}
			if (url.includes('keys') && method === 'POST') {
				return { data: { keyString: 'test-api-key' } };
			}
			return { data: {} };
		}),
	};

	return {
		GoogleAuth: vi.fn().mockImplementation(() => ({
			getAccessToken: vi.fn().mockResolvedValue('test-token'),
			getClient: vi.fn().mockResolvedValue(mockClient),
		})),
		MockGoogleAuth: vi.fn(),
	};
});

describe('FirebaseProvisioningService', () => {
	let service: FirebaseProvisioningService;

	beforeEach(() => {
		service = new FirebaseProvisioningService({
			serviceAccountPath: 'test-path',
			parentProject: 'test-parent-project',
		});

		// Reset all mocks between tests
		vi.clearAllMocks();
	});

	describe('createUserProject', () => {
		it('should successfully create a user project', async () => {
			const result = await service.createUserProject({
				projectId: 'test-project',
				displayName: 'Test Project',
				userId: 'test-user',
				locationId: 'us-central',
			});

			expect(result).toEqual({
				projectId: expect.stringContaining('aide-test-project'),
				projectNumber: '123456789',
				apiKeys: {
					web: 'test-api-key',
				},
				databaseUrl: expect.stringContaining('firebaseio.com'),
				storageBucket: expect.stringContaining('appspot.com'),
			});
		});

		it('should handle errors during project creation', async () => {
			// Mock the client to throw an error
			vi.spyOn(MockGoogleAuth.prototype, 'getClient').mockRejectedValue(
				new Error('Test error')
			);

			await expect(service.createUserProject({
				projectId: 'test-project',
				displayName: 'Test Project',
				userId: 'test-user',
			})).rejects.toThrow('Firebase project provisioning failed');
		});
	});

	describe('deleteProject', () => {
		it('should successfully initiate project deletion', async () => {
			const authClient = await (service as any).auth.getClient();
			const spy = vi.spyOn(authClient, 'request');

			await service.deleteProject('test-project-id');

			expect(spy).toHaveBeenCalledWith({
				url: expect.stringContaining('/projects/test-project-id:delete'),
				method: 'POST',
			});
		});

		it('should handle non-existent projects gracefully', async () => {
			// Mock the client to return a 404 error
			vi.spyOn(MockGoogleAuth.prototype, 'getClient').mockImplementation(async () => ({
				request: vi.fn().mockRejectedValue({ status: 404, message: 'Project not found' }),
			}));

			// Should not throw an error for a 404
			await expect(service.deleteProject('non-existent-project')).resolves.not.toThrow();
		});

		it('should skip deletion for empty project IDs', async () => {
			await service.deleteProject('');

			const mockGetClient = vi.spyOn(MockGoogleAuth.prototype, 'getClient');
			expect(mockGetClient).not.toHaveBeenCalled();
		});
	});

	describe('generateProjectId', () => {
		it('should generate a valid project ID', () => {
			// Using a custom getter to access private method for testing
			const generateProjectId = (service as any).generateProjectId.bind(service);

			const projectId = generateProjectId('test-user', 'my-project');

			expect(projectId).toContain('aide-my-project');
			expect(projectId.length).toBeLessThanOrEqual(30); // Firebase limit
			expect(projectId).toMatch(/^[a-z]([a-z0-9-]*)$/); // Firebase naming requirements
		});

		it('should sanitize invalid characters', () => {
			const generateProjectId = (service as any).generateProjectId.bind(service);

			const projectId = generateProjectId('test-user', 'My Project 123_$%^');

			expect(projectId).not.toContain(' ');
			expect(projectId).not.toContain('$');
			expect(projectId).not.toContain('%');
			expect(projectId).not.toContain('^');
			expect(projectId).not.toContain('_');
			expect(projectId).toMatch(/^[a-z]([a-z0-9-]*)$/);
		});

		it('should use "app" as fallback for invalid project names', () => {
			const generateProjectId = (service as any).generateProjectId.bind(service);

			const projectId1 = generateProjectId('test-user', '');
			const projectId2 = generateProjectId('test-user', null);
			const projectId3 = generateProjectId('test-user', '   ');
			const projectId4 = generateProjectId('test-user', '123');

			expect(projectId1).toContain('aide-app-');
			expect(projectId2).toContain('aide-app-');
			expect(projectId3).toContain('aide-app-');
			expect(projectId4).toContain('aide-app-'); // Leading numbers are invalid
		});
	});

	describe('setupFirestore', () => {
		it('should set up Firestore database', async () => {
			const setupFirestore = (service as any).setupFirestore.bind(service);
			const authClient = await (service as any).auth.getClient();

			const spy = vi.spyOn(authClient, 'request');

			await setupFirestore(authClient, 'test-project-id', 'us-central');

			expect(spy).toHaveBeenCalledWith({
				url: expect.stringContaining('/projects/test-project-id/databases'),
				method: 'POST',
				data: expect.objectContaining({
					databaseId: '(default)',
					locationId: 'us-central',
				}),
			});
		});

		it('should use default location if not provided', async () => {
			const setupFirestore = (service as any).setupFirestore.bind(service);
			const authClient = await (service as any).auth.getClient();

			const spy = vi.spyOn(authClient, 'request');

			await setupFirestore(authClient, 'test-project-id');

			expect(spy).toHaveBeenCalledWith({
				url: expect.stringContaining('/projects/test-project-id/databases'),
				method: 'POST',
				data: expect.objectContaining({
					locationId: 'us-central',
				}),
			});
		});

		it('should handle database already exists error', async () => {
			const setupFirestore = (service as any).setupFirestore.bind(service);
			const authClient = await (service as any).auth.getClient();

			vi.spyOn(authClient, 'request').mockRejectedValueOnce({
				status: 409,
				message: 'Database already exists'
			});

			// Should not throw even with 409 error
			await expect(setupFirestore(authClient, 'test-project-id')).resolves.not.toThrow();
		});
	});

	describe('setupAuth', () => {
		it('should enable email and anonymous authentication', async () => {
			const setupAuth = (service as any).setupAuth.bind(service);
			const authClient = await (service as any).auth.getClient();

			const spy = vi.spyOn(authClient, 'request');

			await setupAuth(authClient, 'test-project-id');

			expect(spy).toHaveBeenCalledWith({
				url: expect.stringContaining('/projects/test-project-id/config'),
				method: 'PATCH',
				data: expect.objectContaining({
					signIn: {
						email: {
							enabled: true,
							passwordRequired: true,
						},
						anonymous: {
							enabled: true,
						},
					},
				}),
			});
		});

		it('should continue provisioning despite auth setup errors', async () => {
			const setupAuth = (service as any).setupAuth.bind(service);
			const authClient = await (service as any).auth.getClient();

			vi.spyOn(authClient, 'request').mockRejectedValueOnce(
				new Error('Auth setup failed')
			);

			// Should not throw error
			await expect(setupAuth(authClient, 'test-project-id')).resolves.not.toThrow();
		});
	});

	describe('createWebApiKey', () => {
		it('should create a web API key with proper restrictions', async () => {
			// Save original env var
			const originalHostname = process.env.APP_HOSTNAME;
			process.env.APP_HOSTNAME = 'test-app.com';

			const createWebApiKey = (service as any).createWebApiKey.bind(service);
			const authClient = await (service as any).auth.getClient();

			const spy = vi.spyOn(authClient, 'request');

			await createWebApiKey(authClient, 'test-project-id');

			expect(spy).toHaveBeenCalledWith({
				url: expect.stringContaining('/projects/test-project-id/locations/global/keys'),
				method: 'POST',
				data: expect.objectContaining({
					displayName: 'AIDE Web App Key',
					restrictions: expect.objectContaining({
						browserKeyRestrictions: expect.objectContaining({
							allowedReferrers: expect.arrayContaining(['https://test-app.com/*']),
						}),
					}),
				}),
			});

			// Restore original env var
			process.env.APP_HOSTNAME = originalHostname;
		});

		it('should handle API key creation errors', async () => {
			const createWebApiKey = (service as any).createWebApiKey.bind(service);
			const authClient = await (service as any).auth.getClient();

			vi.spyOn(authClient, 'request').mockRejectedValueOnce(
				new Error('API key creation failed')
			);

			await expect(createWebApiKey(authClient, 'test-project-id'))
				.rejects
				.toThrow('API key creation failed');
		});
	});

	describe('waitForOperation', () => {
		it('should poll until operation completes', async () => {
			const waitForOperation = (service as any).waitForOperation.bind(service);
			const authClient = await (service as any).auth.getClient();

			const spy = vi.spyOn(authClient, 'request');
			// First call returns not done, second call returns done
			spy.mockResolvedValueOnce({ data: { done: false, metadata: { progress: 50 } } })
				.mockResolvedValueOnce({ data: { done: true } });

			await waitForOperation(authClient, 'operations/test-operation');

			expect(spy).toHaveBeenCalledTimes(2);
		});

		it('should throw error if operation times out', async () => {
			const waitForOperation = (service as any).waitForOperation.bind(service);
			const authClient = await (service as any).auth.getClient();

			// Mock to always return not done
			vi.spyOn(authClient, 'request').mockResolvedValue({ data: { done: false } });

			// Reduce maxAttempts and wait time for testing
			const originalTimeout = vi.getTimerCount();
			vi.useFakeTimers();

			const promise = waitForOperation(authClient, 'operations/test-operation');

			// Fast-forward through all timer calls
			vi.runAllTimers();

			await expect(promise).rejects.toThrow('Operation operations/test-operation timed out');

			vi.useRealTimers();
		});
	});

	describe('factory function', () => {
		it('should create FirebaseProvisioningService with environment variables', () => {
			// Save original env vars
			const originalCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
			const originalProject = process.env.GOOGLE_CLOUD_PROJECT;
			const originalBilling = process.env.GOOGLE_CLOUD_BILLING_ACCOUNT_ID;

			// Set test values
			process.env.GOOGLE_APPLICATION_CREDENTIALS = 'test-creds.json';
			process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
			process.env.GOOGLE_CLOUD_BILLING_ACCOUNT_ID = 'test-billing-id';

			// Import the factory function
			const { createFirebaseService } = require('../firebase-provisioning');

			// Create service using factory
			const service = createFirebaseService();

			expect(service).toBeInstanceOf(FirebaseProvisioningService);
			expect((service as any).config.serviceAccountPath).toBe('test-creds.json');
			expect((service as any).config.parentProject).toBe('test-project');
			expect((service as any).config.billing?.accountId).toBe('test-billing-id');

			// Restore original env vars
			process.env.GOOGLE_APPLICATION_CREDENTIALS = originalCreds;
			process.env.GOOGLE_CLOUD_PROJECT = originalProject;
			process.env.GOOGLE_CLOUD_BILLING_ACCOUNT_ID = originalBilling;
		});

		it('should throw error if required env vars are missing', () => {
			// Save original env vars
			const originalCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
			const originalProject = process.env.GOOGLE_CLOUD_PROJECT;

			// Clear required env vars
			delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
			delete process.env.GOOGLE_CLOUD_PROJECT;

			// Import the factory function
			const { createFirebaseService } = require('../firebase-provisioning');

			// Should throw error when creating service
			expect(() => createFirebaseService()).toThrow('Firebase provisioning configuration is incomplete');

			// Restore original env vars
			process.env.GOOGLE_APPLICATION_CREDENTIALS = originalCreds;
			process.env.GOOGLE_CLOUD_PROJECT = originalProject;
		});
	});

	describe('setupUserPermissions', () => {
		it('should create user document and usage tracking document', async () => {
			// Mock firebase admin modules
			const { initializeApp } = require('firebase-admin/app');
			const { getFirestore } = require('firebase-admin/firestore');

			const setupUserPermissions = (service as any).setupUserPermissions.bind(service);
			const mockCollection = vi.fn().mockReturnThis();
			const mockDoc = vi.fn().mockReturnThis();
			const mockSet = vi.fn().mockResolvedValue({});

			getFirestore.mockReturnValue({
				collection: mockCollection,
				doc: mockDoc,
				set: mockSet,
			});

			await setupUserPermissions('test-project-id', 'test-user-id');

			expect(initializeApp).toHaveBeenCalledWith({
				projectId: 'test-project-id',
			}, expect.stringContaining('aide-test-project-id'));

			expect(mockCollection).toHaveBeenCalledWith('users');
			expect(mockDoc).toHaveBeenCalledWith('test-user-id');
			expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
				uid: 'test-user-id',
				role: 'user',
				plan: 'free',
				projectId: 'test-project-id',
			}));
		});

		it('should throw error if projectId or userId is missing', async () => {
			const setupUserPermissions = (service as any).setupUserPermissions.bind(service);

			await expect(setupUserPermissions('', 'test-user-id'))
				.rejects
				.toThrow('Invalid parameters for user permission setup');

			await expect(setupUserPermissions('test-project-id', ''))
				.rejects
				.toThrow('Invalid parameters for user permission setup');
		});
	});

	describe('setupFirestoreRules', () => {
		it('should prepare Firestore security rules', async () => {
			const setupFirestoreRules = (service as any).setupFirestoreRules.bind(service);
			const consoleSpy = vi.spyOn(console, 'log');

			await setupFirestoreRules('test-project-id');

			// Verify that rules preparation was logged
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Firestore security rules prepared for project: test-project-id')
			);
		});
	});

	describe('enableApis', () => {
		it('should enable required APIs', async () => {
			const enableApis = (service as any).enableApis.bind(service);
			const authClient = await (service as any).auth.getClient();

			const spy = vi.spyOn(authClient, 'request');
			const consoleSpy = vi.spyOn(console, 'log');

			await enableApis(authClient, 'test-project-id');

			// Should call request for each required API
			expect(spy).toHaveBeenCalledTimes(5); // Number of required APIs
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Successfully enabled APIs')
			);
		});

		it('should continue even if some APIs fail to enable', async () => {
			const enableApis = (service as any).enableApis.bind(service);
			const authClient = await (service as any).auth.getClient();

			// Fail one of the API enable requests
			vi.spyOn(authClient, 'request').mockImplementation(({ url }) => {
				if (url.includes('firestore.googleapis.com')) {
					return Promise.reject(new Error('Failed to enable API'));
				}
				return Promise.resolve({ data: {} });
			});

			const consoleSpy = vi.spyOn(console, 'warn');

			await enableApis(authClient, 'test-project-id');

			// Should warn about failure but continue
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Failed to enable API firestore.googleapis.com')
			);
		});
	});
});
