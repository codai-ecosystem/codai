#!/usr/bin/env node

/**
 * Test script for AIDE Plugin System
 * Tests plugin generation, loading, and basic functionality
 */

const fs = require('fs');
const path = require('path');

// Mock VS Code modules for testing
const vscode = {
	workspace: {
		fs: {
			readFile: async (uri) => {
				const filePath = uri.fsPath || uri.path || uri;
				return Buffer.from(fs.readFileSync(filePath, 'utf8'));
			},
			writeFile: async (uri, data) => {
				const filePath = uri.fsPath || uri.path || uri;
				fs.writeFileSync(filePath, data);
			},
			readDirectory: async (uri) => {
				const dirPath = uri.fsPath || uri.path || uri;
				const items = fs.readdirSync(dirPath, { withFileTypes: true });
				return items.map(item => [
					item.name,
					item.isDirectory() ? 1 : 2 // FileType.Directory = 1, FileType.File = 2
				]);
			},
			createDirectory: async (uri) => {
				const dirPath = uri.fsPath || uri.path || uri;
				fs.mkdirSync(dirPath, { recursive: true });
			},
			stat: async (uri) => {
				const filePath = uri.fsPath || uri.path || uri;
				return fs.statSync(filePath);
			}
		},
		workspaceFolders: [{
			uri: {
				fsPath: __dirname,
				path: __dirname
			}
		}]
	},
	Uri: {
		file: (path) => ({ fsPath: path, path }),
		joinPath: (base, ...segments) => ({
			fsPath: path.join(base.fsPath || base.path, ...segments),
			path: path.join(base.fsPath || base.path, ...segments)
		})
	},
	window: {
		showInformationMessage: (msg) => console.log('INFO:', msg),
		showErrorMessage: (msg) => console.error('ERROR:', msg),
		showWarningMessage: (msg) => console.warn('WARN:', msg)
	},
	FileType: {
		Directory: 1,
		File: 2
	}
};

// Mock the required modules
global.vscode = vscode;

// Load the plugin system modules
const PluginGenerator = require('./out/plugins/pluginGenerator').PluginGenerator;
const PluginManager = require('./out/plugins/pluginManager').PluginManager;

// Mock memory graph
const mockMemoryGraph = {
	addNode: () => { },
	addRelation: () => { },
	updateNode: () => { }
};

async function testPluginGeneration() {
	console.log('🧪 Testing Plugin Generation System...\n');

	const generator = new PluginGenerator();
	const testPluginsDir = path.join(__dirname, '.aide', 'plugins');

	// Ensure test directory exists
	if (!fs.existsSync(testPluginsDir)) {
		fs.mkdirSync(testPluginsDir, { recursive: true });
	}

	const testCases = [
		{
			type: 'agent',
			name: 'Test Agent Plugin',
			id: 'test-agent-plugin',
			author: 'Test Author',
			description: 'A test agent plugin for validation',
			outputPath: path.join(testPluginsDir, 'test-agent-plugin')
		},
		{
			type: 'command',
			name: 'Test Command Plugin',
			id: 'test-command-plugin',
			author: 'Test Author',
			description: 'A test command plugin for validation',
			outputPath: path.join(testPluginsDir, 'test-command-plugin')
		}
	];

	let successCount = 0;
	let totalTests = testCases.length;

	for (const testCase of testCases) {
		try {
			console.log(`📦 Creating ${testCase.type} plugin: ${testCase.name}`);

			const success = await generator.generatePlugin(
				testCase.type,
				testCase.name,
				testCase.id,
				testCase.author,
				testCase.description,
				testCase.outputPath
			);

			if (success) {
				console.log(`✅ Plugin generated successfully at: ${testCase.outputPath}`);

				// Verify essential files exist
				const expectedFiles = [
					'package.json',
					'src/extension.ts',
					'tsconfig.json'
				];

				let allFilesExist = true;
				for (const file of expectedFiles) {
					const filePath = path.join(testCase.outputPath, file);
					if (!fs.existsSync(filePath)) {
						console.log(`❌ Missing expected file: ${file}`);
						allFilesExist = false;
					}
				}

				if (allFilesExist) {
					console.log(`✅ All expected files created for ${testCase.id}`);
					successCount++;
				} else {
					console.log(`❌ Some files missing for ${testCase.id}`);
				}

				// Verify package.json content
				const packageJsonPath = path.join(testCase.outputPath, 'package.json');
				const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

				if (packageJson.name === testCase.id && packageJson.displayName === testCase.name) {
					console.log(`✅ Package.json content is correct for ${testCase.id}`);
				} else {
					console.log(`❌ Package.json content is incorrect for ${testCase.id}`);
				}

			} else {
				console.log(`❌ Failed to generate plugin: ${testCase.name}`);
			}
		} catch (error) {
			console.error(`❌ Error generating plugin ${testCase.name}:`, error.message);
		}
		console.log('');
	}

	console.log(`📊 Plugin Generation Results: ${successCount}/${totalTests} successful\n`);
	return successCount === totalTests;
}

