# Contributing to AIDE

Welcome, and thank you for your interest in contributing to AIDE (AI-native Development Environment)!

There are several ways in which you can contribute, beyond writing code. The goal of this document is to provide a high-level overview of how you can get involved.

## Table of Contents

- [Asking Questions](#asking-questions)
- [Providing Feedback](#providing-feedback)
- [Reporting Issues](#reporting-issues)
- [Contributing Code](#contributing-code)
- [Development Workflow](#development-workflow)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Coding Standards](#coding-standards)
- [Community Guidelines](#community-guidelines)

## Asking Questions

Have a question about AIDE? Please ask in our [GitHub Discussions](https://github.com/aide-dev/aide/discussions) section using the appropriate category.

The active community will be eager to assist you. Your well-worded question will serve as a resource to others searching for help.

## Providing Feedback

Your comments and feedback are welcome! The development team values your input on how to make AIDE better.

- **Feature Requests**: Use GitHub Issues with the "feature request" template
- **General Feedback**: Use GitHub Discussions in the "Ideas" category
- **User Experience**: Share your thoughts on UX in the "UX & Design" discussion category

## Reporting Issues

Have you identified a reproducible problem in AIDE? We want to hear about it! Here's how you can report your issue as effectively as possible.

### Identify Where to Report

AIDE is distributed across multiple packages and workspaces. Try to file the issue against the correct component:

- **Memory Graph Issues**: Use the `packages/memory-graph` label
- **Agent Runtime Issues**: Use the `packages/agent-runtime` label
- **UI Component Issues**: Use the `packages/ui-components` label
- **Desktop App Issues**: Use the `apps/electron` label
- **Web App Issues**: Use the `apps/web` label
- **General Issues**: When unsure, use the main repository without specific labels

### Look For an Existing Issue

Before you create a new issue, please do a search in [open issues](https://github.com/aide-dev/aide/issues) to see if the issue or feature request has already been filed.

Be sure to scan through the most popular feature requests.

If you find your issue already exists, make relevant comments and add your reaction. Use a reaction in place of a "+1" comment:

- 👍 - upvote
- 👎 - downvote

### Writing Good Bug Reports and Feature Requests

File a single issue per problem and feature request. Do not enumerate multiple bugs or feature requests in the same issue.

The more information you can provide, the more likely someone will be successful at reproducing the issue and finding a fix.

**For bug reports, please include**:

1. A clear and descriptive title
2. AIDE version and environment (OS, Node.js version, etc.)
3. Steps to reproduce the issue
4. Expected behavior
5. Actual behavior
6. Screenshots (if applicable)
7. Relevant error messages and logs

**For feature requests, please include**:

1. A clear and descriptive title
2. Detailed description of the feature
3. Use cases and benefits
4. Mockups or examples (if applicable)
5. How the feature would integrate with existing functionality

## Contributing Code

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher)
- [pnpm](https://pnpm.io/) (v8 or higher)
- [Git](https://git-scm.com/)

### Environment Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/aide.git`
3. Install dependencies: `pnpm install`
4. Create a new branch for your changes: `git checkout -b my-feature-branch`

### Development Workflow

1. Make your changes
2. Write or update tests as needed
3. Run tests: `pnpm test:packages`
4. Ensure code style is correct: `pnpm lint` and `pnpm format`
5. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/) guidelines
6. Push to your fork
7. Open a pull request

## Pull Request Guidelines

1. Include a clear description of the changes
2. Link to related issues (if applicable)
3. Update documentation to reflect changes
4. Add or update tests as appropriate
5. Ensure all checks pass (tests, linting, type checking)
6. Request review from maintainers

## Coding Standards

We follow these standards for code quality:

- **TypeScript**: Use strict mode and proper typing
- **ESLint**: Follow the project's ESLint configuration
- **Prettier**: Format code according to our Prettier configuration
- **Testing**: Write tests for new functionality
- **Documentation**: Document public APIs and complex logic

### Naming Conventions

- **PascalCase** for class names, interfaces, types, and React components
- **camelCase** for variables, functions, and methods
- **UPPER_CASE** for constants

### Code Organization

- Keep files focused on a single responsibility
- Group related functionality in the same directory
- Follow the project's existing file structure

## Community Guidelines

- Be respectful and inclusive
- Provide constructive feedback
- Help others in the community
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md)

Thank you for contributing to AIDE! Your efforts help make this project better for everyone.
