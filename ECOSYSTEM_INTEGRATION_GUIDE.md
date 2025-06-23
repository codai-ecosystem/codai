# Codai Ecosystem Integration - Development Guide

## Overview

This document provides a comprehensive guide for the Codai ecosystem integration implementation. The integration connects the codai web service with LogAI (authentication), MemorAI (memory management), and the central Codai platform.

## Phase 1: Core Integration Foundation ✅ COMPLETE

### Implemented Components

#### 1. Environment Configuration
- **Files**: `.env.local`, `.env.production`
- **Purpose**: Centralized environment variable management for all ecosystem services
- **Key Variables**:
  - `LOGAI_API_URL`, `LOGAI_CLIENT_ID`, `LOGAI_CLIENT_SECRET`
  - `MEMORAI_API_URL`, `MEMORAI_API_KEY`, `MEMORAI_AGENT_ID`
  - `CODAI_CENTRAL_API`, `NEXT_PUBLIC_APP_URL`

#### 2. Authentication Integration (LogAI)
- **Files**: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`
- **Technology**: NextAuth.js with custom LogAI provider
- **Features**:
  - JWT session management
  - Automatic token refresh
  - Integration with LogAI authentication service

#### 3. Memory System Integration (MemorAI)
- **Files**: `src/lib/memorai.ts`
- **Technology**: Native fetch API with MCP protocol
- **Methods**:
  - `recall(query, limit)` - Search memory
  - `remember(content, metadata)` - Store information
  - `forget(memoryId)` - Remove memory
  - `getContext(contextSize)` - Get context summary

#### 4. Central Platform Integration
- **Files**: `src/lib/codai-api.ts`
- **Purpose**: Project management and user operations
- **Endpoints**:
  - User profile management
  - Project CRUD operations
  - System health monitoring

#### 5. Integration Status Dashboard
- **Files**: `src/components/ecosystem-integration-dashboard.tsx`
- **Features**:
  - Real-time service health monitoring
  - Visual status indicators
  - Error reporting
  - Auto-refresh capabilities

#### 6. Configuration Management
- **Files**: `src/lib/ecosystem-config.ts`
- **Features**:
  - Type-safe configuration
  - Environment-based settings
  - Configuration validation
  - Feature flags

## Development Setup

### Prerequisites
- Node.js 20+
- pnpm 8+
- Access to LogAI, MemorAI, and Central Platform services

### Environment Setup

1. Copy environment template:
```bash
cp .env.local.example .env.local
```

2. Configure service endpoints:
```env
# LogAI Authentication
LOGAI_API_URL=https://logai.codai.ro
LOGAI_CLIENT_ID=your-client-id
LOGAI_CLIENT_SECRET=your-client-secret

# MemorAI Memory System
MEMORAI_API_URL=https://memorai.codai.ro
MEMORAI_API_KEY=your-api-key
MEMORAI_AGENT_ID=codai-web-agent

# Central Platform
CODAI_CENTRAL_API=https://api.codai.ro
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

## Integration Testing

### Service Health Checks
The integration dashboard provides real-time monitoring of all ecosystem services:

1. **LogAI Authentication**: Verifies user session status
2. **MemorAI Memory System**: Tests MCP connectivity
3. **Central Platform**: Checks API availability

### Manual Testing

#### Authentication Flow
```typescript
// Test LogAI integration
import { signIn, signOut } from 'next-auth/react';

// Sign in with LogAI
await signIn('logai', { email: 'test@example.com', password: 'password' });

// Sign out
await signOut();
```

#### Memory Operations
```typescript
// Test MemorAI integration
import { memoraiService } from '@/lib/memorai';

// Store memory
await memoraiService.remember('Test content', { type: 'test' });

// Recall memory
const results = await memoraiService.recall('test query');

// Get context
const context = await memoraiService.getContext(5);
```

#### Platform API
```typescript
// Test Central Platform integration
import { codaiAPI } from '@/lib/codai-api';

// Health check
const health = await codaiAPI.getSystemHealth();

// Get user projects
const projects = await codaiAPI.getUserProjects(userId, accessToken);
```

## Troubleshooting

### Common Issues

#### 1. Authentication Failures
- **Symptom**: Login redirects fail or tokens invalid
- **Solution**: Verify LogAI service configuration and client credentials

#### 2. Memory Service Errors
- **Symptom**: MemorAI operations timeout or fail
- **Solution**: Check API key, agent ID, and network connectivity

#### 3. Platform API Issues
- **Symptom**: Central platform API calls fail
- **Solution**: Verify API endpoint and authentication tokens

### Debug Commands

```bash
# Check service configuration
node -e "console.log(require('./src/lib/ecosystem-config').ecosystemConfig)"

# Test service connectivity
curl -H "Authorization: Bearer $MEMORAI_API_KEY" $MEMORAI_API_URL/health
```

## Next Phase: Service Architecture Alignment

### Upcoming Implementations

#### 1. Port Standardization
- Configure all services to use port 3000
- Update development and production configurations

#### 2. Domain Configuration
- Set up routing for codai.ro domain
- Configure SSL certificates and DNS

#### 3. Package Migration
- Migrate from `@dragoscatalin/*` to `@codai/*` namespace
- Update all package references and dependencies

#### 4. Extension Cleanup
- Implement minimal extension strategy
- Remove 45+ unnecessary VS Code extensions
- Keep only GitHub Copilot and Chat

## Production Deployment

### Environment Variables
Ensure all production environment variables are configured:

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://codai.ro
LOGAI_API_URL=https://logai.codai.ro
MEMORAI_API_URL=https://memorai.codai.ro
CODAI_CENTRAL_API=https://api.codai.ro
```

### Build Commands
```bash
# Production build
pnpm build

# Start production server
pnpm start
```

### Health Monitoring
The integration dashboard provides production monitoring capabilities:
- Service availability checks
- Error tracking and reporting
- Performance metrics

## Architecture Notes

### Design Patterns
- **Service Layer**: Clean separation between UI and API integration
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Configuration**: Environment-based configuration with validation
- **Type Safety**: Full TypeScript implementation with strict typing

### Security Considerations
- JWT token management with automatic refresh
- API key protection through environment variables
- HTTPS-only production configuration
- CORS configuration for cross-origin requests

This integration provides a solid foundation for the codai ecosystem, enabling seamless authentication, memory management, and platform integration while maintaining scalability and maintainability.