async function testPluginDiscovery() {
	console.log('🔍 Testing Plugin Discovery System...\n');

	const manager = new PluginManager(mockMemoryGraph);

	try {
		const discoveredPlugins = await manager.discoverPlugins();
		console.log(`✅ Discovered ${discoveredPlugins.length} plugins`);

		for (const plugin of discoveredPlugins) {
			console.log(`📦 Found plugin: ${plugin.name} (${plugin.id}) v${plugin.version}`);
			console.log(`   Description: ${plugin.description}`);
			console.log(`   Author: ${plugin.author}`);
		}

		return discoveredPlugins.length > 0;
	} catch (error) {
		console.error('❌ Error discovering plugins:', error.message);
		return false;
	}
}

async function testPluginLoading() {
	console.log('🔄 Testing Plugin Loading System...\n');

	const manager = new PluginManager(mockMemoryGraph);

	try {
		const testPluginPath = path.join(__dirname, '.aide', 'plugins', 'test-agent-plugin');

		if (fs.existsSync(testPluginPath)) {
			console.log(`📂 Attempting to load plugin from: ${testPluginPath}`);

			const success = await manager.loadPlugin(testPluginPath);

			if (success) {
				console.log('✅ Plugin loaded successfully');

				const loadedPlugins = manager.getLoadedPlugins();
				console.log(`📊 Total loaded plugins: ${loadedPlugins.length}`);

				for (const plugin of loadedPlugins) {
					console.log(`   - ${plugin.name} (${plugin.id})`);
				}

				return true;
			} else {
				console.log('❌ Plugin loading failed');
				return false;
			}
		} else {
			console.log('⚠️  Test plugin directory not found, skipping load test');
			return true; // Not a failure, just no plugin to test
		}
	} catch (error) {
		console.error('❌ Error loading plugin:', error.message);
		return false;
	}
}

async function runAllTests() {
	console.log('🚀 AIDE Plugin System Test Suite\n');
	console.log('='.repeat(50));

	const results = {};

	// Test 1: Plugin Generation
	results.generation = await testPluginGeneration();

	// Test 2: Plugin Discovery
	results.discovery = await testPluginDiscovery();

	// Test 3: Plugin Loading
	results.loading = await testPluginLoading();

	// Summary
	console.log('\n' + '='.repeat(50));
	console.log('📋 Test Results Summary:');
	console.log('='.repeat(50));

	const testResults = [
		{ name: 'Plugin Generation', result: results.generation },
		{ name: 'Plugin Discovery', result: results.discovery },
		{ name: 'Plugin Loading', result: results.loading }
	];

	let passedTests = 0;
	for (const test of testResults) {
		const status = test.result ? '✅ PASS' : '❌ FAIL';
		console.log(`${test.name}: ${status}`);
		if (test.result) passedTests++;
	}

	console.log('\n' + '='.repeat(50));
	console.log(`🎯 Overall Result: ${passedTests}/${testResults.length} tests passed`);

	if (passedTests === testResults.length) {
		console.log('🎉 All tests passed! Plugin system is working correctly.');
		process.exit(0);
	} else {
		console.log('⚠️  Some tests failed. Please review the output above.');
		process.exit(1);
	}
}

// Run the test suite
runAllTests().catch(error => {
	console.error('💥 Test suite crashed:', error);
	process.exit(1);
});
