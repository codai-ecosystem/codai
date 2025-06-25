# Milestone 1 to Phase 2 Migration Guide

## Overview

This document provides a structured approach for transitioning from Milestone 1 to Phase 2 of the AIDE platform development. It outlines the steps needed to build upon the foundation established in Milestone 1 while ensuring a smooth migration path.

## Current State (Milestone 1)

✅ **Build System**: Fixed TypeScript errors and Next.js 15 dynamic route handlers
✅ **Database Integration**: Real Firestore data storage with Firebase Admin SDK
✅ **API Layer**: Functional REST endpoints for agent, project, and user management
✅ **Agent Runtime**: Basic task management system with real database persistence
✅ **Memory Graph**: Initial implementation with mock interfaces
✅ **User Interface**: Basic Tailwind CSS UI for agent management
✅ **Authentication**: JWT-based auth with role verification

## Target State (Phase 2)

🎯 **Build System**: Fully optimized build pipeline with comprehensive testing
🎯 **Database Integration**: Enhanced query performance and caching
🎯 **API Layer**: GraphQL API + REST with real-time capabilities
🎯 **Agent Runtime**: Production-ready runtime with advanced reasoning
🎯 **Memory Graph**: Full implementation with persistent context
🎯 **User Interface**: Rich interactive dashboard with visual feedback
🎯 **Authentication**: Advanced security features and fine-grained permissions

## Migration Steps

### 1. Development Environment Setup

```bash
# Create a new branch from the Milestone 1 completion
git checkout -b phase-2-development main

# Install new dependencies
pnpm add graphql @apollo/server @apollo/client zod react-query

# Install development dependencies
pnpm add -D vitest @testing-library/react @testing-library/user-event @playwright/test
```

### 2. Workspace Dependencies

1. **Resolve pnpm workspace issues**:

```json
// package.json in root
{
	"name": "aide-monorepo",
	"private": true,
	"workspaces": ["apps/*", "packages/*"],
	"dependencies": {
		// Core dependencies for all workspaces
	}
}
```

2. **Create or update the missing workspace packages**:

```bash
# Create memory-graph package if missing
mkdir -p packages/memory-graph
cd packages/memory-graph

# Initialize package
pnpm init
pnpm add typescript firebase react rxjs zod

# Create essential files
touch src/index.ts
touch tsconfig.json
```

3. **Update package references**:

```json
// apps/aide-control/package.json
{
	"dependencies": {
		"@aide/memory-graph": "workspace:*",
		"@aide/agent-runtime": "workspace:*"
	}
}
```

### 3. Database Migration

1. **Create migration script for schema updates**:

```typescript
// scripts/migrate-schema.ts
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert } from 'firebase-admin/app';

async function migrateSchema() {
	try {
		// Initialize Firebase Admin
		const credentials = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS || '{}');

		initializeApp({
			credential: cert(credentials),
		});

		const db = getFirestore();

		// Migrate agent_tasks collection
		const taskDocs = await db.collection('agent_tasks').get();
		const batch = db.batch();

		taskDocs.forEach(doc => {
			const data = doc.data();

			// Add new fields required in Phase 2
			batch.update(doc.ref, {
				executionGraph: data.executionGraph || { nodes: [], edges: [] },
				metrics: data.metrics || {
					tokensUsed: 0,
					executionTimeMs: 0,
					stepCount: 0,
				},
				updatedAt: new Date().toISOString(),
				// Convert string dates to timestamps if needed
				createdAt: data.createdAt,
			});
		});

		// Apply migrations in batches
		await batch.commit();
		console.log(`Migrated ${taskDocs.size} task documents`);

		// Add more collection migrations as needed...
	} catch (error) {
		console.error('Migration failed:', error);
		process.exit(1);
	}
}

migrateSchema();
```

2. **Run the migration script**:

```bash
# Execute migration
pnpm tsx scripts/migrate-schema.ts
```

### 4. API Layer Evolution

1. **Add GraphQL server alongside REST endpoints**:

```typescript
// apps/aide-control/lib/graphql/schema.ts
import { gql } from '@apollo/server';

export const typeDefs = gql`
	type Agent {
		id: ID!
		name: String!
		description: String
		status: String!
		capabilities: [String!]
	}

	type Task {
		id: ID!
		title: String!
		description: String!
		status: String!
		agentId: String
		userId: String!
		projectId: String
		priority: String!
		progress: Float!
		createdAt: String!
		startedAt: String
		completedAt: String
		error: String
	}

	type Query {
		agents(status: String): [Agent!]!
		tasks(status: String): [Task!]!
		task(id: ID!): Task
	}

	type Mutation {
		createTask(input: CreateTaskInput!): Task!
		cancelTask(id: ID!): Task!
	}

	input CreateTaskInput {
		title: String!
		description: String!
		agentId: String
		projectId: String
		priority: String
	}
