const vscode = require('vscode');

// Mock VS Code API for testing
const mockVscode = {
	authentication: {
		getSession: async (providerId, scopes, options) => {
			console.log(`Mock getSession called with provider: ${providerId}, scopes: ${scopes}`);
			return {
				accessToken: 'mock-access-token',
				account: {
					id: 'mock-user-id',
					label: 'Mock User',
				},
			};
		},
	},
	window: {
		showInformationMessage: message => console.log(`Info: ${message}`),
		showErrorMessage: message => console.log(`Error: ${message}`),
		showWarningMessage: message => console.log(`Warning: ${message}`),
	},
};

// Test GitHub Service functionality
async function testGitHubService() {
	console.log('Testing GitHub Service...');

	try {
		// Import the GitHub service (we need to mock vscode first)
		global.vscode = mockVscode;

		const { GitHubService } = require('./out/services/githubService');

		console.log('✅ GitHubService imported successfully');

		// Create instance
		const githubService = new GitHubService();
		console.log('✅ GitHubService instance created');

		// Test authentication (mock)
		console.log('\nTesting authentication...');
		await githubService.authenticate();
		console.log('✅ Authentication test completed');

		// Test user info (mock)
		console.log('\nTesting user info...');
		const userInfo = await githubService.getUserInfo();
		console.log('User info:', userInfo);

		console.log('\n🎉 GitHub Service tests completed successfully!');
	} catch (error) {
		console.error('❌ GitHub Service test failed:', error.message);
		console.error('Full error:', error);
	}
}

// Test Deployment Service functionality
async function testDeploymentService() {
	console.log('\nTesting Deployment Service...');

	try {
		// Import the Deployment service
		const { DeploymentService } = require('./out/services/deploymentService');

		console.log('✅ DeploymentService imported successfully');

		// Create instance
		const deploymentService = new DeploymentService();
		console.log('✅ DeploymentService instance created');

		// Test getting available platforms
		console.log('\nTesting available platforms...');
		const platforms = deploymentService.getAvailablePlatforms();
		console.log('Available platforms:', platforms);

		// Test project type recommendations
		console.log('\nTesting deployment recommendations...');
		const webappRec = deploymentService.getRecommendedPlatforms('webapp');
		const apiRec = deploymentService.getRecommendedPlatforms('api');

		console.log('Webapp recommendations:', webappRec);
		console.log('API recommendations:', apiRec);

		console.log('\n🎉 Deployment Service tests completed successfully!');
	} catch (error) {
		console.error('❌ Deployment Service test failed:', error.message);
		console.error('Full error:', error);
	}
}

// Run all tests
async function runTests() {
	console.log('=== AIDE Services Integration Tests ===\n');

	await testGitHubService();
	await testDeploymentService();

	console.log('\n=== All Tests Completed ===');
}

runTests().catch(console.error);
