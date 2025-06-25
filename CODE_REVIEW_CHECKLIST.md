# Code Review Checklist for AIDE Project

This checklist helps ensure that all code changes follow the AIDE coding standards and best practices.

## Code Quality ✅

### Functionality

- [ ] Code performs its intended function correctly
- [ ] All edge cases are handled appropriately
- [ ] Error conditions are properly managed
- [ ] No obvious bugs or logical errors

### Readability

- [ ] Code is easy to read and understand
- [ ] Variable and function names are descriptive and meaningful
- [ ] Code structure is logical and well-organized
- [ ] Complex logic is broken down into smaller, manageable functions

## Coding Standards ✅

### Formatting and Style

- [ ] Uses **tabs** for indentation, not spaces
- [ ] Lines are no longer than 100 characters
- [ ] Open curly braces are on the same line as statements
- [ ] Proper spacing around operators and after commas

### Naming Conventions

- [ ] **PascalCase** for types, interfaces, and enum values
- [ ] **camelCase** for functions, methods, properties, and variables
- [ ] **UPPER_SNAKE_CASE** for constants
- [ ] Names are descriptive and avoid abbreviations

### Comments and Documentation

- [ ] All exported functions have JSDoc comments
- [ ] All interfaces and types have JSDoc comments
- [ ] Complex logic is explained with comments
- [ ] Comments explain "why" not just "what"
- [ ] JSDoc comments include `@param`, `@returns`, and `@throws` where applicable

## TypeScript ✅

### Type Safety

- [ ] No usage of `any` type (use `unknown` if needed)
- [ ] All function parameters have explicit types
- [ ] Return types are explicit for exported functions
- [ ] Union types are used appropriately
- [ ] Null and undefined are handled safely

### TypeScript Best Practices

- [ ] Interfaces are used for object shapes
- [ ] Types are used for unions and intersections
- [ ] Generics are used for reusable code
- [ ] Optional properties use `?` instead of `| undefined`

## React Components ✅

### Component Structure

- [ ] Uses functional components with hooks
- [ ] Props are properly typed with interfaces
- [ ] Component is focused on a single responsibility
- [ ] Complex logic is extracted to custom hooks

### React Best Practices

- [ ] Props are destructured in the function signature
- [ ] Default values are provided for optional props
- [ ] Event handlers are properly typed
- [ ] No inline object/function creation in JSX (use useMemo/useCallback)
- [ ] Keys are provided for list items

## API and Data Handling ✅

### API Integration

- [ ] API clients use proper TypeScript interfaces
- [ ] Error handling is comprehensive and consistent
- [ ] HTTP status codes are handled appropriately
- [ ] Request/response types are well-defined

### Data Validation

- [ ] Input data is validated before processing
- [ ] Schema validation is used for user inputs
- [ ] SQL injection and XSS vulnerabilities are prevented
- [ ] Proper sanitization of user data

## Testing ✅

### Test Coverage

- [ ] Unit tests are provided for new functions
- [ ] Edge cases are tested
- [ ] Error conditions are tested
- [ ] Integration tests cover API endpoints

### Test Quality

- [ ] Test names are descriptive and explain what is being tested
- [ ] Tests follow the AAA pattern (Arrange, Act, Assert)
- [ ] Tests are independent and don't rely on external state
- [ ] Mocks are used appropriately for external dependencies

## Performance ✅

### General Performance

- [ ] No unnecessary re-renders in React components
- [ ] Expensive operations are memoized
- [ ] Database queries are optimized
- [ ] Large lists use pagination or virtualization

### Bundle Size

- [ ] No unnecessary dependencies are added
- [ ] Large libraries are code-split where possible
- [ ] Tree-shaking is considered for utility libraries

## Security ✅

### Authentication and Authorization

- [ ] User permissions are checked before sensitive operations
- [ ] Authentication tokens are handled securely
- [ ] No hardcoded secrets or credentials
- [ ] Proper session management

### Data Security

- [ ] User input is validated and sanitized
- [ ] Sensitive data is not logged
- [ ] HTTPS is used for all external communications
- [ ] Rate limiting is implemented where appropriate

## Documentation ✅

### Code Documentation

- [ ] README is updated if new features are added
- [ ] API documentation is updated for new endpoints
- [ ] Breaking changes are documented
- [ ] Migration guides are provided for major changes

## Git and Version Control ✅

### Commit Standards

- [ ] Commit messages follow conventional format
- [ ] Commits are focused on a single change
- [ ] Commit messages are descriptive and meaningful
- [ ] No sensitive information is committed

### Pull Request

- [ ] PR description clearly explains the changes
- [ ] Related issues are referenced
- [ ] Breaking changes are highlighted
- [ ] Screenshots are provided for UI changes

## Notes Section

Use this section to add any specific notes or comments about the review:

```
Reviewer Notes:
-
-
-

Author Response:
-
-
-
```

---

## Review Completion

- [ ] All items have been checked
- [ ] Any issues have been discussed with the author
- [ ] The code is ready to be merged

**Reviewer:** _[Name]_
**Date:** _[Date]_
**Approval:** ✅ Approved / ❌ Needs Changes
