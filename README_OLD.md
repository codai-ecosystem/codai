# AIDE: AI-Native Development Environment

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.1.0-green.svg)](https://github.com/aide-dev/aide/releases)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black.svg)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.x-orange.svg)](https://firebase.google.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

**🎉 Milestone 1 Complete!** [View Completion Report](MILESTONE1_FINAL_COMPLETION_REPORT.md)

</div>

An AI-first, conversation-driven development environment where users build, design, test, and deploy software through natural language interaction.

## 🚀 Vision

AIDE transforms software development from manual coding to conversational creation. Users express goals and ideas naturally, while AI agents handle architecture, implementation, testing, and deployment across all platforms. Our agent-based approach ensures a seamless experience from idea to deployment, eliminating traditional development bottlenecks.

## ✨ Key Features

- **Conversational Development**: Express your software requirements in natural language
- **Multi-Agent Intelligence**: Specialized AI agents for planning, coding, design, testing, and deployment
- **Knowledge Graph**: Persistent memory graph that learns and understands your project context
- **Universal Deployment**: Build for desktop, web, and mobile from a single conversation
- **VS Code Integration**: Seamlessly integrates with existing development workflows
- **Centralized Control Panel**: Monitor and manage all agents from a unified interface

## 🏗️ Architecture

- **Memory Graph**: Persistent knowledge store that captures project understanding
- **Agent Runtime**: Task-orchestrated system for coordinating agents
- **Control Panel**: Admin interface for monitoring and configuring agents
- **Authentication**: Firebase-based security with role-based access control
- **API Endpoints**: RESTful APIs for agent interaction and management
- **Cloud Integration**: Seamless deployment and provisioning

## 📦 Project Structure

```
aide/
├── packages/           # Core shared packages
│   ├── memory-graph/   # Memory graph engine with persistence
│   ├── agent-runtime/  # Agent orchestration
│   ├── ui-components/  # Shared UI components
│   └── deployment/     # Universal deployment engine
├── extensions/         # VS Code extensions
│   ├── aide-core/      # Main AIDE extension
│   └── copilot/        # Custom Copilot extension
├── apps/               # Platform applications
│   ├── electron/       # Main AIDE desktop app
│   ├── web/            # Web version
│   ├── aide-control/   # Admin control panel
│   └── aide-landing/   # Public-facing website
└── docs/               # Documentation
```

## 🛠️ Tech Stack

- **Language**: TypeScript
- **Framework**: React
- **Runtime**: Electron (desktop), Next.js (web)
- **Styling**: Tailwind CSS with Radix UI primitives
- **State**: Memory graph-driven runtime
- **Package Manager**: pnpm with workspaces
- **Testing**: Vitest + React Testing Library + Playwright
- **Linting**: ESLint + Prettier

## 🚦 Getting Started

### Prerequisites

- **Node.js**: Version 20 or higher
- **pnpm**: Version 8 or higher
- **Git**: Latest version
- **Visual Studio Build Tools**: For native dependency compilation

### Installation

```bash
# Clone the repository
git clone https://github.com/aide-dev/aide.git
cd aide

# Install dependencies
pnpm install

# Build all shared packages
pnpm build:packages

# Start the development environment
pnpm dev
```

### Development Commands

```bash
# Run the AIDE desktop application
pnpm aide:dev

# Run the web application
pnpm web:dev

# Run the control panel
cd apps/aide-control
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test:packages
```

## 🛠️ Implementation Progress

<table>
  <tr>
    <th>Component</th>
    <th>Feature</th>
    <th>Status</th>
    <th>Notes</th>
  </tr>
  <tr>
    <td rowspan="5"><strong>Memory Graph</strong></td>
    <td>Core graph schema</td>
    <td>✅ Complete</td>
    <td>Entity-relation graph model with typed nodes</td>
  </tr>
  <tr>
    <td>Firestore persistence</td>
    <td>✅ Complete</td>
    <td>Real-time sync with cloud database</td>
  </tr>
  <tr>
    <td>Reactive updates</td>
    <td>✅ Complete</td>
    <td>Real-time data updates with RxJS</td>
  </tr>
  <tr>
    <td>Context retrieval</td>
    <td>✅ Complete</td>
    <td>Semantic search in memory graph</td>
  </tr>
  <tr>
    <td>Advanced query API</td>
    <td>⏳ In Progress</td>
    <td>Planned for Phase 2</td>
  </tr>
  <tr>
    <td rowspan="5"><strong>Agent Runtime</strong></td>
    <td>Task management</td>
    <td>✅ Complete</td>
    <td>Create, track, and complete tasks</td>
  </tr>
  <tr>
    <td>Agent communication</td>
    <td>✅ Complete</td>
    <td>Message passing between agents</td>
  </tr>
  <tr>
    <td>Firestore integration</td>
    <td>✅ Complete</td>
    <td>Persistent task storage</td>
  </tr>
  <tr>
    <td>LLM integration</td>
    <td>⏳ In Progress</td>
    <td>OpenAI and Anthropic APIs</td>
  </tr>
  <tr>
    <td>Tool usage framework</td>
    <td>⏳ In Progress</td>
    <td>Planned for Phase 2</td>
  </tr>
  <tr>
    <td rowspan="5"><strong>Control Panel</strong></td>
    <td>Agent management UI</td>
    <td>✅ Complete</td>
    <td>Responsive Tailwind UI</td>
  </tr>
  <tr>
    <td>REST API endpoints</td>
    <td>✅ Complete</td>
    <td>All 40+ endpoints implemented</td>
  </tr>
  <tr>
    <td>Authentication</td>
    <td>✅ Complete</td>
    <td>Firebase JWT auth with roles</td>
  </tr>
  <tr>
    <td>Admin dashboard</td>
    <td>✅ Complete</td>
    <td>Usage stats and monitoring</td>
  </tr>
  <tr>
    <td>API key management</td>
    <td>✅ Complete</td>
    <td>Create, revoke, and monitor keys</td>
  </tr>
  <tr>
    <td rowspan="5"><strong>Infrastructure</strong></td>
    <td>Next.js 15 build</td>
    <td>✅ Complete</td>
    <td>TypeScript errors fixed</td>
  </tr>
  <tr>
    <td>Firebase Admin</td>
    <td>✅ Complete</td>
    <td>Secure server-side access</td>
  </tr>
  <tr>
    <td>Route handlers</td>
    <td>✅ Complete</td>
    <td>All dynamic routes updated</td>
  </tr>
  <tr>
    <td>Error handling</td>
    <td>✅ Complete</td>
    <td>Consistent error responses</td>
  </tr>
  <tr>
    <td>Comprehensive testing</td>
    <td>⏳ In Progress</td>
    <td>Planned for Phase 2</td>
  </tr>
</table>

## 🏆 Milestone Achievements

### Milestone 1 (✅ Completed)

- **Build System**: Fixed all TypeScript errors in Next.js 15 dynamic route handlers
- **Database Integration**: Implemented real Firestore data storage with Firebase Admin SDK
- **API Layer**: Completed all 40+ REST endpoints for agent, project, and user management
- **User Interface**: Created modern responsive UI with Tailwind CSS
- **Security**: Added JWT-based authentication and role-based access control
- **Agent Runtime**: Implemented task creation, management, and status tracking
- **Memory Graph**: Added basic memory graph integration for context retention

### Milestone 2 (🚧 In Progress)

- **Testing Framework**: Comprehensive unit, integration, and E2E tests
- **Performance**: Advanced caching and query optimization
- **Security**: Enhanced authentication with fine-grained permissions
- **Real-time Updates**: WebSocket integration for live agent feedback
- **Monitoring**: Error tracking, logging, and performance monitoring
- **Deployment**: Production-ready deployment with scalability
- **Documentation**: Complete API docs and developer guides

## 📚 Documentation

- [Development Guide](DEVELOPMENT.md): Comprehensive guide for developers
- [Deployment Guide](DEPLOYMENT.md): Instructions for deployment
- [API Documentation](docs/API.md): API documentation
- [Security Audit](SECURITY_AUDIT.md): Security documentation and best practices
- [Coding Standards](CODING_STANDARDS_REVIEW.md): Code quality review and standards
- [Milestone 1 Report](MILESTONE1_FINAL_COMPLETION_REPORT.md): Final Milestone 1 achievements
- [Phase 2 Technical Guide](PHASE2_TECHNICAL_IMPLEMENTATION_GUIDE.md): Detailed technical implementation guide

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

Open core model with commercial licensing available for enterprise modules.
