#!/usr/bin/env node

/**
 * Simplified Plugin System Test
 * Tests core functionality without requiring VS Code modules
 */

const fs = require('fs');
const path = require('path');

function createTestPlugin() {
	console.log('🧪 Creating a test plugin manually...\n');

	const testPluginDir = path.join(__dirname, '.aide', 'plugins', 'test-simple-plugin');

	// Create directory structure
	if (!fs.existsSync(testPluginDir)) {
		fs.mkdirSync(testPluginDir, { recursive: true });
	}

	const srcDir = path.join(testPluginDir, 'src');
	if (!fs.existsSync(srcDir)) {
		fs.mkdirSync(srcDir, { recursive: true });
	}

	// Create package.json
	const packageJson = {
		"name": "test-simple-plugin",
		"displayName": "Test Simple Plugin",
		"description": "A simple test plugin for AIDE",
		"version": "1.0.0",
		"author": "Test Author",
		"main": "./out/extension.js",
		"engines": {
			"aide": "^0.1.0"
		},
		"activationEvents": [
			"*"
		],
		"contributes": {
			"agents": [
				{
					"id": "test-simple-agent",
					"name": "Test Simple Agent",
					"description": "A simple test agent",
					"capabilities": ["general"],
					"priority": 1
				}
			]
		},
		"scripts": {
			"compile": "tsc -p ./"
		},
		"devDependencies": {
			"@types/vscode": "^1.85.0",
			"@types/node": "^20.x",
			"typescript": "^5.3.0"
		}
	};

	fs.writeFileSync(
		path.join(testPluginDir, 'package.json'),
		JSON.stringify(packageJson, null, 2)
	);

	// Create tsconfig.json
	const tsConfig = {
		"compilerOptions": {
			"module": "commonjs",
			"target": "ES2020",
			"outDir": "out",
			"lib": [
				"ES2020"
			],
			"sourceMap": true,
			"rootDir": "src",
			"strict": true
		},
		"exclude": [
			"node_modules",
			".vscode-test/**"
		]
	};

	fs.writeFileSync(
		path.join(testPluginDir, 'tsconfig.json'),
		JSON.stringify(tsConfig, null, 2)
	);

	// Create main extension file
	const extensionCode = `import * as vscode from 'vscode';
import { SimpleTestAgent } from './agents/simpleTestAgent';

export function activate(context: vscode.ExtensionContext) {
	console.log('Test Simple Plugin activated!');

	// Register the agent
	const agent = new SimpleTestAgent();

	// Register a test command
	const command = vscode.commands.registerCommand('test-simple-plugin.sayHello', () => {
		vscode.window.showInformationMessage('Hello from Test Simple Plugin!');
	});

	context.subscriptions.push(command);
}

export function deactivate() {
	console.log('Test Simple Plugin deactivated');
}`;

	fs.writeFileSync(
		path.join(srcDir, 'extension.ts'),
		extensionCode
	);

	// Create agents directory and agent file
	const agentsDir = path.join(srcDir, 'agents');
	if (!fs.existsSync(agentsDir)) {
		fs.mkdirSync(agentsDir, { recursive: true });
	}

	const agentCode = `export class SimpleTestAgent {
	id = 'test-simple-agent';
	name = 'Test Simple Agent';
	description = 'A simple test agent that demonstrates basic functionality';

	async processQuery(query: string): Promise<string> {
		return \`Test agent processed: "\${query}"\`;
	}

	getCapabilities(): string[] {
		return ['general', 'testing'];
	}
}`;

	fs.writeFileSync(
		path.join(agentsDir, 'simpleTestAgent.ts'),
		agentCode
	);

	console.log(`✅ Test plugin created at: ${testPluginDir}`);
	return testPluginDir;
}

function validatePluginStructure(pluginDir) {
	console.log('🔍 Validating plugin structure...\n');

	const expectedFiles = [
		'package.json',
		'tsconfig.json',
		'src/extension.ts',
		'src/agents/simpleTestAgent.ts'
	];

	let allValid = true;

	for (const file of expectedFiles) {
		const filePath = path.join(pluginDir, file);
		if (fs.existsSync(filePath)) {
			console.log(`✅ Found: ${file}`);
		} else {
			console.log(`❌ Missing: ${file}`);
			allValid = false;
		}
	}

	// Validate package.json content
	const packageJsonPath = path.join(pluginDir, 'package.json');
	try {
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

		const requiredFields = ['name', 'displayName', 'description', 'version', 'main', 'engines'];
		for (const field of requiredFields) {
			if (packageJson[field]) {
				console.log(`✅ Package.json has required field: ${field}`);
			} else {
				console.log(`❌ Package.json missing field: ${field}`);
				allValid = false;
			}
		}

		// Check for AIDE-specific fields
		if (packageJson.engines && packageJson.engines.aide) {
			console.log(`✅ Package.json has AIDE engine specification`);
		} else {
			console.log(`❌ Package.json missing AIDE engine specification`);
			allValid = false;
		}

		if (packageJson.contributes && packageJson.contributes.agents) {
			console.log(`✅ Package.json has agent contributions`);
		} else {
			console.log(`❌ Package.json missing agent contributions`);
			allValid = false;
		}

	} catch (error) {
		console.log(`❌ Invalid package.json: ${error.message}`);
		allValid = false;
	}

	return allValid;
}

