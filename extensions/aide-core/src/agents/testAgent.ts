import { BaseAgent } from './baseAgent';
import { IMemoryGraph } from '../interfaces/IMemoryGraph';
import { AgentResponse, AgentAction } from './agentManager';

export class TestAgent extends BaseAgent {
	constructor(memoryGraph: IMemoryGraph, aiService: any) {
		super(memoryGraph, 'test', aiService);
	}

	async process(message: string, intentId: string): Promise<AgentResponse> {
		const context = this.getRelatedContext(message);
		const testType = this.determineTestType(message);

		let response: string;
		const actions: AgentAction[] = [];

		switch (testType) {
			case 'unit':
				response = await this.createUnitTests(message, intentId, context, actions);
				break;
			case 'integration':
				response = await this.createIntegrationTests(message, intentId, context, actions);
				break;
			case 'e2e':
				response = await this.createE2ETests(message, intentId, context, actions);
				break;
			case 'performance':
				response = await this.createPerformanceTests(message, intentId, context, actions);
				break;
			default:
				response = await this.analyzeTestRequirements(message, intentId, context, actions);
		}

		return {
			agent: 'test',
			message: response,
			actions,
			metadata: {
				testType,
				actionsGenerated: actions.length,
				contextItems: context.length,
			},
		};
	}

	async getStatus(): Promise<Record<string, any>> {
		// This would typically query actual test results
		return {
			totalTests: 0,
			passingTests: 0,
			failingTests: 0,
			coverage: '0%',
			recentTests: [],
			testTypes: {
				unit: 0,
				integration: 0,
				e2e: 0,
				performance: 0,
			},
		};
	}

