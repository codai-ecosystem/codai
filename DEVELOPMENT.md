# AIDE Development Guide

This guide provides instructions for working on the AIDE (AI-native Development Environment) codebase. It contains information about the project structure, development workflows, and best practices.

## Project Structure

AIDE is organized as a pnpm workspace with multiple packages:

```
aide/
├── packages/           # Core shared packages
│   ├── memory-graph/   # Memory graph engine
│   ├── agent-runtime/  # Agent orchestration
│   └── ui-components/  # Shared UI components
├── extensions/         # VS Code extensions
│   └── aide-core/      # Main AIDE extension
├── apps/              # Platform applications
│   └── electron/      # Desktop application
```

## Getting Started

### Prerequisites

- Node.js v18+
- pnpm v8+
- Git

### Setup

1. Clone the repository

   ```bash
   git clone https://github.com/aide-dev/aide.git
   cd aide
   ```

2. Install dependencies

   ```bash
   pnpm install
   ```

3. Build all packages

   ```bash
   pnpm build
   ```

4. Start development
   ```bash
   pnpm dev
   ```

## Development Workflow

### Building

- Build all packages: `pnpm build`
- Build specific package: `pnpm --filter @aide/memory-graph build`
- Watch mode: `pnpm dev`

### Testing

- Run all tests: `pnpm test`
- Run tests with coverage: `pnpm test:coverage`

### Code Quality

- Lint code: `pnpm lint`
- Format code: `pnpm format`
- Type check: `pnpm typecheck`

## Architecture

### Memory Graph

The memory graph is the core data structure used by AIDE to store and organize project information. It's a persistent graph-based data model that represents code, requirements, and relationships.

### Agent Runtime

The agent runtime orchestrates multiple specialized AI agents that work together to build software. Each agent has specific responsibilities:

- PlannerAgent: Breaks down requirements into actionable tasks
- BuilderAgent: Generates and modifies code
- DesignerAgent: Creates UI/UX components
- TesterAgent: Writes and runs tests
- DeployerAgent: Handles deployment

### UI Components

Shared React components used across different parts of the application.

## Contribution Guidelines

1. Create a feature branch from `main`
2. Make changes following the project's code style
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT
