# AIDE: AI-Native Development Environment

An AI-first, conversation-driven IDE where users build, design, test, and deploy software through natural language interaction.

## 🚀 Vision

AIDE transforms software development from manual coding to conversational creation. Users express goals and ideas naturally, while AI agents handle architecture, implementation, testing, and deployment across all platforms.

## 🏗️ Architecture

- **Memory Graph**: Replaces traditional source files with a persistent intent graph
- **Agent Runtime**: Modular sub-agents for planning, building, designing, testing, and deploying
- **Universal Deployment**: Web, iOS, Android, and Desktop from a single conversation
- **Copilot Integration**: Custom GitHub Copilot extension for seamless AI interaction

## 📦 Project Structure

```
aide/
├── packages/           # Core shared packages
│   ├── memory-graph/   # Memory graph engine with persistence
│   ├── agent-runtime/  # Agent orchestration
│   ├── ui-components/  # Shared UI components
│   └── deployment/     # Universal deployment engine
├── extensions/         # VS Code extensions
│   └── copilot/        # Custom Copilot extension
├── apps/              # Platform applications
│   ├── electron/      # Main AIDE desktop app
│   ├── web/           # Web version
│   └── mobile/        # Expo mobile app
└── docs/              # Documentation
```

## 🛠️ Tech Stack

- **Framework**: React + TypeScript
- **Runtime**: Electron (desktop), Expo EAS (mobile), Vercel (web)
- **Styling**: Tailwind CSS
- **State**: Memory graph-driven runtime
- **Package Manager**: pnpm with workspaces
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint + Prettier

## 🚦 Getting Started

```bash
# Install dependencies
pnpm install

# Build all shared packages
pnpm build:packages

# Start development with watch mode
pnpm dev

# Build and run the AIDE application
pnpm aide:dev

# Run tests
pnpm test
pnpm build

# Start development
pnpm aide:dev
```

## 🛠️ Implementation Progress

- **Memory Graph**

  - ✅ Core graph schema and operations
  - ✅ Reactive data handling with RxJS
  - ✅ Modular persistence system with adapters
  - ✅ Schema migration system for versioning
  - ⏳ Advanced query capabilities

- **Agent Runtime**

  - ✅ Multi-agent architecture
  - ✅ Message passing system
  - ⏳ AI model integration
  - ⏳ Agent coordination

- **Extensions**
  - ✅ Basic VS Code integration
  - ⏳ Enhanced conversational UI
  - ⏳ Memory graph visualization

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

Open core model with commercial licensing available for enterprise modules.