`;
```

2. **Create resolvers**:

```typescript
// apps/aide-control/lib/graphql/resolvers.ts
import { AgentRuntimeService } from '../services/agent-runtime-service';

export const resolvers = {
	Query: {
		agents: async (_, { status }, { userId }) => {
			const runtimeService = AgentRuntimeService.getInstance();
			return await runtimeService.getAvailableAgents(userId);
		},
		tasks: async (_, { status }, { userId }) => {
			const runtimeService = AgentRuntimeService.getInstance();
			return await runtimeService.getUserTasks(userId, status);
		},
		task: async (_, { id }, { userId }) => {
			const runtimeService = AgentRuntimeService.getInstance();
			return await runtimeService.getTask(id, userId);
		},
	},
	Mutation: {
		createTask: async (_, { input }, { userId }) => {
			const runtimeService = AgentRuntimeService.getInstance();
			return await runtimeService.createTask(userId, input);
		},
		cancelTask: async (_, { id }, { userId }) => {
			const runtimeService = AgentRuntimeService.getInstance();
			return await runtimeService.cancelTask(id, userId);
		},
	},
};
```

3. **Create GraphQL endpoint**:

```typescript
// apps/aide-control/app/api/graphql/route.ts
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { typeDefs } from '../../../lib/graphql/schema';
import { resolvers } from '../../../lib/graphql/resolvers';
import { withAuth } from '../../../lib/auth-middleware';

const server = new ApolloServer({
	typeDefs,
	resolvers,
});

const handler = startServerAndCreateNextHandler(server, {
	context: async req => {
		// Context will be set by withAuth middleware
		return {};
	},
});

export const GET = withAuth(handler);
export const POST = withAuth(handler);
```

### 5. Memory Graph Integration

1. **Update interface definitions**:

```typescript
// packages/memory-graph/src/types.ts
export interface Entity {
	id: string;
	type: string;
	properties: Record<string, any>;
	createdAt: string;
	updatedAt: string;
}

export interface Relation {
	id: string;
	sourceId: string;
	targetId: string;
	type: string;
	properties?: Record<string, any>;
	createdAt: string;
	updatedAt: string;
}

export interface MemoryGraphQuery {
	entities?: {
		types?: string[];
		ids?: string[];
		properties?: Record<string, any>;
	};
	relations?: {
		types?: string[];
		sourceIds?: string[];
		targetIds?: string[];
	};
	limit?: number;
	orderBy?: string;
	orderDir?: 'asc' | 'desc';
}

export interface MemoryGraph {
	createEntity(type: string, properties: Record<string, any>): Promise<Entity>;
	getEntity(id: string): Promise<Entity | null>;
	updateEntity(id: string, properties: Record<string, any>): Promise<Entity>;
	deleteEntity(id: string): Promise<void>;
	createRelation(
		sourceId: string,
		targetId: string,
		type: string,
		properties?: Record<string, any>
	): Promise<Relation>;
	getRelation(id: string): Promise<Relation | null>;
	updateRelation(id: string, properties: Record<string, any>): Promise<Relation>;
	deleteRelation(id: string): Promise<void>;
	query(query: MemoryGraphQuery): Promise<{ entities: Entity[]; relations: Relation[] }>;
}
```

2. **Implement Firestore adapter**:

```typescript
// packages/memory-graph/src/adapters/firestore-adapter.ts
import { getFirestore } from 'firebase-admin/firestore';
import { Entity, MemoryGraph, MemoryGraphQuery, Relation } from '../types';

export class FirestoreMemoryGraph implements MemoryGraph {
	private db: FirebaseFirestore.Firestore;
	private entitiesCollection: string;
	private relationsCollection: string;

	constructor(
		options: {
			db?: FirebaseFirestore.Firestore;
			entitiesCollection?: string;
			relationsCollection?: string;
		} = {}
	) {
		this.db = options.db || getFirestore();
		this.entitiesCollection = options.entitiesCollection || 'memory_entities';
		this.relationsCollection = options.relationsCollection || 'memory_relations';
	}

	async createEntity(type: string, properties: Record<string, any>): Promise<Entity> {
		const now = new Date().toISOString();
		const entityRef = this.db.collection(this.entitiesCollection).doc();

		const entity: Entity = {
			id: entityRef.id,
			type,
			properties,
			createdAt: now,
			updatedAt: now,
		};

		await entityRef.set(entity);
		return entity;
	}

	async getEntity(id: string): Promise<Entity | null> {
		const doc = await this.db.collection(this.entitiesCollection).doc(id).get();
		return doc.exists ? (doc.data() as Entity) : null;
	}

	async updateEntity(id: string, properties: Record<string, any>): Promise<Entity> {
		const entityRef = this.db.collection(this.entitiesCollection).doc(id);
		const now = new Date().toISOString();

		await entityRef.update({
			properties: { ...properties },
			updatedAt: now,
		});

		const updated = await entityRef.get();
		return updated.data() as Entity;
	}

	async deleteEntity(id: string): Promise<void> {
		await this.db.collection(this.entitiesCollection).doc(id).delete();
	}

	// Implementation for relations methods...

	async query(query: MemoryGraphQuery): Promise<{ entities: Entity[]; relations: Relation[] }> {
		// Implementation for querying...
		return { entities: [], relations: [] };
	}
}
```

