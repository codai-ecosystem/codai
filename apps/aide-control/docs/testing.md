# Testing Documentation

✅ **TESTING COMPLETE** - All tests are passing successfully!

This document provides guidelines for testing the codai.ro dashboard components and utilities.

## Test Status Summary

- **Total Tests**: 22 tests across 2 test files
- **Pass Rate**: 100% (22/22 passing)
- **Test Files**: `user-preferences.test.ts`, `localStorage.test.ts`
- **Critical Bug Fixed**: Object reference mutation in user preferences

## Testing Framework

We use Vitest as our test runner with the following setup:

- **Test Environment**: JSDOM for browser-like environment
- **UI Testing**: @testing-library/react for component testing
- **User Interaction**: @testing-library/user-event for simulating user behaviors
- **Assertions**: @testing-library/jest-dom for DOM assertions

## Test Files

Test files follow these conventions:

- Located in `__tests__` directory
- Named with `.test.ts` or `.test.tsx` suffix
- Environment setup in `__tests__/setup.ts`

## Running Tests

To run the tests:

```bash
# Run all tests
npm test

# Run specific test file
npx vitest run __tests__/[filename]

# Run tests in watch mode
npx vitest watch
```

## Fixed Critical Bug

### Object Reference Mutation in User Preferences

**Problem**: The `DEFAULT_PREFERENCES` object was being mutated during operations, causing:

- Reset function to use corrupted defaults instead of original values
- Cross-test contamination in accessibility preference tests
- Inconsistent behavior between test runs

**Root Cause**: `safeStorage.get()` returned direct references to the default object, which were then mutated by `set()` operations.

**Solution**: Modified `safeStorage.get()` to return deep copies using `JSON.parse(JSON.stringify())`, ensuring complete isolation.

## Test Structure

### Component Tests

For UI components like `CommandPalette.tsx`, tests should verify:

1. **Rendering**: Component renders correctly with expected elements
2. **User Interaction**: Component responds to user events (clicks, keyboard, etc.)
3. **State Management**: Component state changes correctly
4. **Accessibility**: Component meets accessibility standards
5. **Edge Cases**: Component handles edge cases (empty data, errors, etc.)

Example structure:

```typescript
describe('Component', () => {
  // Setup common test data, mocks
  const mockData = {...};

  beforeEach(() => {
    // Reset mocks, setup environment
  });

  it('renders correctly', () => {
    // Render component, check elements exist
  });

  it('responds to user events', async () => {
    // Simulate user actions, check results
  });

  // Additional tests...
});
```

### Utility Tests

For utilities like `user-preferences.ts`, tests should verify:

1. **API**: Functions perform expected operations
2. **Edge Cases**: Functions handle edge cases, invalid inputs
3. **Error Handling**: Functions handle errors gracefully

## Mocking Dependencies

Mock external dependencies like:

- Browser APIs (localStorage, fetch)
- Next.js router
- Third-party services and libraries

Example:

```typescript
// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Next.js router
vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: vi.fn() }),
}));
```

## CommandPalette Component Tests

The CommandPalette component tests verify:

1. **Rendering**: Shows categories, commands, search input
2. **Filtering**: Filters commands based on search query
3. **Command Execution**: Executes commands when clicked
4. **Keyboard Navigation**: Supports keyboard navigation
5. **Recent Commands**: Shows and manages recent commands
6. **Accessibility**: Has correct ARIA attributes

## UserPreferences Utility Tests

The UserPreferences utility tests verify:

1. **Persistence**: Saves and retrieves preferences from localStorage
2. **Default Values**: Returns defaults when nothing is saved
3. **Type Safety**: Handles data correctly for different preference types
4. **Error Handling**: Gracefully handles storage errors

## Common Test Patterns

### Testing Component Visibility

```typescript
// Check if an element exists
expect(screen.getByText('Element text')).toBeInTheDocument();

// Check if an element doesn't exist
expect(screen.queryByText('Element text')).not.toBeInTheDocument();
```

### Testing User Interactions

```typescript
// Click on an element
fireEvent.click(screen.getByText('Button text'));

// Type in an input
fireEvent.change(screen.getByPlaceholderText('Search...'), {
	target: { value: 'search term' },
});

// Using user-event (more realistic)
await userEvent.type(screen.getByPlaceholderText('Search...'), 'search term');
await userEvent.click(screen.getByText('Button text'));
await userEvent.keyboard('{Enter}');
```

### Testing Attributes and Styles

```typescript
// Check element attribute
expect(element).toHaveAttribute('aria-expanded', 'true');

// Check element class
expect(element).toHaveClass('highlighted');
```

## Troubleshooting

If you encounter issues running tests:

1. Make sure all dependencies are installed: `npm install`
2. Check for TypeScript errors in test files
3. Ensure the component API hasn't changed (props, hooks, etc.)
4. Verify mocks for external dependencies are up to date

For workspace-level dependency issues:

- Use specific test command with explicit dependency paths
- Consider isolating test dependencies to avoid conflicts

## Best Practices

1. **Arrange-Act-Assert**: Structure tests with clear setup, action, and assertions
2. **Mock Minimally**: Only mock what's necessary to isolate tests
3. **Test Behavior**: Focus on testing behavior, not implementation
4. **Accessibility**: Always test accessibility features
5. **Maintainability**: Keep tests simple and focused on one concern