	private determineTestType(message: string): string {
		const lowercaseMessage = message.toLowerCase();

		if (lowercaseMessage.includes('unit') || lowercaseMessage.includes('function')) {
			return 'unit';
		}
		if (lowercaseMessage.includes('integration') || lowercaseMessage.includes('api')) {
			return 'integration';
		}
		if (lowercaseMessage.includes('e2e') || lowercaseMessage.includes('end-to-end')) {
			return 'e2e';
		}
		if (lowercaseMessage.includes('performance') || lowercaseMessage.includes('load')) {
			return 'performance';
		}

		return 'general';
	}
	private async createUnitTests(
		message: string,
		intentId: string,
		context: string[],
		actions: AgentAction[]
	): Promise<string> {
		const systemPrompt = `You are a testing agent responsible for creating comprehensive unit tests. Your task is to:
1. Analyze code requirements and create thorough test cases
2. Generate unit tests with excellent coverage (aim for 90%+)
3. Follow testing best practices and patterns
4. Create readable, maintainable test code
5. Include edge cases and error scenarios
6. Use appropriate testing frameworks and tools

Focus on creating tests that are reliable, fast, and provide meaningful feedback for developers.`;

		const prompt = `Create unit tests for: "${message}". Generate comprehensive test cases with good coverage.

Context: ${context.join('\n')}

Please provide:
1. Complete unit test suite
2. Test cases covering happy path and edge cases
3. Mock implementations where needed
4. Test configuration and setup
5. Code coverage goals and strategies
6. Best practices for maintainable tests`;

		const aiResponse = await this.generateAIResponse(prompt, context, systemPrompt);

		// Generate unit test files
		actions.push({
			type: 'createFile',
			target: 'src/__tests__/unit/example.test.ts',
			content: this.generateUnitTestCode(),
		});

		actions.push({
			type: 'createFile',
			target: 'jest.config.js',
			content: this.generateJestConfig(),
		});

		return `🧪 **Unit Tests Created**

**Test Strategy:**
${aiResponse}

**Generated Tests:**
- Unit test suite with Jest framework
- Test utilities and helpers
- Mock configurations
- Coverage reporting setup

**Test Coverage Areas:**
- ✅ Function logic validation
- ✅ Edge case handling
- ✅ Error condition testing
- ✅ Input validation
- ✅ Output verification

**Test Features:**
- Descriptive test names
- Arrange-Act-Assert pattern
- Comprehensive assertions
- Mock dependencies
- Performance benchmarks

**Commands:**
- Run tests: \`npm test\`
- Watch mode: \`npm run test:watch\`
- Coverage: \`npm run test:coverage\``;
	}
	private async createIntegrationTests(
		message: string,
		intentId: string,
		context: string[],
		actions: AgentAction[]
	): Promise<string> {
		const systemPrompt = `You are a testing agent responsible for creating integration tests. Your task is to:
1. Test component interactions and system integration
2. Validate API endpoints and data flow
3. Test database interactions and external services
4. Create end-to-end workflow validation
5. Ensure proper error handling in integrated systems
6. Test performance under realistic conditions

Focus on testing the interactions between different parts of the system to ensure they work together correctly.`;

		const prompt = `Create integration tests for: "${message}". Focus on component interactions and API integration.

Context: ${context.join('\n')}

Please provide:
1. Integration test suite covering system interactions
2. API endpoint testing with various scenarios
3. Database integration tests
4. External service mocking and testing
5. End-to-end workflow validation
6. Performance and load testing considerations`;

		const aiResponse = await this.generateAIResponse(prompt, context, systemPrompt);

		actions.push({
			type: 'createFile',
			target: 'src/__tests__/integration/api.test.ts',
			content: this.generateIntegrationTestCode(),
		});

		return `🔗 **Integration Tests Created**

**Integration Strategy:**
${aiResponse}

**Test Scenarios:**
- API endpoint testing
- Database interactions
- Service integrations
- Component communication
- Data flow validation

**Generated Tests:**
- API integration test suite
- Database test utilities
- Service mock configurations
- End-to-end data flow tests

**Testing Areas:**
- ✅ API request/response cycles
- ✅ Database CRUD operations
- ✅ Service dependencies
- ✅ Error handling across layers
- ✅ Transaction management

**Setup Requirements:**
- Test database configuration
- API mock server setup
- Environment variables
- Test data fixtures`;
	}
	private async createE2ETests(
		message: string,
		intentId: string,
		context: string[],
		actions: AgentAction[]
	): Promise<string> {
		const systemPrompt = `You are a testing agent responsible for creating end-to-end tests. Your task is to:
1. Design complete user journey tests from start to finish
2. Test real user interactions and workflows
3. Validate the entire application stack
4. Create realistic user scenarios and edge cases
5. Test cross-browser compatibility and responsiveness
6. Ensure accessibility compliance in real usage

Focus on testing the complete user experience as real users would interact with the application.`;

		const prompt = `Create end-to-end tests for: "${message}". Design complete user journey tests.

Context: ${context.join('\n')}

Please provide:
1. Complete end-to-end test suite
2. User journey scenarios and workflows
3. Cross-browser testing strategies
4. Mobile and responsive testing
5. Accessibility testing integration
6. Performance testing during real usage`;

		const aiResponse = await this.generateAIResponse(prompt, context, systemPrompt);

		actions.push({
			type: 'createFile',
			target: 'e2e/user-journey.spec.ts',
			content: this.generateE2ETestCode(),
		});

		actions.push({
			type: 'createFile',
			target: 'playwright.config.ts',
			content: this.generatePlaywrightConfig(),
		});

		return `🎭 **End-to-End Tests Created**

**E2E Strategy:**
${aiResponse}

**User Journey Tests:**
- Complete workflow validation
- Cross-browser testing
- Mobile responsiveness
- Accessibility compliance
- Performance monitoring

**Generated Tests:**
- Playwright test suite
- Page object models
- Test fixtures and utilities
- Visual regression tests

**Test Coverage:**
- ✅ Critical user paths
- ✅ Form submissions
- ✅ Navigation flows
- ✅ Error scenarios
- ✅ Authentication flows

**Browser Support:**
- Chrome/Chromium
- Firefox
- Safari/WebKit
- Mobile browsers

**Commands:**
- Run E2E: \`npx playwright test\`
- Debug mode: \`npx playwright test --debug\`
- Report: \`npx playwright show-report\``;
	}
	private async createPerformanceTests(
		message: string,
		intentId: string,
		context: string[],
		actions: AgentAction[]
	): Promise<string> {
		const systemPrompt = `You are a testing agent responsible for creating performance tests. Your task is to:
1. Design load testing and stress testing scenarios
2. Create performance benchmarks and thresholds
3. Test scalability under various loads
4. Monitor resource usage and bottlenecks
5. Validate response times and throughput
6. Create realistic user load patterns

Focus on identifying performance bottlenecks and ensuring the application can handle expected user loads.`;

		const prompt = `Create performance tests for: "${message}". Focus on load testing and performance benchmarks.

Context: ${context.join('\n')}

Please provide:
1. Load testing scenarios with realistic user patterns
2. Performance benchmarks and acceptance criteria
3. Stress testing for peak load conditions
4. Resource monitoring and profiling
5. Scalability testing strategies
6. Performance regression testing`;

		const aiResponse = await this.generateAIResponse(prompt, context, systemPrompt);

		actions.push({
			type: 'createFile',
			target: 'performance/load-test.js',
			content: this.generatePerformanceTestCode(),
		});

		return `⚡ **Performance Tests Created**

**Performance Strategy:**
${aiResponse}

**Performance Metrics:**
- Response time benchmarks
- Throughput measurement
- Resource utilization
- Memory leak detection
- Bundle size analysis

**Generated Tests:**
- Load testing scripts
- Performance benchmarks
- Memory profiling tests
- Bundle analysis tools

**Test Types:**
- ✅ Load testing (normal conditions)
- ✅ Stress testing (peak conditions)
- ✅ Spike testing (sudden loads)
- ✅ Volume testing (large datasets)
- ✅ Endurance testing (sustained load)

**Monitoring:**
- Response time thresholds
- Error rate monitoring
- Resource usage alerts
- Performance regression detection

**Tools:**
- K6 for load testing
- Lighthouse for web vitals
- Bundle analyzer for optimization`;
	}
	private async analyzeTestRequirements(
		message: string,
		intentId: string,
		context: string[],
		actions: AgentAction[]
	): Promise<string> {
		const systemPrompt = `You are a test analysis agent responsible for analyzing testing requirements. Your task is to:
1. Analyze project requirements and identify testing needs
2. Suggest comprehensive testing strategies
3. Recommend appropriate testing frameworks and tools
4. Define test coverage goals and metrics
5. Identify risk areas and critical paths
6. Create testing roadmaps and best practices

Focus on creating thorough testing strategies that ensure quality and reliability.`;

		const prompt = `Analyze testing requirements for: "${message}". Suggest comprehensive testing strategy.

Context: ${context.join('\n')}

Please provide:
1. Testing requirement analysis
2. Comprehensive testing strategy
3. Framework and tool recommendations
4. Coverage goals and metrics
5. Risk assessment and mitigation
6. Implementation roadmap`;

		const aiResponse = await this.generateAIResponse(prompt, context, systemPrompt);

		return `🔍 **Test Analysis Complete**

${aiResponse}

**Recommended Testing Strategy:**

**1. Unit Testing (Foundation)**
- Test individual functions and components
- Mock external dependencies
- Achieve 80%+ code coverage
- Fast feedback loop

**2. Integration Testing (Connections)**
- Test component interactions
- Validate API integrations
- Database interaction testing
- Service communication

**3. End-to-End Testing (User Experience)**
- Complete user journey validation
- Cross-browser compatibility
- Mobile responsiveness
- Accessibility compliance

**4. Performance Testing (Quality)**
- Load and stress testing
- Response time optimization
- Resource usage monitoring
- Scalability validation

**Test Pyramid Approach:**
- 70% Unit Tests (Fast, Isolated)
- 20% Integration Tests (Medium complexity)
- 10% E2E Tests (Slow, Comprehensive)

**Next Steps:**
1. Set up testing framework
2. Create test data fixtures
3. Implement CI/CD integration
4. Establish quality gates`;
	}

