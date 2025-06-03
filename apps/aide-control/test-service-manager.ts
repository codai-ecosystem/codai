/**
 * Basic test for ServiceManager functionality
 * Run this with: npx tsx test-service-manager.ts
 */

import { serviceManager } from './lib/services/service-manager';
import { ServiceConfig } from './lib/types';

async function testServiceManager() {
	console.log('🧪 Testing ServiceManager...\n');

	try {
		// Test 1: Health check
		console.log('1. Testing health check...');
		const health = await serviceManager.healthCheck();
		console.log('✅ Health check successful:', health);
		console.log('');

		// Test 2: Available providers
		console.log('2. Testing available providers...');
		const llmProviders = serviceManager.getAvailableProviders('llm');
		const embeddingProviders = serviceManager.getAvailableProviders('embedding');
		console.log('✅ LLM providers:', llmProviders);
		console.log('✅ Embedding providers:', embeddingProviders);
		console.log('');

		// Test 3: Test configuration (without actual Firebase - will show error)
		console.log('3. Testing configuration management...');
		const testUserId = 'test-user-123';

		const testLLMConfig: ServiceConfig = {
			mode: 'self-managed',
			providerId: 'openai',
			serviceType: 'llm',
			apiKey: 'test-key',
			additionalConfig: {
				model: 'gpt-4',
				maxTokens: 4096
			}
		};
		try {
			await serviceManager.updateServiceConfig(testUserId, 'llm', testLLMConfig);
			console.log('✅ Service configuration updated');
		} catch (error) {
			console.log('⚠️  Expected Firebase error (no admin credentials):', (error as Error).message);
		}

		// Test 4: Memory operations
		console.log('');
		console.log('4. Testing memory operations...');
		serviceManager.cleanupUserServices(testUserId);
		console.log('✅ User services cleaned up');

		console.log('\n🎉 ServiceManager tests completed!');
		console.log('\nTo fully test with Firebase:');
		console.log('1. Set up FIREBASE_ADMIN_CREDENTIALS environment variable');
		console.log('2. Install firebase-admin: npm install firebase-admin');
		console.log('3. Set up proper Firebase project configuration');

	} catch (error) {
		console.error('❌ Test failed:', error);
	}
}

// Run the test
if (require.main === module) {
	testServiceManager();
}
