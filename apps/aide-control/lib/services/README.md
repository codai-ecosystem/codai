# Firebase Provisioning Service

This service handles automated provisioning of Firebase projects for AIDE users. It creates and configures Firebase projects with the necessary settings to be immediately usable for AIDE applications.

## Features

- Automated creation of Firebase projects with proper naming conventions
- API enablement for required services (Firestore, Auth, Storage, Functions)
- Firestore database setup with security rules tailored for AIDE use cases
- Authentication configuration for email/password and anonymous auth
- Creation of restricted Web API keys with proper security settings
- User permissions management for project access control
- Project deletion and cleanup capabilities

## Code Improvements and Best Practices

The following improvements have been made to the codebase to align with VS Code coding guidelines:

### 1. Code Organization

- Extracted API endpoint URLs as constants
- Moved mock implementations to separate files
- Consistent error handling patterns

### 2. Type Safety

- Added proper interfaces for all configurations
- Improved error typing and propagation

### 3. Error Handling

- Enhanced error messages with more context
- Added cleanup logic for failed operations
- Consistent error handling patterns across methods

### 4. Performance Optimizations

- Improved waiting strategy with exponential backoff
- Better parallel processing of API operations where possible

### 5. Security

- Better API key restrictions based on environment configuration
- No hardcoded credentials

## Testing

The service has comprehensive tests using Vitest. Tests cover the following areas:

1. Project creation workflow
2. API enabling
3. Error handling scenarios
4. Cleanup processes
5. Configuration validation

To run tests:

```bash
cd apps/aide-control
pnpm test
```

For mock development testing without a real Google Cloud account:

```typescript
// The service uses a mock GoogleAuth implementation during development
// To use a specific config for testing:
import { createFirebaseService } from './lib/services/firebase-provisioning';

// Set environment variables for testing
process.env.GOOGLE_APPLICATION_CREDENTIALS = './path/to/test-credentials.json';
process.env.GOOGLE_CLOUD_PROJECT = 'test-project-id';

const firebaseService = createFirebaseService();
// Use service methods...
```

### Test Structure

```typescript
describe('FirebaseProvisioningService', () => {
	// Happy path tests
	describe('createUserProject', () => {
		it('successfully creates a Firebase project');
		it('enables all required APIs');
		it('sets up Firestore with proper rules');
	});

	// Error path tests
	describe('error handling', () => {
		it('handles API enabling failures gracefully');
		it('cleans up resources on partial failures');
		it('provides useful error messages');
	});

	// Individual method tests
	describe('setupFirestore', () => {
		it('creates a Firestore database with correct settings');
		it('applies appropriate security rules');
	});
});
```

## Next Steps for Improvement

1. Replace mock Google Auth with actual library

   ```bash
   npm install google-auth-library
   ```

   Then update imports in firebase-provisioning.ts:

   ```typescript
   import { GoogleAuth } from 'google-auth-library';
   // Remove the mock import
   ```

2. Enhance monitoring and telemetry
   - Add structured logging for provisioning operations
   - Implement metrics collection for timing and success rates
   - Setup alerting for critical failures

3. Expand security rules implementation
   - Implement the actual Firestore rules application via API
   - Add support for Storage security rules
   - Create more granular role-based permissions

4. Improve scalability and performance
   - Implement rate limiting for API calls
   - Add request batching where applicable
   - Create more efficient polling strategies for long-running operations

5. Add administrative features
   - Project resource usage monitoring
   - Quota management
   - Automated cleanup of unused resources

## Usage

```typescript
import { createFirebaseService } from './lib/services/firebase-provisioning';

// Create service instance using environment variables
const firebaseService = createFirebaseService();

// Create a new Firebase project
const projectDetails = await firebaseService.createUserProject({
	projectId: 'my-project',
	displayName: 'My Firebase Project',
	userId: 'user123',
	locationId: 'us-central', // Optional, defaults to us-central
});

console.log(`Project created: ${projectDetails.projectId}`);
console.log(`Web API Key: ${projectDetails.apiKeys.web}`);
console.log(`Storage Bucket: ${projectDetails.storageBucket}`);

// Delete a project (for cleanup)
await firebaseService.deleteProject('project-id-to-delete');
```

## Required Environment Variables

- `GOOGLE_APPLICATION_CREDENTIALS`: Path to service account key file
- `GOOGLE_CLOUD_PROJECT`: Parent Google Cloud project ID
- `GOOGLE_CLOUD_BILLING_ACCOUNT_ID` (optional): Billing account ID for new projects
- `APP_HOSTNAME` (optional): Main application hostname for API key restrictions
- `ALLOWED_WEB_ORIGINS` (optional): Comma-separated list of allowed hostnames for API keys
