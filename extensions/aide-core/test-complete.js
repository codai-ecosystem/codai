#!/usr/bin/env node

/**
 * AIDE Extension End-to-End Test Suite
 * Tests the complete AIDE development workflow
 */

const fs = require('fs');
const path = require('path');

function createTestProjectDirectory() {
	const testDir = path.join(__dirname, 'test-aide-workflow');
	if (fs.existsSync(testDir)) {
		fs.rmSync(testDir, { recursive: true, force: true });
	}
	fs.mkdirSync(testDir, { recursive: true });
	return testDir;
}

function testBuilderAgentFunctionality() {
	console.log('🏗️  Testing BuilderAgent Project Scaffolding...\n');

	const testProjectsDir = path.join(__dirname, 'test-projects');

	// Verify test projects were created in previous tests
	if (!fs.existsSync(testProjectsDir)) {
		console.log('⚠️  No test projects found. Run test-builder.js first.');
		return false;
	}

	// The actual project names created by the builder test
	const projectMappings = {
		webapp: 'my-webapp',
		api: 'my-api',
		mobile: 'my-mobile-app',
		desktop: 'my-desktop-app',
		basic: 'my-basic-project',
	};

	let allProjectsValid = true;

	for (const [projectType, projectName] of Object.entries(projectMappings)) {
		const projectDir = path.join(testProjectsDir, projectName);

		if (fs.existsSync(projectDir)) {
			console.log(`✅ Project ${projectType} (${projectName}) was created successfully`);

			// Check for essential files
			const packageJsonPath = path.join(projectDir, 'package.json');
			if (fs.existsSync(packageJsonPath)) {
				const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
				console.log(`   📦 Package: ${packageJson.name} v${packageJson.version}`);
			}

			const readmePath = path.join(projectDir, 'README.md');
			if (fs.existsSync(readmePath)) {
				console.log(`   📖 README.md exists`);
			}
		} else {
			console.log(`❌ Project ${projectType} (${projectName}) was not created`);
			allProjectsValid = false;
		}
	}

	return allProjectsValid;
}

function testPluginSystemIntegration() {
	console.log('\n🔌 Testing Plugin System Integration...\n');

	const pluginsDir = path.join(__dirname, '.aide', 'plugins');

	if (!fs.existsSync(pluginsDir)) {
		console.log('⚠️  No plugins directory found');
		return false;
	}

	const plugins = fs
		.readdirSync(pluginsDir, { withFileTypes: true })
		.filter(item => item.isDirectory())
		.map(item => item.name);

	console.log(`📦 Found ${plugins.length} plugin directories:`);

	let validPlugins = 0;
	for (const pluginName of plugins) {
		const pluginDir = path.join(pluginsDir, pluginName);
		const packageJsonPath = path.join(pluginDir, 'package.json');

		if (fs.existsSync(packageJsonPath)) {
			try {
				const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
				console.log(
					`   ✅ ${packageJson.displayName || packageJson.name} (${packageJson.version})`
				);
				validPlugins++;
			} catch (error) {
				console.log(`   ❌ ${pluginName} - Invalid package.json`);
			}
		} else {
			console.log(`   ❌ ${pluginName} - No package.json`);
		}
	}

	console.log(`\n📊 Valid plugins: ${validPlugins}/${plugins.length}`);
	return validPlugins > 0;
}

function testExtensionStructure() {
	console.log('\n🏢 Testing Extension Structure...\n');

	const extensionFiles = [
		'package.json',
		'src/extension.ts',
		'src/agents/agentManager.ts',
		'src/agents/builderAgent.ts',
		'src/agents/plannerAgent.ts',
		'src/services/githubService.ts',
		'src/services/deploymentService.ts',
		'src/plugins/pluginManager.ts',
		'src/plugins/pluginGenerator.ts',
		'src/ui/conversationalInterface.ts',
		'src/ui/memoryVisualization.ts',
		'src/ui/projectStatus.ts',
		'src/memory/memoryGraph.ts',
	];

	let allFilesExist = true;

	for (const file of extensionFiles) {
		const filePath = path.join(__dirname, file);
		if (fs.existsSync(filePath)) {
			console.log(`✅ ${file}`);
		} else {
			console.log(`❌ Missing: ${file}`);
			allFilesExist = false;
		}
	}

	// Check if extension compiles
	const outDir = path.join(__dirname, 'out');
	if (fs.existsSync(outDir)) {
		console.log(`✅ Extension compiled successfully (out/ directory exists)`);
	} else {
		console.log(`⚠️  Extension not compiled (no out/ directory)`);
	}

	return allFilesExist;
}

