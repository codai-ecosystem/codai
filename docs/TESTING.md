# AIDE Testing Strategy

This document outlines the testing approach for the AIDE project, including test types, tools, and best practices.

## Testing Levels

### 1. Unit Testing

**Purpose:** Test individual components, functions, and classes in isolation.

**Tools:**

- Vitest for fast, modern testing
- Testing utilities specific to each package

**Key Areas:**

- Core utility functions
- Individual React components
- Agent implementations
- Memory graph operations

**Example:**

```typescript
// src/utils/formatters.test.ts
import { describe, it, expect } from 'vitest';
import { formatDateString } from './formatters';

describe('formatDateString', () => {
	it('formats dates correctly', () => {
		const date = new Date('2025-01-01T12:00:00Z');
		expect(formatDateString(date)).toBe('Jan 1, 2025');
	});

	it('handles invalid dates', () => {
		expect(formatDateString(null)).toBe('Invalid date');
	});
});
```

### 2. Integration Testing

**Purpose:** Test interaction between multiple components or systems.

**Tools:**

- Vitest for JavaScript/TypeScript integration tests
- Testing Library for React component integration

**Key Areas:**

- Agent interactions
- Memory graph + agent integration
- UI component compositions
- API integrations

**Example:**

```typescript
// src/features/memoryGraph.integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryGraphEngine } from '@codai/memory-graph';
import { AgentRuntime } from '@codai/agent-runtime';

describe('Agent + Memory Graph Integration', () => {
	let memoryGraph: MemoryGraphEngine;
	let agentRuntime: AgentRuntime;

	beforeEach(() => {
		memoryGraph = new MemoryGraphEngine({ inMemory: true });
		agentRuntime = new AgentRuntime(memoryGraph);
	});

	it('agents can read and write to memory graph', async () => {
		const task = { id: 'task-1', type: 'code', content: 'Create login form' };
		await agentRuntime.executeTask(task);

		const nodes = await memoryGraph.findNodes({ type: 'code' });
		expect(nodes.length).toBeGreaterThan(0);
	});
});
```

### 3. E2E Testing

**Purpose:** Test complete user workflows from start to finish.

**Tools:**

- Playwright for browser-based testing
- VS Code extension testing API

**Key Areas:**

- Full user flows
- VS Code extension integration
- Cross-platform compatibility

**Example:**

```typescript
// e2e/conversation.spec.ts
import { test, expect } from '@playwright/test';

test('user can start a conversation and get response', async ({ page }) => {
	await page.goto('/');

	// Find and interact with the conversation input
	await page.fill('.conversation-input', 'Create a React component');
	await page.click('button.send-message');

	// Wait for agent response
	await page.waitForSelector('.agent-message');

	// Verify response contains code block
	const codeBlock = await page.locator('.agent-message code');
	expect(await codeBlock.count()).toBeGreaterThan(0);
});
```

## Test Coverage Goals

| Component           | Coverage Target |
| ------------------- | --------------- |
| Core utilities      | 90%             |
| Memory graph        | 85%             |
| Agent runtime       | 75%             |
| UI components       | 70%             |
| VS Code integration | 60%             |

## Testing Workflow

### Local Development

1. Run unit tests during development:

   ```bash
   pnpm test
   ```

2. Run specific tests:

   ```bash
   pnpm test --filter @codai/memory-graph
   ```

3. Run with coverage:
   ```bash
   pnpm test:coverage
   ```

### Continuous Integration

Tests are automatically run on:

- Pull request creation
- Push to main branch
- Nightly builds

## Best Practices

1. **Write testable code**

   - Dependency injection
   - Pure functions where possible
   - Clear separation of concerns

2. **Test organization**

   - Co-locate tests with source code
   - Follow consistent naming patterns
   - Group related tests with describe blocks

3. **Mock external dependencies**

   - Use vitest mock functions
   - Create test doubles for complex systems
   - Isolate tests from network/filesystem

4. **Test for edge cases**

   - Null/undefined inputs
   - Empty collections
   - Error conditions
   - Boundary values

5. **Keep tests maintainable**
   - Avoid testing implementation details
   - Focus on behavior, not internal structure
   - Use setup/teardown helpers

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
