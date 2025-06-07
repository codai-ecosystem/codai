# CODAI.RO Control Panel

The CODAI.RO Control Panel (formerly AIDE Control Panel) is an administrative dashboard for managing the CODAI.RO platform's dual-mode infrastructure system. It provides tools for managing users, API keys, billing plans, and usage statistics.

## Dual-Mode Infrastructure System

The AIDE platform supports two modes of operation:

1. **Managed Mode**: Users rely on preconfigured services hosted by the AIDE platform. In this mode, the platform handles all API keys, rate limiting, and billing.

2. **Self-Managed Mode**: Users bring their own API keys for external services. In this mode, users are responsible for managing their own API keys and quotas.

The dual-mode infrastructure system provides a flexible approach that allows users to choose the mode that best fits their needs.

## Features

- **User Management**: Create, update, and delete user accounts. Assign roles and permissions.
- **API Key Management**: Configure and manage API keys for external services like OpenAI, Azure, Anthropic, etc.
- **Billing Plans**: Define and manage subscription plans with different pricing tiers.
- **Usage Statistics**: Track and analyze platform usage across different services.
- **Service Configuration**: Configure service-specific settings and defaults.

### Advanced UI Features

- **Responsive Dashboard Layout**: Optimized for both desktop and mobile devices
- **Dark Mode Support**: Toggle between light and dark themes using system preferences or manual toggle
- **Command Palette**: Quick access to actions and navigation with Ctrl+K, with command history
- **Real-time Notifications**: Display success, error, warning, and info notifications
- **User Preferences System**: Persistent settings for theme, sidebar state, and command history
- **Keyboard Shortcuts**:
  - `Ctrl+K`: Open command palette
  - `Ctrl+/`: Toggle sidebar visibility
  - `Ctrl+\`: Toggle sidebar collapsed state
  - `Ctrl+L`: Switch to light theme
  - `Ctrl+D`: Switch to dark theme
  - `Ctrl+S`: Use system theme
  - `Ctrl+R`: Refresh dashboard data
- **Responsive Sidebar Navigation**: Collapsible sidebar with icon-only mode
- **Accessibility**: Keyboard navigable interface with ARIA attributes and screen reader support

## User Preferences

The dashboard includes a user preferences system that persists the following settings:

- **Theme**: Light, dark, or system preference
- **Sidebar State**: Collapsed (icons only) or expanded (icons with labels)
- **Command History**: Recently used commands for quick access
- **Dismissed Notifications**: Track which notifications have been dismissed
- **Accessibility Settings**: Motion reduction, high contrast, and text size preferences

Preferences are automatically saved to localStorage and applied across sessions.

## Testing

✅ **All tests passing!** The dashboard includes comprehensive tests for components and utilities. For more details, see [Testing Documentation](./docs/testing.md).

### Test Coverage Status

- **22/22 tests passing** across user preferences and localStorage functionality
- **Critical bug fixed**: Object reference mutation in user preferences system
- **Complete test isolation**: Tests run independently without cross-contamination
- **Robust browser API mocks**: Full DOM environment simulation for component testing

### Testing Components and Utilities

- **Component Tests**: Verify rendering, user interactions, state management, accessibility, and edge cases
- **Utility Tests**: Verify API functionality, error handling, and edge cases
- **User Preferences Tests**: Verify persistence, default values, and error handling

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

Tests are implemented using Vitest, Testing Library, and Jest DOM matchers. For more information on writing tests, see the [Testing Documentation](./docs/testing.md).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Deployment Options

The AIDE Control Panel can be deployed in several ways:

### 1. Deploy to Google Cloud Run

The recommended production deployment option is Google Cloud Run:

```bash
# Linux/macOS
./deploy-to-cloud-run.sh [PROJECT_ID] [REGION]

# Windows
deploy-to-cloud-run.bat [PROJECT_ID] [REGION]
```

See the [Deployment Guide](./DEPLOY.md) for detailed instructions.

### 2. GitHub Actions CI/CD

Continuous deployment can be set up using the included GitHub Action workflow:

1. Add the required secrets to your GitHub repository
2. Push changes to the `main` branch
3. The workflow will automatically build and deploy to Google Cloud Run

### 3. Docker Standalone

Run the Docker container in any environment that supports Docker:

```bash
# Build the image
docker build -t aide-control .

# Run the container
docker run -p 8080:8080 \
  -e NEXT_PUBLIC_FIREBASE_API_KEY=your_value \
  -e NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_value \
  -e FIREBASE_ADMIN_CREDENTIALS=base64_encoded_value \
  aide-control
```

## Environment Configuration

See [.env.example](./.env.example) for required environment variables.

## Health Check Implementation

The application includes health check endpoints for reliable container orchestration. See [Health Check Documentation](./docs/health-checks.md) for details.

## Technologies

- Next.js
- React
- TypeScript
- Tailwind CSS
- Headless UI
- Hero Icons

## Project Structure

- `app/` - Next.js application routes and pages
- `components/` - Reusable UI components
  - `layout/` - Layout components like DashboardLayout
  - `ui/` - UI components like Notifications, CommandPalette
- `lib/` - Utility functions and helpers
- `public/` - Static assets
- `types/` - TypeScript type definitions

## Key UI Components

### DashboardLayout

The main layout component that provides the shell for the dashboard. It includes the sidebar navigation, header, theme toggle, and content area.

### CommandPalette

A keyboard-accessible command palette that allows users to quickly navigate and execute actions using Ctrl+K.

### Notifications

A notification system that displays success, error, warning, and info notifications with auto-dismiss capability.
