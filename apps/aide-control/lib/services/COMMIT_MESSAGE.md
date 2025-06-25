refactor(firebase): improve provisioning service with tests and documentation

Enhance Firebase Provisioning Service with comprehensive testing, better
documentation, type safety, error handling, and code organization.

Key improvements:

- Migrate tests from Jest to Vitest format
- Add comprehensive test coverage for all service methods
- Extract API endpoint URLs as constants
- Move mock Google Auth implementation to separate file
- Add explicit interfaces for request/response types
- Enhance error handling with better context
- Improve generateProjectId method with better validation
- Add exponential backoff for async operations
- Update README with detailed usage examples
- Create example config, test files and environment variable templates

Type: refactor
Scope: firebase