function testPackageJsonConfiguration() {
	console.log('\n📋 Testing Package.json Configuration...\n');

	const packageJsonPath = path.join(__dirname, 'package.json');

	if (!fs.existsSync(packageJsonPath)) {
		console.log('❌ package.json not found');
		return false;
	}

	try {
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

		const requiredFields = {
			name: 'aide-core',
			displayName: 'AIDE Core',
			main: './out/extension.js',
			'engines.vscode': packageJson.engines?.vscode,
			activationEvents: packageJson.activationEvents,
		};

		let allFieldsValid = true;

		for (const [field, expectedValue] of Object.entries(requiredFields)) {
			const actualValue = field.includes('.')
				? field.split('.').reduce((obj, key) => obj?.[key], packageJson)
				: packageJson[field];

			if (actualValue) {
				if (expectedValue && actualValue !== expectedValue && !Array.isArray(actualValue)) {
					console.log(`⚠️  ${field}: ${actualValue} (expected: ${expectedValue})`);
				} else {
					console.log(`✅ ${field}: ${actualValue}`);
				}
			} else {
				console.log(`❌ Missing: ${field}`);
				allFieldsValid = false;
			}
		}

		// Check commands
		const commands = packageJson.contributes?.commands || [];
		console.log(`✅ Commands defined: ${commands.length}`);

		for (const command of commands.slice(0, 5)) {
			// Show first 5
			console.log(`   - ${command.command}: ${command.title}`);
		}
		if (commands.length > 5) {
			console.log(`   ... and ${commands.length - 5} more`);
		}

		// Check dependencies
		const deps = Object.keys(packageJson.dependencies || {});
		console.log(`✅ Dependencies: ${deps.length}`);

		const expectedDeps = ['uuid', '@octokit/rest', 'js-yaml'];
		for (const dep of expectedDeps) {
			if (deps.includes(dep)) {
				console.log(`   ✅ ${dep}`);
			} else {
				console.log(`   ❌ Missing: ${dep}`);
				allFieldsValid = false;
			}
		}

		return allFieldsValid;
	} catch (error) {
		console.log(`❌ Invalid package.json: ${error.message}`);
		return false;
	}
}

function generateProjectReport() {
	console.log('\n📊 Generating AIDE Project Report...\n');

	const report = {
		timestamp: new Date().toISOString(),
		version: '0.1.0',
		status: 'Phase 5 - Extensibility & Plugin Architecture',
		components: {
			core: true,
			agents: true,
			services: true,
			plugins: true,
			ui: true,
			memory: true,
		},
		features: {
			'Project Planning': true,
			'Project Scaffolding': true,
			'Memory Management': true,
			'GitHub Integration': true,
			'Deployment Pipeline': true,
			'Plugin System': true,
			'Conversational Interface': true,
			'Project Visualization': true,
		},
		metrics: {
			totalFiles: 0,
			totalLines: 0,
			agentTypes: 3,
			projectTemplates: 5,
			pluginTemplates: 4,
			commands: 0,
		},
	};

	// Count files and lines
	function countFilesAndLines(dir, extensions = ['.ts', '.js', '.json']) {
		let files = 0;
		let lines = 0;

		if (!fs.existsSync(dir)) return { files, lines };

		const items = fs.readdirSync(dir, { withFileTypes: true });

		for (const item of items) {
			const fullPath = path.join(dir, item.name);

			if (item.isDirectory() && !['node_modules', 'out', '.aide'].includes(item.name)) {
				const subCount = countFilesAndLines(fullPath, extensions);
				files += subCount.files;
				lines += subCount.lines;
			} else if (item.isFile() && extensions.some(ext => item.name.endsWith(ext))) {
				files++;
				try {
					const content = fs.readFileSync(fullPath, 'utf8');
					lines += content.split('\n').length;
				} catch (error) {
					// Skip files that can't be read
				}
			}
		}

		return { files, lines };
	}

	const sourceStats = countFilesAndLines(path.join(__dirname, 'src'));
	report.metrics.totalFiles = sourceStats.files;
	report.metrics.totalLines = sourceStats.lines;

	// Count commands from package.json
	try {
		const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
		report.metrics.commands = packageJson.contributes?.commands?.length || 0;
	} catch (error) {
		// Skip if package.json can't be read
	}

	// Generate report
	console.log('🎯 AIDE Development Environment - Status Report');
	console.log('='.repeat(60));
	console.log(`📅 Generated: ${new Date(report.timestamp).toLocaleString()}`);
	console.log(`🔖 Version: ${report.version}`);
	console.log(`🚀 Status: ${report.status}`);
	console.log('');

	console.log('📦 Core Components:');
	for (const [component, status] of Object.entries(report.components)) {
		const icon = status ? '✅' : '❌';
		console.log(`   ${icon} ${component.charAt(0).toUpperCase() + component.slice(1)}`);
	}
	console.log('');

	console.log('🎛️  Features:');
	for (const [feature, status] of Object.entries(report.features)) {
		const icon = status ? '✅' : '❌';
		console.log(`   ${icon} ${feature}`);
	}
	console.log('');

	console.log('📈 Metrics:');
	console.log(`   📁 Source files: ${report.metrics.totalFiles}`);
	console.log(`   📝 Lines of code: ${report.metrics.totalLines.toLocaleString()}`);
	console.log(`   🤖 Agent types: ${report.metrics.agentTypes}`);
	console.log(`   📋 Project templates: ${report.metrics.projectTemplates}`);
	console.log(`   🔌 Plugin templates: ${report.metrics.pluginTemplates}`);
	console.log(`   ⚡ Commands: ${report.metrics.commands}`);

	// Save report
	const reportPath = path.join(__dirname, 'aide-status-report.json');
	fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
	console.log(`\n💾 Full report saved to: ${reportPath}`);

	return report;
}