	// Helper methods for generating test code
	private generateUnitTestCode(): string {
		return `import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('Example Unit Tests', () => {
	beforeEach(() => {
		// Setup before each test
	});

	afterEach(() => {
		// Cleanup after each test
	});

	test('should return expected result', () => {
		// Arrange
		const input = 'test input';
		const expected = 'expected output';

		// Act
		const result = someFunction(input);

		// Assert
		expect(result).toBe(expected);
	});

	test('should handle edge cases', () => {
		// Test edge cases
		expect(() => someFunction(null)).toThrow();
		expect(someFunction('')).toBe('');
		expect(someFunction(undefined)).toBeUndefined();
	});

	test('should validate input parameters', () => {
		// Input validation tests
		const validInput = { id: 1, name: 'test' };
		const invalidInput = { id: 'invalid' };

		expect(validateInput(validInput)).toBe(true);
		expect(validateInput(invalidInput)).toBe(false);
	});
});

// Helper function placeholder
function someFunction(input: any) {
	return input;
}

function validateInput(input: any): boolean {
	return typeof input.id === 'number' && typeof input.name === 'string';
}`;
	}

	private generateIntegrationTestCode(): string {
		return `import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app';
import { setupTestDatabase, cleanupTestDatabase } from './helpers/database';

describe('API Integration Tests', () => {
	beforeAll(async () => {
		await setupTestDatabase();
	});

	afterAll(async () => {
		await cleanupTestDatabase();
	});

	describe('GET /api/users', () => {
		test('should return list of users', async () => {
			const response = await request(app)
				.get('/api/users')
				.expect(200);

			expect(response.body).toHaveProperty('users');
			expect(Array.isArray(response.body.users)).toBe(true);
		});

		test('should handle authentication', async () => {
			await request(app)
				.get('/api/users')
				.set('Authorization', 'Bearer invalid-token')
				.expect(401);
		});
	});

	describe('POST /api/users', () => {
		test('should create new user', async () => {
			const userData = {
				name: 'Test User',
				email: 'test@example.com'
			};

			const response = await request(app)
				.post('/api/users')
				.send(userData)
				.expect(201);

			expect(response.body).toHaveProperty('id');
			expect(response.body.name).toBe(userData.name);
		});

		test('should validate required fields', async () => {
			await request(app)
				.post('/api/users')
				.send({})
				.expect(400);
		});
	});
});`;
	}

