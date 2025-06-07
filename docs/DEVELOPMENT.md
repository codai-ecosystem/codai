# AIDE Development Guide

This guide provides comprehensive instructions for working on the AIDE (AI-native Development Environment) codebase. It contains information about the project structure, development workflows, debugging tips, and best practices.

## Project Structure

AIDE is organized as a pnpm workspace with multiple packages:

```
aide/
├── packages/           # Core shared packages
│   ├── memory-graph/   # Memory graph engine with persistence
│   ├── agent-runtime/  # Agent orchestration
│   └── ui-components/  # Shared UI components
├── extensions/         # VS Code extensions
│   ├── aide-core/      # Main AIDE extension
│   └── copilot/        # Custom GitHub Copilot integration
├── apps/               # Platform applications
│   ├── electron/       # Main AIDE desktop app
│   ├── web/            # Web version
│   ├── aide-control/   # Admin control panel
│   └── aide-landing/   # Public-facing website
└── cloud-functions/    # Serverless functions for cloud integrations
```

## Getting Started

### Prerequisites

- **Node.js**: Version 20.x or higher (required for latest dependencies)
- **pnpm**: Version 8.x or higher
- **Git**: Latest version recommended
- **Visual Studio Build Tools**: (For native module compilation)
- **Python**: Version 3.x (For native module compilation)

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
- Build specific package: `pnpm --filter @codai/memory-graph build`
- Watch mode: `pnpm dev`
- Build only applications: `pnpm build:apps`
- Build only extensions: `pnpm build:extensions`
- Package Electron app: `pnpm aide:package`

### Testing

- Run all tests: `pnpm test:packages`
- Run tests with coverage: `pnpm test:coverage`
- Run tests for a specific package: `pnpm --filter @codai/memory-graph test`
- Run smoke tests: `pnpm smoketest`

### Code Quality

- Lint code: `pnpm lint`
- Format code: `pnpm format`
- Type check: `pnpm typecheck`
- Run security audit: `pnpm security:audit`

## Architecture

### Memory Graph

The memory graph is the core data structure used by AIDE to store and organize project information. It's a persistent graph-based data model that represents code, requirements, and relationships.

Key components:
- **GraphNode**: Base entity in the memory graph
- **GraphEdge**: Relationships between nodes
- **Persistence Layer**: Adapters for different storage backends
- **Query Engine**: Methods for traversing and querying the graph

### Agent Runtime

The agent runtime orchestrates multiple specialized AI agents that work together to build software. Each agent has specific responsibilities:

- **PlannerAgent**: Breaks down requirements into actionable tasks
- **BuilderAgent**: Generates and modifies code
- **DesignerAgent**: Creates UI/UX components
- **TesterAgent**: Writes and runs tests
- **DeployerAgent**: Handles deployment

Communication between agents happens through a message bus with a standardized protocol.

### UI Components

Shared React components used across different parts of the application. Built with:
- TypeScript for type safety
- Tailwind CSS for styling
- Radix UI for accessible primitives
- Framer Motion for animations

## Environment Configuration

Each application may require specific environment variables. Template files are provided as `.env.example` in relevant directories. Copy these to `.env` files in the same location and fill in values.

### Common Environment Variables

See individual `.env.example` files in each application directory for specific requirements.

## Debugging

### VS Code Launch Configurations

Launch configurations are provided for debugging:

1. **AIDE Desktop**: Debug the Electron application
   - Use the "Launch AIDE Desktop" configuration
   - Set breakpoints in the renderer or main process

2. **Extension Development**: Debug VS Code extensions
   - Use the "Extension Development Host" configuration
   - Enables hot-reloading of extension code

### Common Issues

1. **Native Module Compilation Errors**
   - Ensure Visual Studio Build Tools are installed
   - Use the correct Node.js version (see package.json)
   - Check Python version compatibility

2. **Watch Mode Not Working**
   - Check that no other watch process is running
   - Use the kill commands to terminate existing processes: `pnpm kill-watchd`

3. **Type Errors**
   - Run `pnpm typecheck` to identify issues
   - Ensure all dependencies are correctly installed

## Contribution Guidelines

1. Create a feature branch from `main`
2. Make changes following the project's code style
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

### Commit Guidelines

Follow the Conventional Commits style:

```
<type>(<scope>): <short summary>
```

Where `type` is one of:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Tests
- chore: Maintenance

## License

MIT