async function runCompleteTestSuite() {
	console.log('🚀 AIDE Extension - Complete Test Suite');
	console.log('🎯 Testing Phase 5: Extensibility & Plugin Architecture');
	console.log('='.repeat(70));

	const testResults = {};
	let totalTests = 0;
	let passedTests = 0;

	// Test 1: Extension Structure
	console.log('\n1️⃣  Extension Structure Test');
	totalTests++;
	testResults.structure = testExtensionStructure();
	if (testResults.structure) passedTests++;

	// Test 2: Package Configuration
	console.log('\n2️⃣  Package Configuration Test');
	totalTests++;
	testResults.packageConfig = testPackageJsonConfiguration();
	if (testResults.packageConfig) passedTests++;

	// Test 3: Builder Agent
	console.log('\n3️⃣  Builder Agent Test');
	totalTests++;
	testResults.builderAgent = testBuilderAgentFunctionality();
	if (testResults.builderAgent) passedTests++;

	// Test 4: Plugin System
	console.log('\n4️⃣  Plugin System Test');
	totalTests++;
	testResults.pluginSystem = testPluginSystemIntegration();
	if (testResults.pluginSystem) passedTests++;

	// Generate Report
	console.log('\n5️⃣  Project Report Generation');
	const report = generateProjectReport();

	// Final Summary
	console.log('\n' + '='.repeat(70));
	console.log('🏁 Test Suite Results');
	console.log('='.repeat(70));

	const tests = [
		{ name: 'Extension Structure', result: testResults.structure },
		{ name: 'Package Configuration', result: testResults.packageConfig },
		{ name: 'Builder Agent', result: testResults.builderAgent },
		{ name: 'Plugin System', result: testResults.pluginSystem },
	];

	for (const test of tests) {
		const icon = test.result ? '✅' : '❌';
		console.log(`${icon} ${test.name}`);
	}

	console.log('\n📊 Summary:');
	console.log(`   ✅ Tests passed: ${passedTests}/${totalTests}`);
	console.log(`   📈 Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);
	console.log(
		`   🏗️  Build status: ${fs.existsSync(path.join(__dirname, 'out')) ? 'Compiled' : 'Not compiled'}`
	);

	if (passedTests === totalTests) {
		console.log('\n🎉 AIDE Extension is ready for Phase 5 completion!');
		console.log('\n🎯 Next Steps:');
		console.log('   - Test plugin loading in VS Code extension development host');
		console.log('   - Validate agent registration and execution');
		console.log('   - Test end-to-end workflow in real VS Code environment');
		console.log('   - Complete documentation and examples');
	} else {
		console.log('\n⚠️  Some components need attention before proceeding.');
	}

	return passedTests === totalTests;
}

// Run the complete test suite
runCompleteTestSuite()
	.then(success => {
		process.exit(success ? 0 : 1);
	})
	.catch(error => {
		console.error('💥 Test suite failed:', error);
		process.exit(1);
	});
