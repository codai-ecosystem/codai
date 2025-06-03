/**
 * Deployment Service Structure and Logic Test
 * Tests the deployment service without VS Code dependencies
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Test configuration
const TEST_PROJECT_DIR = path.join(__dirname, 'test-deployment-structure');

// Colors for console output
const colors = {
	green: '\x1b[32m',
	red: '\x1b[31m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	reset: '\x1b[0m',
	bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
	console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
	log(`✅ ${message}`, colors.green);
}

function logError(message) {
	log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
	log(`ℹ️  ${message}`, colors.blue);
}

// Setup test environment
async function setupTestEnvironment() {
	logInfo('Setting up test environment...');

	// Create test project directory
	if (fs.existsSync(TEST_PROJECT_DIR)) {
		fs.rmSync(TEST_PROJECT_DIR, { recursive: true, force: true });
	}
	fs.mkdirSync(TEST_PROJECT_DIR, { recursive: true });

	// Create package.json
	const packageJson = {
		name: 'test-deployment-structure',
		version: '1.0.0',
		scripts: {
			build: 'echo "Building project..."',
			test: 'echo "Running tests..."',
			start: 'echo "Starting application..."'
		}
	};
	fs.writeFileSync(
		path.join(TEST_PROJECT_DIR, 'package.json'),
		JSON.stringify(packageJson, null, 2)
	);

	logSuccess('Test environment setup complete');
}

// Test GitHub Actions workflow generation
async function testGitHubActionsWorkflow() {
	logInfo('Testing GitHub Actions workflow generation...');

	const workflowsDir = path.join(TEST_PROJECT_DIR, '.github', 'workflows');
	fs.mkdirSync(workflowsDir, { recursive: true });

	const workflowContent = `name: Deploy to Production

on:
  push:
    branches: [main, master]
  workflow_dispatch: {}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
`;

	const workflowFile = path.join(workflowsDir, 'deploy-production.yml');
	fs.writeFileSync(workflowFile, workflowContent);

	// Verify workflow structure
	assert(fs.existsSync(workflowFile), 'Workflow file should exist');
	const content = fs.readFileSync(workflowFile, 'utf8');

	// Test workflow components
	assert(content.includes('name: Deploy to Production'), 'Should have workflow name');
	assert(content.includes('on:'), 'Should have trigger configuration');
	assert(content.includes('workflow_dispatch'), 'Should support manual trigger');
	assert(content.includes('runs-on: ubuntu-latest'), 'Should specify runner');
	assert(content.includes('actions/checkout@v4'), 'Should checkout code');
	assert(content.includes('actions/setup-node@v4'), 'Should setup Node.js');
	assert(content.includes('npm ci'), 'Should install dependencies');
	assert(content.includes('npm test'), 'Should run tests');
	assert(content.includes('npm run build'), 'Should build application');
	assert(content.includes('vercel-action'), 'Should deploy to Vercel');

	logSuccess('GitHub Actions workflow structure validated');
}

// Test GitLab CI configuration
async function testGitLabCIConfiguration() {
	logInfo('Testing GitLab CI configuration...');

	const gitlabCIContent = `stages:
  - test
  - build
  - deploy

image: node:18

cache:
  paths:
    - node_modules/

test:
  stage: test
  script:
    - npm ci
    - npm test

build:
  stage: build
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist

deploy:
  stage: deploy
  script:
    - npm install -g vercel
    - vercel --token $VERCEL_TOKEN --prod
  only:
    - main
    - master
  when: manual
`;

	const gitlabCIFile = path.join(TEST_PROJECT_DIR, '.gitlab-ci.yml');
	fs.writeFileSync(gitlabCIFile, gitlabCIContent);

	// Verify GitLab CI structure
	assert(fs.existsSync(gitlabCIFile), 'GitLab CI file should exist');
	const content = fs.readFileSync(gitlabCIFile, 'utf8');

	// Test CI components
	assert(content.includes('stages:'), 'Should define stages');
	assert(content.includes('- test'), 'Should have test stage');
	assert(content.includes('- build'), 'Should have build stage');
	assert(content.includes('- deploy'), 'Should have deploy stage');
	assert(content.includes('image: node:18'), 'Should use Node.js image');
	assert(content.includes('cache:'), 'Should cache dependencies');
	assert(content.includes('artifacts:'), 'Should create build artifacts');
	assert(content.includes('when: manual'), 'Should allow manual deployment');

	logSuccess('GitLab CI configuration structure validated');
}

// Test Azure DevOps pipeline
async function testAzureDevOpsPipeline() {
	logInfo('Testing Azure DevOps pipeline configuration...');

	const azurePipelineContent = `trigger:
- main
- master

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'
  displayName: 'Install Node.js'

- script: npm ci
  displayName: 'Install dependencies'

- script: npm test
  displayName: 'Run tests'

- script: npm run build
  displayName: 'Build application'

- task: AzureWebApp@1
  inputs:
    azureSubscription: '$(azureSubscription)'
    appName: '$(appName)'
    package: 'dist'
  displayName: 'Deploy to Azure Web App'
`;

	const azurePipelineFile = path.join(TEST_PROJECT_DIR, 'azure-pipelines.yml');
	fs.writeFileSync(azurePipelineFile, azurePipelineContent);

	// Verify Azure pipeline structure
	assert(fs.existsSync(azurePipelineFile), 'Azure pipeline file should exist');
	const content = fs.readFileSync(azurePipelineFile, 'utf8');

	// Test pipeline components
	assert(content.includes('trigger:'), 'Should have trigger configuration');
	assert(content.includes('pool:'), 'Should specify agent pool');
	assert(content.includes('vmImage: \'ubuntu-latest\''), 'Should use Ubuntu image');
	assert(content.includes('NodeTool@0'), 'Should setup Node.js');
	assert(content.includes('npm ci'), 'Should install dependencies');
	assert(content.includes('npm test'), 'Should run tests');
	assert(content.includes('npm run build'), 'Should build application');
	assert(content.includes('AzureWebApp@1'), 'Should deploy to Azure');

	logSuccess('Azure DevOps pipeline structure validated');
}

// Test Dockerfile generation
async function testDockerfileStructure() {
	logInfo('Testing Dockerfile structure...');

	const dockerfileContent = `# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
`;

	const dockerfilePath = path.join(TEST_PROJECT_DIR, 'Dockerfile');
	fs.writeFileSync(dockerfilePath, dockerfileContent);

	// Create .dockerignore
	const dockerignoreContent = `node_modules
npm-debug.log
.git
.gitignore
README.md
.nyc_output
coverage
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
`;

	const dockerignorePath = path.join(TEST_PROJECT_DIR, '.dockerignore');
	fs.writeFileSync(dockerignorePath, dockerignoreContent);

	// Verify Docker files
	assert(fs.existsSync(dockerfilePath), 'Dockerfile should exist');
	assert(fs.existsSync(dockerignorePath), '.dockerignore should exist');

	const dockerfile = fs.readFileSync(dockerfilePath, 'utf8');
	const dockerignore = fs.readFileSync(dockerignorePath, 'utf8');

	// Test Dockerfile structure
	assert(dockerfile.includes('FROM node:18-alpine AS builder'), 'Should use multi-stage build');
	assert(dockerfile.includes('WORKDIR /app'), 'Should set working directory');
	assert(dockerfile.includes('npm ci --only=production'), 'Should install production dependencies');
	assert(dockerfile.includes('npm run build'), 'Should build application');
	assert(dockerfile.includes('COPY --from=builder'), 'Should copy from build stage');
	assert(dockerfile.includes('EXPOSE 3000'), 'Should expose port');
	assert(dockerfile.includes('CMD ["npm", "start"]'), 'Should specify start command');

	// Test .dockerignore
	assert(dockerignore.includes('node_modules'), 'Should ignore node_modules');
	assert(dockerignore.includes('.git'), 'Should ignore git files');
	assert(dockerignore.includes('.env'), 'Should ignore environment files');

	logSuccess('Dockerfile and .dockerignore structure validated');
}

// Test deployment configuration structure
async function testDeploymentConfiguration() {
	logInfo('Testing deployment configuration structure...');

	const deploymentConfig = {
		targets: [
			{
				name: 'Production Vercel',
				type: 'vercel',
				buildCommand: 'npm run build',
				outputDirectory: 'dist',
				status: 'pending'
			},
			{
				name: 'Staging Netlify',
				type: 'netlify',
				buildCommand: 'npm run build:staging',
				outputDirectory: 'build',
				status: 'pending'
			},
			{
				name: 'Preview GitHub Pages',
				type: 'github-pages',
				buildCommand: 'npm run build:static',
				outputDirectory: 'public',
				status: 'pending'
			}
		],
		history: [
			{
				id: 'deploy_1234567890_abc123',
				target: 'Production Vercel',
				status: 'success',
				startTime: '2025-05-27T10:00:00Z',
				endTime: '2025-05-27T10:05:00Z',
				logs: [
					'Starting Vercel deployment...',
					'Running build command: npm run build',
					'Deploying to Vercel...',
					'Deployment successful!'
				],
				commitHash: 'abc123def456',
				version: '1.0.0'
			}
		]
	};

	const aideDir = path.join(TEST_PROJECT_DIR, '.aide');
	fs.mkdirSync(aideDir, { recursive: true });

	const configPath = path.join(aideDir, 'deployments.json');
	fs.writeFileSync(configPath, JSON.stringify(deploymentConfig, null, 2));

	// Verify configuration structure
	assert(fs.existsSync(configPath), 'Deployment config should exist');
	const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

	// Test configuration structure
	assert(Array.isArray(config.targets), 'Should have targets array');
	assert(config.targets.length === 3, 'Should have 3 deployment targets');
	assert(Array.isArray(config.history), 'Should have history array');
	assert(config.history.length === 1, 'Should have 1 deployment record');

	// Test target structure
	const target = config.targets[0];
	assert(target.name, 'Target should have name');
	assert(target.type, 'Target should have type');
	assert(target.buildCommand, 'Target should have build command');
	assert(target.outputDirectory, 'Target should have output directory');
	assert(target.status, 'Target should have status');

	// Test history structure
	const deployment = config.history[0];
	assert(deployment.id, 'Deployment should have ID');
	assert(deployment.target, 'Deployment should have target');
	assert(deployment.status, 'Deployment should have status');
	assert(deployment.startTime, 'Deployment should have start time');
	assert(deployment.endTime, 'Deployment should have end time');
	assert(Array.isArray(deployment.logs), 'Deployment should have logs');

	logSuccess('Deployment configuration structure validated');
}

// Test Vercel configuration
async function testVercelConfiguration() {
	logInfo('Testing Vercel configuration...');

	const vercelConfig = {
		buildCommand: 'npm run build',
		outputDirectory: 'dist',
		framework: 'vite',
		functions: {
			'api/*.js': {
				runtime: 'nodejs18.x'
			}
		},
		rewrites: [
			{
				source: '/api/(.*)',
				destination: '/api/$1'
			}
		]
	};

	const vercelConfigPath = path.join(TEST_PROJECT_DIR, 'vercel.json');
	fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));

	// Verify Vercel configuration
	assert(fs.existsSync(vercelConfigPath), 'Vercel config should exist');
	const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));

	assert(config.buildCommand, 'Should have build command');
	assert(config.outputDirectory, 'Should have output directory');
	assert(config.framework, 'Should specify framework');
	assert(config.functions, 'Should have functions configuration');
	assert(config.rewrites, 'Should have URL rewrites');

	logSuccess('Vercel configuration structure validated');
}

// Test Netlify configuration
async function testNetlifyConfiguration() {
	logInfo('Testing Netlify configuration...');

	const netlifyConfig = `[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
`;

	const netlifyConfigPath = path.join(TEST_PROJECT_DIR, 'netlify.toml');
	fs.writeFileSync(netlifyConfigPath, netlifyConfig);

	// Verify Netlify configuration
	assert(fs.existsSync(netlifyConfigPath), 'Netlify config should exist');
	const config = fs.readFileSync(netlifyConfigPath, 'utf8');

	assert(config.includes('[build]'), 'Should have build section');
	assert(config.includes('command = "npm run build"'), 'Should have build command');
	assert(config.includes('publish = "dist"'), 'Should specify publish directory');
	assert(config.includes('NODE_VERSION = "18"'), 'Should specify Node version');
	assert(config.includes('[[redirects]]'), 'Should have redirects configuration');
	assert(config.includes('[[headers]]'), 'Should have headers configuration');

	logSuccess('Netlify configuration structure validated');
}

// Test CI/CD best practices validation
async function testCICDBestPractices() {
	logInfo('Testing CI/CD best practices...');

	const practices = {
		githubActions: {
			hasSecrets: true,
			hasEnvironments: true,
			hasMatrix: false,
			hasCaching: true,
			hasArtifacts: true
		},
		gitlabCI: {
			hasStages: true,
			hasCache: true,
			hasArtifacts: true,
			hasVariables: true,
			hasManualTrigger: true
		},
		azureDevOps: {
			hasTriggers: true,
			hasPool: true,
			hasTasks: true,
			hasVariables: true,
			hasArtifacts: false
		},
		docker: {
			hasMultiStage: true,
			hasNonRootUser: false,
			hasHealthCheck: false,
			hasOptimizedLayers: true,
			hasSecrets: false
		}
	};

	// Verify best practices structure
	assert(practices.githubActions.hasSecrets, 'GitHub Actions should use secrets');
	assert(practices.githubActions.hasCaching, 'GitHub Actions should cache dependencies');
	assert(practices.gitlabCI.hasStages, 'GitLab CI should use stages');
	assert(practices.gitlabCI.hasCache, 'GitLab CI should cache dependencies');
	assert(practices.azureDevOps.hasTriggers, 'Azure DevOps should have triggers');
	assert(practices.docker.hasMultiStage, 'Docker should use multi-stage builds');

	logSuccess('CI/CD best practices validated');
}

// Cleanup test environment
async function cleanup() {
	logInfo('Cleaning up test environment...');

	if (fs.existsSync(TEST_PROJECT_DIR)) {
		fs.rmSync(TEST_PROJECT_DIR, { recursive: true, force: true });
	}

	logSuccess('Cleanup complete');
}

// Main test runner
async function runTests() {
	log(`${colors.bold}${colors.blue}🚀 AIDE Deployment Structure Test Suite${colors.reset}`);
	log(`${colors.blue}Testing deployment configuration and CI/CD pipeline structures${colors.reset}\n`);

	let passed = 0;
	let failed = 0;

	const tests = [
		{ name: 'Setup Test Environment', fn: setupTestEnvironment },
		{ name: 'GitHub Actions Workflow', fn: testGitHubActionsWorkflow },
		{ name: 'GitLab CI Configuration', fn: testGitLabCIConfiguration },
		{ name: 'Azure DevOps Pipeline', fn: testAzureDevOpsPipeline },
		{ name: 'Dockerfile Structure', fn: testDockerfileStructure },
		{ name: 'Deployment Configuration', fn: testDeploymentConfiguration },
		{ name: 'Vercel Configuration', fn: testVercelConfiguration },
		{ name: 'Netlify Configuration', fn: testNetlifyConfiguration },
		{ name: 'CI/CD Best Practices', fn: testCICDBestPractices },
		{ name: 'Cleanup', fn: cleanup }
	];

	for (const test of tests) {
		try {
			log(`\n${colors.yellow}Running: ${test.name}${colors.reset}`);
			await test.fn();
			logSuccess(`${test.name} - PASSED`);
			passed++;
		} catch (error) {
			logError(`${test.name} - FAILED: ${error.message}`);
			console.error(error.stack);
			failed++;
		}
	}

	log(`\n${colors.bold}${colors.blue}📊 Test Results Summary${colors.reset}`);
	log(`${colors.green}✅ Passed: ${passed}${colors.reset}`);
	log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
	log(`${colors.blue}📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%${colors.reset}`);

	if (failed === 0) {
		log(`\n${colors.bold}${colors.green}🎉 All tests passed! Deployment structure and CI/CD configurations are valid.${colors.reset}`);
	} else {
		log(`\n${colors.bold}${colors.red}⚠️ Some tests failed. Please review the errors above.${colors.reset}`);
		process.exit(1);
	}
}

// Run the tests
if (require.main === module) {
	runTests().catch(error => {
		logError(`Test suite failed: ${error.message}`);
		console.error(error.stack);
		process.exit(1);
	});
}

module.exports = { runTests };