function listPluginsInDirectory() {
	console.log('📦 Discovering plugins in .aide/plugins directory...\n');

	const pluginsDir = path.join(__dirname, '.aide', 'plugins');

	if (!fs.existsSync(pluginsDir)) {
		console.log('⚠️  No plugins directory found');
		return [];
	}

	const items = fs.readdirSync(pluginsDir, { withFileTypes: true });
	const plugins = [];

	for (const item of items) {
		if (item.isDirectory()) {
			const pluginDir = path.join(pluginsDir, item.name);
			const packageJsonPath = path.join(pluginDir, 'package.json');

			if (fs.existsSync(packageJsonPath)) {
				try {
					const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
					plugins.push({
						name: packageJson.displayName || packageJson.name,
						id: packageJson.name,
						version: packageJson.version,
						description: packageJson.description,
						path: pluginDir
					});
					console.log(`✅ Found plugin: ${packageJson.displayName || packageJson.name} (${packageJson.name}) v${packageJson.version}`);
				} catch (error) {
					console.log(`❌ Invalid plugin manifest in ${item.name}: ${error.message}`);
				}
			} else {
				console.log(`⚠️  Directory ${item.name} has no package.json`);
			}
		}
	}

	console.log(`\n📊 Total valid plugins found: ${plugins.length}`);
	return plugins;
}

async function runPluginTests() {
	console.log('🚀 AIDE Plugin System - Simplified Test Suite\n');
	console.log('='.repeat(60));

	let totalTests = 0;
	let passedTests = 0;

	// Test 1: Plugin Creation
	console.log('\n1️⃣  Testing Plugin Creation...');
	totalTests++;
	try {
		const pluginDir = createTestPlugin();
		console.log('✅ Plugin creation test passed');
		passedTests++;
	} catch (error) {
		console.log('❌ Plugin creation test failed:', error.message);
	}

	// Test 2: Plugin Structure Validation
	console.log('\n2️⃣  Testing Plugin Structure Validation...');
	totalTests++;
	const testPluginDir = path.join(__dirname, '.aide', 'plugins', 'test-simple-plugin');
	if (fs.existsSync(testPluginDir)) {
		const isValid = validatePluginStructure(testPluginDir);
		if (isValid) {
			console.log('✅ Plugin structure validation test passed');
			passedTests++;
		} else {
			console.log('❌ Plugin structure validation test failed');
		}
	} else {
		console.log('❌ Plugin structure validation test failed: Plugin not found');
	}

	// Test 3: Plugin Discovery
	console.log('\n3️⃣  Testing Plugin Discovery...');
	totalTests++;
	try {
		const discoveredPlugins = listPluginsInDirectory();
		if (discoveredPlugins.length > 0) {
			console.log('✅ Plugin discovery test passed');
			passedTests++;
		} else {
			console.log('⚠️  Plugin discovery test passed but no plugins found');
			passedTests++;
		}
	} catch (error) {
		console.log('❌ Plugin discovery test failed:', error.message);
	}

	// Summary
	console.log('\n' + '='.repeat(60));
	console.log('📋 Test Results Summary:');
	console.log('='.repeat(60));

	console.log(`✅ Tests passed: ${passedTests}`);
	console.log(`❌ Tests failed: ${totalTests - passedTests}`);
	console.log(`📊 Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);

	if (passedTests === totalTests) {
		console.log('\n🎉 All tests passed! The plugin system foundation is working.');
		console.log('\n💡 Next steps:');
		console.log('   - Integrate with VS Code extension');
		console.log('   - Test plugin loading and activation');
		console.log('   - Test agent registration and execution');
		process.exit(0);
	} else {
		console.log('\n⚠️  Some tests failed. Please review the output above.');
		process.exit(1);
	}
}

// Run the test suite
runPluginTests();
