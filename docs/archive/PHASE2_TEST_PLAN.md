# Phase 2 Test Plan

## Overview

This document outlines the testing strategy for Phase 2 of the AIDE platform. It builds upon the foundation established in Milestone 1 and provides a comprehensive approach to ensure the platform meets quality, performance, and security standards before production deployment.

## Testing Objectives

1. **Verify Functional Requirements**: Ensure all features work as specified
2. **Validate Non-functional Requirements**: Performance, security, accessibility
3. **Detect Regressions**: Prevent new changes from breaking existing functionality
4. **Improve Code Quality**: Enforce standards and best practices
5. **Provide Documentation**: Self-documenting tests as specification

## Test Types & Coverage Targets

### Unit Tests

**Target Coverage**: 80%+ for critical paths

| Component | Test Focus | Tools |
|-----------|------------|-------|
| Agent Runtime | Individual methods, task management | Vitest, Jest |
| Memory Graph | Entity creation, relation management | Vitest, Jest |
| Auth Services | Token validation, role checks | Vitest, Jest |
| Firebase Utils | Data transformations, schema validation | Vitest, Jest |
| API Handlers | Request validation, error handling | Vitest, Jest |

**Example Unit Test:**
```typescript
describe('AgentRuntimeService', () => {
	describe('createTask', () => {
		it('should create a task with correct properties', async () => {
			// Arrange
			const userId = 'test-user-123';
			const taskData = {
				title: 'Test Task',
				description: 'Task description',
				priority: 'medium',
			};
			const mockFirestore = mockFirestoreService();
			const service = new AgentRuntimeService(mockFirestore);

			// Act
			const task = await service.createTask(userId, taskData);

			// Assert
			expect(task).toHaveProperty('id');
			expect(task.userId).toBe(userId);
			expect(task.title).toBe(taskData.title);
			expect(task.status).toBe('pending');
		});

		it('should store task in Firestore', async () => {
			// Arrange
			const mockSet = vi.fn();
			vi.spyOn(global, 'getFirestore').mockReturnValue({
				collection: () => ({
					doc: () => ({
						set: mockSet
					})
				})
			} as any);

			// Act
			await service.createTask('user-123', { title: 'Test', description: 'Desc' });

			// Assert
			expect(mockSet).toHaveBeenCalled();
		});
	});
});
```

### Integration Tests

**Target Coverage**: 70%+ of critical user flows

| Integration Points | Test Focus | Tools |
|-------------------|------------|-------|
| API + Database | CRUD operations, transactions | Supertest, Vitest |
| Auth + API Routes | Authentication flows, authorization | Supertest, Vitest |
| Agent Runtime + Memory Graph | Task execution with memory context | Vitest |
| Frontend + API | Data fetching, error handling | Cypress, Playwright |

**Example Integration Test:**
```typescript
describe('Agent API Integration', () => {
	let testServer;
	let authToken;

	beforeAll(async () => {
		testServer = await startTestServer();
		authToken = await getTestAuthToken('test-user');
	});

	afterAll(async () => {
		await stopTestServer(testServer);
	});

	describe('POST /api/agents', () => {
		it('should create a new task and return success', async () => {
			// Arrange
			const taskData = {
				task: {
					description: 'Integration test task',
					priority: 'medium'
				}
			};

			// Act
			const response = await request(testServer)
				.post('/api/agents')
				.set('Authorization', `Bearer ${authToken}`)
				.send(taskData);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.task).toBeDefined();
			expect(response.body.data.task.id).toBeDefined();

			// Verify in database
			const taskDoc = await getFirestoreDoc(`agent_tasks/${response.body.data.task.id}`);
			expect(taskDoc.exists).toBe(true);
		});

		it('should return 401 when unauthorized', async () => {
			const response = await request(testServer)
				.post('/api/agents')
				.send({ task: { description: 'Test' }});

			expect(response.status).toBe(401);
		});
	});
});
```

### End-to-End Tests

**Target Coverage**: Key user journeys and critical paths

| User Journey | Test Focus | Tools |
|-------------|------------|-------|
| User Onboarding | Registration, setup wizard | Playwright |
| Agent Management | Create, monitor, cancel tasks | Playwright |
| Project Management | Create, configure, delete projects | Playwright |
| Admin Dashboard | View stats, manage users, check logs | Playwright |

