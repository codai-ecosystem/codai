# AIDE Control Panel

The AIDE Control Panel is an administrative dashboard for managing the AIDE platform's dual-mode infrastructure system. It provides tools for managing users, API keys, billing plans, and usage statistics.

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