	private generateE2ETestCode(): string {
		return `import { test, expect } from '@playwright/test';

test.describe('User Journey Tests', () => {
	test('complete user registration and login flow', async ({ page }) => {
		// Navigate to registration page
		await page.goto('/register');

		// Fill registration form
		await page.fill('[data-testid="email"]', 'user@example.com');
		await page.fill('[data-testid="password"]', 'securePassword123');
		await page.fill('[data-testid="confirmPassword"]', 'securePassword123');

		// Submit registration
		await page.click('[data-testid="submit-registration"]');

		// Verify success message
		await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

		// Navigate to login
		await page.goto('/login');

		// Login with new credentials
		await page.fill('[data-testid="email"]', 'user@example.com');
		await page.fill('[data-testid="password"]', 'securePassword123');
		await page.click('[data-testid="submit-login"]');

		// Verify successful login
		await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
	});

	test('should handle form validation errors', async ({ page }) => {
		await page.goto('/register');

		// Submit empty form
		await page.click('[data-testid="submit-registration"]');

		// Check for validation errors
		await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
		await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
	});

	test('should be accessible', async ({ page }) => {
		await page.goto('/');

		// Check for basic accessibility
		const title = await page.title();
		expect(title).toBeTruthy();

		// Check for heading structure
		const h1 = await page.locator('h1').count();
		expect(h1).toBeGreaterThan(0);

		// Check for alt text on images
		const images = await page.locator('img').all();
		for (const img of images) {
			const alt = await img.getAttribute('alt');
			expect(alt).toBeTruthy();
		}
	});
});`;
	}

	private generatePerformanceTestCode(): string {
		return `import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');

export const options = {
	stages: [
		{ duration: '2m', target: 100 }, // Ramp up to 100 users
		{ duration: '5m', target: 100 }, // Stay at 100 users
		{ duration: '2m', target: 200 }, // Ramp up to 200 users
		{ duration: '5m', target: 200 }, // Stay at 200 users
		{ duration: '2m', target: 0 },   // Ramp down to 0 users
	],
	thresholds: {
		http_req_duration: ['p(99)<1500'], // 99% of requests must complete below 1.5s
		errors: ['rate<0.1'],              // Error rate must be below 10%
	},
};

export default function () {
	// Test homepage
	const homeResponse = http.get('http://localhost:3000/');
	check(homeResponse, {
		'homepage status is 200': (r) => r.status === 200,
		'homepage loads in <500ms': (r) => r.timings.duration < 500,
	});

	// Test API endpoint
	const apiResponse = http.get('http://localhost:3000/api/users');
	check(apiResponse, {
		'api status is 200': (r) => r.status === 200,
		'api response time <200ms': (r) => r.timings.duration < 200,
	});

	// Record errors
	errorRate.add(homeResponse.status !== 200 || apiResponse.status !== 200);

	sleep(1);
}

export function handleSummary(data) {
	return {
		'performance-results.json': JSON.stringify(data, null, 2),
	};
}`;
	}

	private generateJestConfig(): string {
		return `module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/src'],
	testMatch: [
		'**/__tests__/**/*.+(ts|tsx|js)',
		'**/*.(test|spec).+(ts|tsx|js)'
	],
	transform: {
		'^.+\\.(ts|tsx)$': 'ts-jest'
	},
	collectCoverageFrom: [
		'src/**/*.{ts,tsx}',
		'!src/**/*.d.ts',
		'!src/**/*.stories.{ts,tsx}',
		'!src/index.ts'
	],
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80
		}
	},
	setupFilesAfterEnv: ['<rootDir>/src/__tests__/setupTests.ts']
};`;
	}

	private generatePlaywrightConfig(): string {
		return `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'html',
	use: {
		baseURL: 'http://localhost:3000',
		trace: 'on-first-retry',
	},

	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
		},
		{
			name: 'Mobile Chrome',
			use: { ...devices['Pixel 5'] },
		},
		{
			name: 'Mobile Safari',
			use: { ...devices['iPhone 12'] },
		},
	],

	webServer: {
		command: 'npm run start',
		url: 'http://localhost:3000',
		reuseExistingServer: !process.env.CI,
	},
});`;
	}
}