**Example E2E Test:**
```typescript
test('should create and monitor an agent task', async ({ page }) => {
	// Login
	await page.goto('/login');
	await page.fill('[data-testid="email-input"]', 'test@example.com');
	await page.fill('[data-testid="password-input"]', 'testpassword');
	await page.click('[data-testid="login-button"]');

	// Navigate to agents page
	await page.click('[data-testid="agents-nav-link"]');

	// Create new task
	await page.click('[data-testid="new-task-button"]');
	await page.fill('[data-testid="task-title-input"]', 'E2E Test Task');
	await page.fill('[data-testid="task-description-input"]', 'This is created by an E2E test');
	await page.selectOption('[data-testid="agent-select"]', 'planner');
	await page.click('[data-testid="create-task-button"]');

	// Verify task appears in the list
	await expect(page.locator('[data-testid="task-list"]')).toContainText('E2E Test Task');

	// Open task details
	await page.click('text=E2E Test Task');

	// Verify task details page
	await expect(page.locator('[data-testid="task-status"]')).toBeVisible();
	await expect(page.locator('[data-testid="task-agent"]')).toContainText('planner');
});
```

### Performance Tests

**Target Coverage**: All critical API endpoints and database operations

| Area | Test Focus | Tools |
|------|------------|-------|
| API Response Time | Latency under load | k6, Lighthouse |
| Database Queries | Query execution time, indexing | Firebase Performance |
| Frontend Load Time | Initial and subsequent loads | Lighthouse, WebPageTest |
| Memory Usage | Resource consumption over time | Node.js profiler |

