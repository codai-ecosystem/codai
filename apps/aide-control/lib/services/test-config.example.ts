/**
 * Example test configuration for Firebase Provisioning Service
 *
 * This file demonstrates how to set up and test the FirebaseProvisioningService
 * with mock implementations for development and testing purposes.
 *
 * IMPORTANT: Do not commit actual service account credentials or API keys.
 * This file should only contain example/mock values.
 */

import { FirebaseProvisioningService } from './firebase-provisioning';

/**
 * Example function to test Firebase provisioning with mock credentials
 */
async function testFirebaseProvisioning(): Promise<void> {
	try {
		// Create a service instance with mock config
		const service = new FirebaseProvisioningService({
			serviceAccountPath: './mock-service-account.json', // Path to your service account file
			parentProject: 'my-parent-project', // Your Google Cloud parent project
			billing: {
				accountId: 'my-billing-account', // Optional billing account ID
			},
		});

		// Create a test project
		const result = await service.createUserProject({
			projectId: 'test-project',
			displayName: 'Test Project',
			userId: 'test-user-123',
			locationId: 'us-central', // Optional location ID
		});

		console.log('Project created successfully!', result);

		// Example: Clean up the project when done testing
		// await service.deleteProject(result.projectId);
		// console.log('Project deleted successfully!');
	} catch (error) {
		console.error('Error testing Firebase provisioning:', error);
	}
}

/**
 * Example mock service account file structure
 *
 * Create a similar file with your actual credentials for testing
 * but NEVER commit it to version control
 *
 * {
 *   "type": "service_account",
 *   "project_id": "my-project-id",
 *   "private_key_id": "abcdef1234567890",
 *   "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
 *   "client_email": "my-service-account@my-project-id.iam.gserviceaccount.com",
 *   "client_id": "123456789012345678901",
 *   "auth_uri": "https://accounts.google.com/o/oauth2/auth",
 *   "token_uri": "https://oauth2.googleapis.com/token",
 *   "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
 *   "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/my-service-account%40my-project-id.iam.gserviceaccount.com"
 * }
 */

/**
 * Example Vitest Integration Test Setup
 *
 * Create this as a separate test file for real integration testing
 *
 * Example file: firebase-provisioning.integration.test.ts
 */

/*
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FirebaseProvisioningService } from '../firebase-provisioning';

// Test configuration
const TEST_CONFIG = {
	serviceAccountPath: process.env.TEST_SERVICE_ACCOUNT_PATH || './service-account-test.json',
	parentProject: process.env.TEST_PARENT_PROJECT || 'test-parent-project',
	billingAccountId: process.env.TEST_BILLING_ACCOUNT_ID,
	testUserId: 'integration-test-user',
	cleanupAfterTests: true,
};

// Skip these tests if we're running in CI or missing credentials
const shouldRunIntegrationTests = () => {
	if (process.env.CI) return false;
	if (!process.env.TEST_SERVICE_ACCOUNT_PATH) return false;
	return true;
};

describe.skipIf(!shouldRunIntegrationTests())('Firebase Provisioning Integration Tests', () => {
	let service: FirebaseProvisioningService;
	let createdProjectId: string | null = null;

	beforeEach(() => {
		service = new FirebaseProvisioningService({
			serviceAccountPath: TEST_CONFIG.serviceAccountPath,
			parentProject: TEST_CONFIG.parentProject,
			billing: TEST_CONFIG.billingAccountId ? {
				accountId: TEST_CONFIG.billingAccountId
			} : undefined,
		});
	});

	afterEach(async () => {
		// Clean up any projects created during tests
		if (TEST_CONFIG.cleanupAfterTests && createdProjectId) {
			await service.deleteProject(createdProjectId);
			createdProjectId = null;
		}
	});

	it('should create a real Firebase project', async () => {
		// This test actually creates a Firebase project!
		const result = await service.createUserProject({
			projectId: `integration-test-${Date.now().toString(36)}`,
			displayName: 'Integration Test Project',
			userId: TEST_CONFIG.testUserId,
		});

		createdProjectId = result.projectId;

		expect(result.projectId).toBeDefined();
		expect(result.projectNumber).toBeDefined();
		expect(result.apiKeys.web).toBeDefined();
		expect(result.databaseUrl).toContain('firebaseio.com');
		expect(result.storageBucket).toContain('appspot.com');
	}, 120000); // Extend timeout for real API calls

	it('should enable required APIs', async () => {
		// Use more granular testing of specific features
		// This could be expanded based on your testing needs
	});
});
*/

// Run the test function if this file is executed directly
if (require.main === module) {
	testFirebaseProvisioning();
}