### 6. Testing Implementation

1. **Setup testing configuration**:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
	plugins: [react()],
	test: {
		environment: 'jsdom',
		setupFiles: ['./vitest.setup.ts'],
		include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		coverage: {
			reporter: ['text', 'json', 'html'],
		},
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		},
	},
});
```

2. **Create test setup**:

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase
vi.mock('firebase/app', () => ({
	initializeApp: vi.fn(),
	getApps: vi.fn(() => []),
}));

vi.mock('firebase/auth', () => ({
	getAuth: vi.fn(),
	signInWithEmailAndPassword: vi.fn(),
	createUserWithEmailAndPassword: vi.fn(),
	onAuthStateChanged: vi.fn(),
}));

// Setup global test utilities
global.mockFirestoreService = () => ({
	logAudit: vi.fn(),
});
```

3. **Add npm scripts**:

```json
// package.json
{
	"scripts": {
		"test": "vitest run",
		"test:watch": "vitest",
		"test:coverage": "vitest run --coverage",
		"test:e2e": "playwright test"
	}
}
```

### 7. Frontend Enhancements

1. **Add React Query for data fetching**:

```typescript
// apps/aide-control/lib/providers/query-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

2. **Update root layout**:

```typescript
// apps/aide-control/app/layout.tsx
import { QueryProvider } from '../lib/providers/query-provider';
import { AuthProvider } from '../lib/providers/auth-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 8. Documentation Update

1. **Update API documentation**:

```bash
# Generate OpenAPI spec
pnpm dlx swagger-jsdoc -d api-docs-config.js -o docs/api-spec.json
```

2. **Create Storybook for UI components** (optional):

```bash
# Install Storybook
pnpm dlx storybook init

# Configure for Next.js
# Edit .storybook/main.js as needed
```

## Deployment Changes

### 1. Update CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, phase-2-*]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Type check
        run: pnpm tsc --noEmit

      - name: Lint
        run: pnpm lint

      - name: Unit tests
        run: pnpm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      # Add deployment steps here for production
```

### 2. Environment Variables

Create updated environment templates:

```
# .env.example
# Core Configuration
NODE_ENV=development
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_API_URL=http://localhost:3000

# Firebase Admin Configuration
FIREBASE_ADMIN_CREDENTIALS=base64-encoded-or-json-credentials

# Auth Configuration
AUTH_SECRET=your-auth-secret
NEXT_PUBLIC_AUTH_DOMAIN=your-auth-domain.firebaseapp.com

# AI Services
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Storage Configuration
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket.appspot.com

# Analytics (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=your-ga-id
```

## Rollback Plan

In case of critical issues during migration, follow these rollback steps:

1. **Code Rollback**:

   ```bash
   git checkout main
   git revert <problematic-commit>
   ```

2. **Database Rollback**:
   - Restore from the pre-migration backup
   - Run the schema downgrade script if available

3. **Environment Rollback**:
   - Switch back to the previous environment variables

## Checklist for Migration

- [ ] Create a new Git branch for Phase 2
- [ ] Resolve pnpm workspace dependencies
- [ ] Execute database schema migrations
- [ ] Implement GraphQL API alongside REST
- [ ] Update Memory Graph with real implementation
- [ ] Set up testing infrastructure
- [ ] Enhance frontend with React Query
- [ ] Update documentation
- [ ] Configure updated CI/CD pipeline
- [ ] Test the complete system before production deployment

## Success Criteria

The migration is considered successful when:

1. All existing Milestone 1 functionality works without regression
2. New Phase 2 features are implemented and tested
3. Test coverage meets target thresholds
4. Performance meets or exceeds benchmarks
5. Security audit passes without critical issues

---

_Document Version: 1.0_
_Last Updated: June 5, 2024_
