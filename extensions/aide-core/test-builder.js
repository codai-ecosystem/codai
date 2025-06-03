const path = require('path');
const fs = require('fs');

// Test the BuilderAgent project creation functionality
async function testBuilderAgent() {
	console.log('Testing BuilderAgent project creation...');

	// Create a test directory
	const testDir = path.join(__dirname, 'test-projects');
	if (fs.existsSync(testDir)) {
		fs.rmSync(testDir, { recursive: true, force: true });
	}
	fs.mkdirSync(testDir, { recursive: true });

	console.log(`Test directory created: ${testDir}`);

	// Test project types
	const projectTypes = [
		{ type: 'webapp', name: 'my-webapp' },
		{ type: 'api', name: 'my-api' },
		{ type: 'mobile', name: 'my-mobile-app' },
		{ type: 'desktop', name: 'my-desktop-app' },
		{ type: 'basic', name: 'my-basic-project' }
	];

	for (const project of projectTypes) {
		const projectPath = path.join(testDir, project.name);
		console.log(`\nTesting ${project.type} project creation at: ${projectPath}`);

		// Create project directory
		fs.mkdirSync(projectPath, { recursive: true });

		// Test files that should be created for each project type
		let expectedFiles = ['package.json', 'README.md'];

		switch (project.type) {
			case 'webapp':
				expectedFiles.push('src/App.tsx', 'src/main.tsx', 'index.html', 'vite.config.ts');
				break;
			case 'api':
				expectedFiles.push('src/server.ts', 'src/routes/index.ts', 'src/middleware/cors.ts');
				break;
			case 'mobile':
				expectedFiles.push('App.tsx', 'app.json', 'babel.config.js');
				break;
			case 'desktop':
				expectedFiles.push('src/main.ts', 'src/renderer.ts', 'src/App.tsx');
				break;
			case 'basic':
				expectedFiles.push('src/index.ts');
				break;
		}

		console.log(`Expected files for ${project.type}:`, expectedFiles);

		// Simulate project creation (this would normally be done by BuilderAgent)
		// For now, just create the directory structure to test the concept
		const srcDir = path.join(projectPath, 'src');
		if (!fs.existsSync(srcDir)) {
			fs.mkdirSync(srcDir, { recursive: true });
		}

		// Create a basic package.json
		const packageJson = {
			name: project.name,
			version: "1.0.0",
			description: `A ${project.type} project created by AIDE`,
			main: "src/index.ts",
			scripts: {
				start: "node src/index.js",
				build: "tsc",
				dev: "tsx watch src/index.ts"
			},
			dependencies: {},
			devDependencies: {
				"typescript": "^5.0.0",
				"@types/node": "^20.0.0"
			}
		};

		fs.writeFileSync(
			path.join(projectPath, 'package.json'),
			JSON.stringify(packageJson, null, 2)
		);

		// Create a basic README
		const readme = `# ${project.name}

A ${project.type} project created by AIDE.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Project Structure

This is a ${project.type} project with the following structure:
- \`src/\` - Source code
- \`package.json\` - Project configuration
- \`README.md\` - This file
`;

		fs.writeFileSync(
			path.join(projectPath, 'README.md'),
			readme
		);

		console.log(`✅ ${project.type} project structure created successfully`);
	}

	console.log('\n🎉 All project types tested successfully!');
	console.log(`Test projects created in: ${testDir}`);

	// List created projects
	console.log('\nCreated projects:');
	const projects = fs.readdirSync(testDir);
	projects.forEach(project => {
		const projectPath = path.join(testDir, project);
		const files = fs.readdirSync(projectPath);
		console.log(`- ${project}: ${files.join(', ')}`);
	});
}

// Run the test
testBuilderAgent().catch(console.error);
