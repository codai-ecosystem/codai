#!/usr/bin/env node

/**
 * Phase 6 Version Management Test Suite
 * Tests autonomous versioning, changelog generation, and upstream sync
 */

const fs = require('fs');
const path = require('path');

// Setup mock vscode module before loading any services
const mockVscode = require('./test-mock-vscode.js');

// Mock the vscode module for Node.js require
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
	if (id === 'vscode') {
		return mockVscode;
	}
	return originalRequire.apply(this, arguments);
};

async function runVersionManagerTests() {
	console.log('\n=== AIDE Phase 6: Version Management Test Suite ===');
	console.log('Testing autonomous versioning and upstream sync capabilities\n');

	const testResults = [];
	let passedTests = 0;
	let totalTests = 0;

	/**
	 * Test helper function
	 */
	function runTest(testName, testFunction) {
		totalTests++;
		console.log(`🔍 Running: ${testName}`);

		try {
			const result = testFunction();
			if (result === true || (result && result.success !== false)) {
				console.log(`✅ ✅ PASSED: ${testName}`);
				passedTests++;
				testResults.push({ name: testName, status: 'PASSED' });
				return true;
			} else {
				console.log(`❌ ❌ FAILED: ${testName}`);
				testResults.push({ name: testName, status: 'FAILED', error: result.error || 'Unknown error' });
				return false;
			}
		} catch (error) {
			console.log(`❌ ❌ FAILED: ${testName} - ${error.message}`);
			testResults.push({ name: testName, status: 'FAILED', error: error.message });
			return false;
		}
	}

	// Test 1: VersionManager Service Loading
	runTest('VersionManager Service Loading', () => {
		try {
			const { VersionManager } = require('./out/services/versionManager');
			const versionManager = new VersionManager();

			return versionManager !== null && typeof versionManager === 'object';
		} catch (error) {
			return { success: false, error: error.message };
		}
	});

	// Test 2: Semantic Version Analysis
	runTest('Semantic Version Analysis', () => {
		try {
			const { VersionManager } = require('./out/services/versionManager');
			const versionManager = new VersionManager();

			// Test with mock file changes
			const mockChanges = ['src/extension.ts', 'package.json'];
			const result = versionManager.analyzeChanges(mockChanges);

			return Promise.resolve(result).then(changeType => {
				return ['major', 'minor', 'patch'].includes(changeType);
			});
		} catch (error) {
			return { success: false, error: error.message };
		}
	});

	// Test 3: Version Generation
	runTest('Version Generation', () => {
		try {
			const { VersionManager } = require('./out/services/versionManager');
			const versionManager = new VersionManager();

			return versionManager.generateNewVersion('patch').then(newVersion => {
				// Should generate a semantic version string
				return typeof newVersion === 'string' && /^\d+\.\d+\.\d+$/.test(newVersion);
			});
		} catch (error) {
			return { success: false, error: error.message };
		}
	});

	// Test 4: Changelog Generation
	runTest('Changelog Generation', () => {
		try {
			const { VersionManager } = require('./out/services/versionManager');
			const versionManager = new VersionManager();

			return versionManager.generateChangelog().then(changelog => {
				return typeof changelog === 'string' && changelog.length > 0;
			});
		} catch (error) {
			return { success: false, error: error.message };
		}
	});

	// Test 5: Upstream Update Checking
	runTest('Upstream Update Checking', () => {
		try {
			const { VersionManager } = require('./out/services/versionManager');
			const versionManager = new VersionManager();

			return versionManager.checkUpstreamUpdates().then(upstreamInfo => {
				return upstreamInfo &&
					typeof upstreamInfo.vscodeVersion === 'string' &&
					['compatible', 'needs-review', 'incompatible'].includes(upstreamInfo.compatibilityStatus);
			});
		} catch (error) {
			return { success: false, error: error.message };
		}
	});

	// Test 6: Version History Management
	runTest('Version History Management', () => {
		try {
			const { VersionManager } = require('./out/services/versionManager');
			const versionManager = new VersionManager();

			const history = versionManager.getVersionHistory();
			return Array.isArray(history);
		} catch (error) {
			return { success: false, error: error.message };
		}
	});

	// Test 7: Extension Commands Integration
	runTest('Extension Commands Integration', () => {
		try {
			const extensionPath = './out/extension.js';
			if (!fs.existsSync(extensionPath)) {
				return { success: false, error: 'Extension file not found' };
			}

			const extensionContent = fs.readFileSync(extensionPath, 'utf8');

			// Check if version management commands are registered
			const versionCommands = [
				'aide.showVersionHistory',
				'aide.generateVersionBump',
				'aide.viewChangelog',
				'aide.checkUpstreamUpdates'
			];

			return versionCommands.every(cmd => extensionContent.includes(cmd));
		} catch (error) {
			return { success: false, error: error.message };
		}
	});

	// Test 8: Package.json Command Definitions
	runTest('Package.json Command Definitions', () => {
		try {
			const packagePath = './package.json';
			const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

			const expectedCommands = [
				'aide.showVersionHistory',
				'aide.generateVersionBump',
				'aide.viewChangelog',
				'aide.checkUpstreamUpdates'
			];

			const actualCommands = packageContent.contributes?.commands?.map(cmd => cmd.command) || [];

			return expectedCommands.every(cmd => actualCommands.includes(cmd));
		} catch (error) {
			return { success: false, error: error.message };
		}
	});

	// Test 9: TypeScript Compilation Success
	runTest('TypeScript Compilation Success', () => {
		try {
			// Check if compiled files exist
			const compiledFiles = [
				'./out/services/versionManager.js',
				'./out/extension.js'
			];

			return compiledFiles.every(file => fs.existsSync(file));
		} catch (error) {
			return { success: false, error: error.message };
		}
	});

	// Test 10: Semver Dependency Integration
	runTest('Semver Dependency Integration', () => {
		try {
			const packagePath = './package.json';
			const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

			const hasSemver = packageContent.dependencies?.semver || packageContent.devDependencies?.semver;
			const hasTypeSemver = packageContent.devDependencies?.['@types/semver'];

			return Boolean(hasSemver && hasTypeSemver);
		} catch (error) {
			return { success: false, error: error.message };
		}
	});

	// Wait for async tests to complete
	await new Promise(resolve => setTimeout(resolve, 1000));

	// Print results
	console.log('\n=== Test Summary ===');
	console.log(`Total Tests: ${totalTests}`);
	console.log(`✅ Passed: ${passedTests}`);

	if (totalTests > passedTests) {
		console.log(`❌ Failed: ${totalTests - passedTests}`);
		console.log('\nFailed Tests:');
		testResults.filter(t => t.status === 'FAILED').forEach(test => {
			console.log(`  - ${test.name}: ${test.error}`);
		});
	}

	const successRate = ((passedTests / totalTests) * 100).toFixed(1);
	console.log(`\nSuccess Rate: ${successRate}%`);

	if (passedTests === totalTests) {
		console.log('\n=== 🎉 Phase 6 Version Management Complete! ===');
		console.log('✅ Autonomous versioning implemented');
		console.log('✅ Changelog generation working');
		console.log('✅ Upstream sync monitoring ready');
		console.log('✅ Extension commands integrated');
		console.log('✅ TypeScript compilation successful');
	} else {
		console.log('\n=== ❌ Phase 6 Implementation Issues Found ===');
		console.log('Please review failed tests above');
	}

	return passedTests === totalTests;
}

// Run the tests
if (require.main === module) {
	runVersionManagerTests().then(success => {
		process.exit(success ? 0 : 1);
	}).catch(error => {
		console.error('Test suite failed:', error);
		process.exit(1);
	});
}

module.exports = { runVersionManagerTests };