**Example Performance Test:**
```javascript
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
	stages: [
		{ duration: '1m', target: 50 },  // Ramp up to 50 users
		{ duration: '3m', target: 50 },  // Stay at 50 users for 3 minutes
		{ duration: '1m', target: 0 },   // Ramp down to 0 users
	],
	thresholds: {
		http_req_duration: ['p(95)<500'],  // 95% of requests should complete within 500ms
		http_req_failed: ['rate<0.01'],    // Less than 1% of requests should fail
	},
};

export default function() {
	const BASE_URL = 'https://aide-dev.example.com';
	const authToken = __ENV.AUTH_TOKEN;

	// Get list of agents
	const agentsResponse = http.get(`${BASE_URL}/api/agents`, {
		headers: { 'Authorization': `Bearer ${authToken}` },
	});

	check(agentsResponse, {
		'agents status 200': (r) => r.status === 200,
		'agents response time < 200ms': (r) => r.timings.duration < 200,
	});

	sleep(1);

	// Create a new task
	const taskResponse = http.post(`${BASE_URL}/api/agents`, JSON.stringify({
		task: {
			title: 'Performance Test Task',
			description: 'Testing API performance',
			priority: 'medium'
		}
	}), {
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${authToken}`
		}
	});

	check(taskResponse, {
		'create task status 200': (r) => r.status === 200,
		'create task response time < 500ms': (r) => r.timings.duration < 500,
		'task id exists': (r) => JSON.parse(r.body).data.task.id !== undefined,
	});

	sleep(3);
}
```

### Security Tests

**Target Coverage**: All authentication flows and data access points

| Security Aspect | Test Focus | Tools |
|-----------------|------------|-------|
| Authentication | Token validation, session management | OWASP ZAP |
| Authorization | Role-based access control | Custom tests |
| Input Validation | XSS, injection attacks | OWASP ZAP |
| API Security | Rate limiting, CORS, CSP | Custom tests |
| Secrets Management | Environment variables, tokens | Static analysis |

**Example Security Test:**
```typescript
describe('Security - Authorization', () => {
	it('should prevent non-admin users from accessing admin endpoints', async () => {
		// Arrange
		const regularUserToken = await getAuthToken('regular-user@example.com');

		// Act
		const response = await request(app)
			.get('/api/admin/dashboard')
			.set('Authorization', `Bearer ${regularUserToken}`);

		// Assert
		expect(response.status).toBe(403);
	});

	it('should prevent access to other users' data', async () => {
		// Arrange
		const userAToken = await getAuthToken('user-a@example.com');
		const userBId = 'user-b-id-123';

		// Act
		const response = await request(app)
			.get(`/api/users/${userBId}`)
			.set('Authorization', `Bearer ${userAToken}`);

		// Assert
		expect(response.status).toBe(403);
	});
});
```

## Testing Infrastructure

### CI/CD Integration

1. **Pre-commit Hooks**:
   - Lint checks
   - Type checking
   - Unit tests for changed files

2. **Pull Request Pipeline**:
   - All unit tests
   - Integration tests
   - Code coverage report
   - Security scans

3. **Main Branch Builds**:
   - Full test suite including E2E
   - Performance benchmarks
   - Security audits

### Test Environments

| Environment | Purpose | Data |
|-------------|---------|------|
| Local Development | Development, unit tests | Mock data |
| Development | Integration tests | Test dataset |
| Staging | E2E and performance tests | Production-like data |
| Production | Smoke tests, monitoring | Real data |

### Monitoring & Analytics

1. **Error Tracking**:
   - Sentry for frontend and backend error tracking
   - Custom error logging for agent runtime issues

2. **Performance Monitoring**:
   - Firebase Performance Monitoring
   - Custom timing metrics for critical operations

3. **User Analytics**:
   - Event tracking for key user actions
   - Funnel analysis for user journeys

## Test Data Management

### Test Data Generation

1. **Mock Data Factory**:
   ```typescript
   // Example mock data factory
   export class MockDataFactory {
     static createUser(overrides = {}): UserDocument {
       return {
         uid: `user_${Date.now()}`,
         email: `test-${Date.now()}@example.com`,
         displayName: 'Test User',
         role: 'user',
         createdAt: new Date().toISOString(),
         ...overrides
       };
     }

     static createTask(userId: string, overrides = {}): AgentTaskInfo {
       return {
         id: `task_${Date.now()}`,
         userId,
         title: 'Test Task',
         description: 'Task created for testing',
         status: 'pending',
         priority: 'medium',
         createdAt: new Date(),
         progress: 0,
         ...overrides
       };
     }

     static createProject(userId: string, overrides = {}): ProjectDocument {
       return {
         id: `proj_${Date.now()}`,
         name: 'Test Project',
         description: 'Project created for testing',
         owner: userId,
         createdAt: new Date().toISOString(),
         ...overrides
       };
     }
   }
   ```

2. **Test Database Seeding**:
   ```typescript
   // Example database seeder
   export async function seedTestDatabase() {
     const db = getFirestore();
     const batch = db.batch();

     // Create test users
     const users = [
       MockDataFactory.createUser({ role: 'admin' }),
       MockDataFactory.createUser(),
       MockDataFactory.createUser()
     ];

     users.forEach(user => {
       const userRef = db.collection('users').doc(user.uid);
       batch.set(userRef, user);
     });

     // Create test projects
     const projects = [
       MockDataFactory.createProject(users[0].uid),
       MockDataFactory.createProject(users[1].uid),
       MockDataFactory.createProject(users[2].uid)
     ];

     projects.forEach(project => {
       const projRef = db.collection('projects').doc(project.id);
       batch.set(projRef, project);
     });

     // Create test tasks
     const tasks = [
       MockDataFactory.createTask(users[0].uid, { projectId: projects[0].id }),
       MockDataFactory.createTask(users[1].uid, { projectId: projects[1].id }),
       MockDataFactory.createTask(users[2].uid, { projectId: projects[2].id })
     ];

     tasks.forEach(task => {
       const taskRef = db.collection('agent_tasks').doc(task.id);
       batch.set(taskRef, {
         ...task,
         createdAt: task.createdAt.toISOString(),
       });
     });

     // Execute batch
     await batch.commit();

     return {
       users,
       projects,
       tasks
     };
   }
   ```

### Test Data Cleanup

```typescript
// Example cleanup function
export async function cleanupTestData(testIds: {
  userIds?: string[],
  projectIds?: string[],
  taskIds?: string[]
}) {
  const db = getFirestore();
  const batch = db.batch();

  if (testIds.userIds?.length) {
    for (const userId of testIds.userIds) {
      batch.delete(db.collection('users').doc(userId));
    }
  }

  if (testIds.projectIds?.length) {
    for (const projectId of testIds.projectIds) {
      batch.delete(db.collection('projects').doc(projectId));
    }
  }

  if (testIds.taskIds?.length) {
    for (const taskId of testIds.taskIds) {
      batch.delete(db.collection('agent_tasks').doc(taskId));
    }
  }

  await batch.commit();
}
```

## Testing Best Practices

1. **Isolation**: Tests should not depend on each other or share mutable state
2. **Speed**: Fast tests enable faster development cycles
3. **Determinism**: Tests should yield the same results on each run
4. **Readability**: Tests should be easy to understand and maintain
5. **Coverage**: Test both happy paths and edge cases

## Implementation Roadmap

| Phase | Focus Area | Timeframe |
|-------|------------|-----------|
| 1 | Basic unit test framework setup | Week 1 |
| 2 | Core service unit tests | Weeks 2-3 |
| 3 | Integration tests for API endpoints | Weeks 3-4 |
| 4 | E2E test framework and initial tests | Weeks 4-5 |
| 5 | Performance testing infrastructure | Weeks 5-6 |
| 6 | Security testing implementation | Weeks 6-7 |
| 7 | CI/CD integration | Weeks 7-8 |

## Conclusion

This comprehensive test plan provides a roadmap for ensuring the quality, performance, and security of the AIDE platform during Phase 2 development. By implementing these testing strategies, we can deliver a robust, reliable solution that meets user expectations and business requirements.

---

*Document Version: 1.0*
*Last Updated: June 5, 2024*
*Status: Draft - For Review*
