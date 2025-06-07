# Phase 2 Technical Implementation Guide

## Overview

This document provides technical guidance for implementing Phase 2 of the AIDE platform, building upon the foundation established in Milestone 1. It outlines the architecture, key components, and implementation strategies to guide the development team.

## Architecture Components

### 1. Agent Runtime System

#### Current State
- Basic agent runtime service implemented with task management
- Mock implementations for development and testing
- Simple task creation and status tracking

#### Phase 2 Implementation
- **Real-time Agent Communication**
  ```typescript
  // Implementation for real-time agent communication
  export class AgentCommunicationService {
    private websocketConnections = new Map<string, WebSocket>();

    // Connect a user's client to receive real-time updates
    async connectClient(userId: string, websocket: WebSocket): Promise<void> {
      this.websocketConnections.set(userId, websocket);
      // Subscribe to agent events
    }

    // Send updates to connected clients
    private broadcastUpdate(userId: string, update: AgentUpdate): void {
      const connection = this.websocketConnections.get(userId);
      if (connection && connection.readyState === WebSocket.OPEN) {
        connection.send(JSON.stringify(update));
      }
    }
  }
  ```

- **Advanced Task Planning**
  ```typescript
  // Enhanced task planning with dependencies
  async createTaskGroup(
    userId: string,
    projectId: string,
    tasks: TaskDefinition[]
  ): Promise<TaskGroup> {
    // Create a group of related tasks with dependencies
    const taskGroup = {
      id: `tg_${Date.now()}`,
      projectId,
      userId,
      tasks: [],
      status: 'pending',
      createdAt: new Date()
    };

    // Process and create individual tasks with dependencies
    // ...

    return taskGroup;
  }
  ```

### 2. Memory Graph Integration

#### Current State
- Mock implementation of memory graph
- Basic entity and relation structure

#### Phase 2 Implementation
- **Full Memory Graph Integration**
  ```typescript
  export class MemoryGraphService {
    private graphDb: MemoryGraphDatabase;

    constructor() {
      this.graphDb = new MemoryGraphDatabase();
    }

    // Store agent reasoning steps in memory graph
    async storeReasoning(
      userId: string,
      taskId: string,
      reasoningSteps: ReasoningStep[]
    ): Promise<void> {
      // Create nodes for each reasoning step
      for (const step of reasoningSteps) {
        await this.graphDb.createNode({
          type: 'reasoning_step',
          taskId,
          content: step.content,
          timestamp: new Date(),
          metadata: step.metadata
        });
      }

      // Create relationships between steps
      // ...
    }

    // Retrieve context for a task
    async getContextForTask(taskId: string): Promise<TaskContext> {
      // Query memory graph for relevant context
      // ...
    }
  }
  ```

- **Knowledge Persistence**
  ```typescript
  // Store and retrieve persistent knowledge
  async storeKnowledge(
    userId: string,
    projectId: string,
    knowledge: Knowledge
  ): Promise<void> {
    // Store knowledge entities and relationships
    // ...
  }

  async queryKnowledge(
    userId: string,
    projectId: string,
    query: KnowledgeQuery
  ): Promise<KnowledgeResult[]> {
    // Semantic search in the knowledge graph
    // ...
  }
  ```

### 3. Enhanced API Layer

#### Current State
- Basic REST API endpoints for agent management
- Simple authentication middleware

#### Phase 2 Implementation
- **GraphQL API Gateway**
  ```typescript
  // schema.ts
  const typeDefs = gql`
    type Agent {
      id: ID!
      name: String!
      capabilities: [String!]!
      status: AgentStatus!
    }

    type Task {
      id: ID!
      title: String!
      status: TaskStatus!
      progress: Float!
      agent: Agent
      createdAt: DateTime!
      # ...
    }

    type Query {
      agents(status: AgentStatus): [Agent!]!
      tasks(status: TaskStatus): [Task!]!
      task(id: ID!): Task
    }

    type Mutation {
      createTask(input: CreateTaskInput!): Task!
      cancelTask(id: ID!): Task!
      # ...
    }

    type Subscription {
      taskUpdated(id: ID!): Task!
      agentStatusChanged: Agent!
    }
  `;

  // resolvers.ts
  const resolvers = {
    Query: {
      agents: async (_, { status }, { userId }) => {
        const runtimeService = AgentRuntimeService.getInstance();
        return await runtimeService.getAvailableAgents(userId, status);
      },
      // ...
    },
    Mutation: {
      createTask: async (_, { input }, { userId }) => {
        const runtimeService = AgentRuntimeService.getInstance();
        return await runtimeService.createTask(userId, input);
      },
      // ...
    },
    Subscription: {
      taskUpdated: {
        subscribe: (_, { id }, { userId }) => {
          // Set up subscription
          // ...
        }
      },
      // ...
    }
  };
  ```

- **Rate Limiting & Quota Management**
  ```typescript
  // Enhanced quota middleware
  export function quotaMiddleware(options: QuotaOptions) {
    return async (req: NextRequest) => {
      const token = req.headers.get('Authorization')?.split(' ')[1];
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const userId = await getUserIdFromToken(token);

      // Check user quota
      const usageTracker = new UsageTracker();
      const result = await usageTracker.checkAndUpdateQuota(userId, {
        endpoint: req.nextUrl.pathname,
        method: req.method,
        quotaType: options.quotaType,
        units: options.calculateUnits ? options.calculateUnits(req) : 1
      });

      if (!result.allowed) {
        return NextResponse.json({
          error: 'Quota exceeded',
          limit: result.limit,
          reset: result.reset
        }, { status: 429 });
      }

      // Continue to handler
      // ...
    };
  }
  ```

### 4. Frontend Enhancements

#### Current State
- Basic HTML and Tailwind CSS UI
- Simple agent listing and management

#### Phase 2 Implementation
- **Interactive Task Visualization**
  ```tsx
  // components/TaskGraph.tsx
  export function TaskGraph({ taskId }: { taskId: string }) {
    const [taskData, setTaskData] = useState<TaskGraphData | null>(null);
    const graphRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      // Fetch task graph data
      apiClient.getTaskGraph(taskId).then(setTaskData);

      // Set up real-time updates
      const ws = new WebSocket(`${wsBaseUrl}/tasks/${taskId}/graph`);
      ws.onmessage = (event) => {
        const update = JSON.parse(event.data);
        setTaskData(prev => ({...prev, ...update}));
      };

      return () => ws.close();
    }, [taskId]);

    useEffect(() => {
      if (taskData && graphRef.current) {
        // Render graph using D3 or similar
        renderGraph(graphRef.current, taskData);
      }
    }, [taskData]);

    return (
      <div className="task-graph-container">
        <div className="task-graph" ref={graphRef}></div>
        <div className="task-legend">
          {/* Legend items */}
        </div>
      </div>
    );
  }
  ```

- **Real-time Agent Monitoring Dashboard**
  ```tsx
  // pages/dashboard.tsx
  export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activeAgents, setActiveAgents] = useState<AgentStatus[]>([]);
    const [recentTasks, setRecentTasks] = useState<TaskSummary[]>([]);

    useEffect(() => {
      // Initial data load
      apiClient.getDashboardStats().then(setStats);
      apiClient.getActiveAgents().then(setActiveAgents);
      apiClient.getRecentTasks().then(setRecentTasks);

      // Set up real-time updates
      const eventSource = new EventSource('/api/dashboard/events');
      eventSource.addEventListener('stats-update', (event) => {
        setStats(JSON.parse(event.data));
      });
      eventSource.addEventListener('agent-update', (event) => {
        const updatedAgent = JSON.parse(event.data);
        setActiveAgents(prev => prev.map(a =>
          a.id === updatedAgent.id ? updatedAgent : a
        ));
      });
      eventSource.addEventListener('task-update', (event) => {
        const updatedTask = JSON.parse(event.data);
        setRecentTasks(prev => {
          const existing = prev.findIndex(t => t.id === updatedTask.id);
          if (existing >= 0) {
            return [
              ...prev.slice(0, existing),
              updatedTask,
              ...prev.slice(existing + 1)
            ];
          }
          return [updatedTask, ...prev.slice(0, 9)];
        });
      });

      return () => eventSource.close();
    }, []);

    return (
      <div className="dashboard">
        <DashboardHeader stats={stats} />
        <div className="dashboard-grid">
          <AgentsPanel agents={activeAgents} />
          <TasksPanel tasks={recentTasks} />
          <ResourcesPanel stats={stats?.resources} />
          <AlertsPanel />
        </div>
      </div>
    );
  }
  ```

## Database Schema Enhancements

### Current Schema
- Simple Firestore collections for users, projects, and tasks

### Phase 2 Schema
```typescript
// Enhanced Firestore schema
export const COLLECTIONS = {
  USERS: 'users',
  PROJECTS: 'projects',
  TASKS: 'tasks',
  TASK_GROUPS: 'task_groups',
  AGENT_MEMORY: 'agent_memory',
  KNOWLEDGE_GRAPH: 'knowledge_graph',
  USAGE: 'usage',
  BILLING: 'billing',
  AUDIT_LOGS: 'audit_logs',
  SYSTEM_CONFIG: 'system_config',
};

// User document schema
export interface UserDocument {
  uid: string;
  email: string;
  displayName?: string;
  role: 'user' | 'admin' | 'developer';
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    defaultAgentSettings: Record<string, any>;
  };
  subscription: {
    plan: string;
    status: 'active' | 'trialing' | 'past_due' | 'canceled';
    currentPeriodEnd: string;
  };
  quotas: {
    taskMinutes: {
      limit: number;
      used: number;
      reset: string;
    };
    storageBytes: {
      limit: number;
      used: number;
    };
    apiCalls: {
      limit: number;
      used: number;
      reset: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

// Task document schema
export interface TaskDocument {
  id: string;
  userId: string;
  projectId?: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  agentId: string;
  parentTaskId?: string;
  subtaskIds: string[];
  dependencies: string[];
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  error?: string;
  progress: number;
  estimatedDuration?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  executionGraph?: {
    nodes: Array<{
      id: string;
      type: string;
      status: string;
      data: any;
    }>;
    edges: Array<{
      source: string;
      target: string;
      label: string;
    }>;
  };
  metrics: {
    tokensUsed?: number;
    executionTimeMs?: number;
    stepCount?: number;
    memoryUsageBytes?: number;
  };
}
```

## Security Implementation

### Current Security
- Basic Firebase Authentication
- Admin middleware for protected routes

### Phase 2 Security
- **Enhanced Auth Middleware**
  ```typescript
  export function withAuth(handler: AuthenticatedHandler) {
    return async (req: NextRequest) => {
      const token = req.headers.get('Authorization')?.split(' ')[1];
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      try {
        // Verify and decode token
        const decoded = await verifyIdToken(token);
        const user = await getUserDocument(decoded.uid);

        // Check if user is active
        if (!user || user.status !== 'active') {
          return NextResponse.json({ error: 'Account inactive' }, { status: 403 });
        }

        // Check for required role
        if (
          handler.requiredRole &&
          !hasRequiredRole(user, handler.requiredRole)
        ) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        // Check resource access if applicable
        const resourceId = req.nextUrl.pathname.split('/').pop();
        if (
          resourceId &&
          handler.checkResourceAccess &&
          !(await handler.checkResourceAccess(user.uid, resourceId))
        ) {
          return NextResponse.json({ error: 'Access denied to resource' }, { status: 403 });
        }

        // All checks passed, execute handler
        return handler(req, user);
      } catch (error) {
        console.error('Authentication error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
      }
    };
  }
  ```

- **Data Validation**
  ```typescript
  // Enhanced validation schemas
  export const schemas = {
    task: z.object({
      title: z.string().min(3).max(100),
      description: z.string().min(10).max(5000),
      priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
      agentId: z.string().optional(),
      projectId: z.string().optional(),
      inputs: z.record(z.unknown()).optional(),
      dependencies: z.array(z.string()).optional(),
    }),

    project: z.object({
      name: z.string().min(3).max(100),
      description: z.string().max(1000).optional(),
      visibility: z.enum(['private', 'team', 'public']).default('private'),
      settings: z.record(z.unknown()).optional(),
    }),

    apiKey: z.object({
      name: z.string().min(3).max(50),
      expiresAt: z.string().datetime().optional(),
      scopes: z.array(z.string()).min(1),
    }),

    userUpdate: z.object({
      displayName: z.string().min(2).max(50).optional(),
      preferences: z.object({
        theme: z.enum(['light', 'dark', 'system']).optional(),
        notifications: z.boolean().optional(),
        defaultAgentSettings: z.record(z.unknown()).optional(),
      }).optional(),
    }),
  };

  // Validation middleware
  export function validateRequest(schema: z.ZodSchema) {
    return async (req: NextRequest) => {
      try {
        const body = await req.json();
        schema.parse(body);
        return { success: true };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            success: false,
            error: 'Validation failed',
            details: error.errors
          };
        }
        return { success: false, error: 'Failed to parse request body' };
      }
    };
  }
  ```

## Testing Strategy

### Unit Testing
```typescript
// Example test for agent runtime service
describe('AgentRuntimeService', () => {
  let service: AgentRuntimeService;
  let mockFirestore: jest.Mocked<typeof FirestoreService>;

  beforeEach(() => {
    mockFirestore = {
      logAudit: jest.fn(),
    } as any;

    service = AgentRuntimeService.getInstance(mockFirestore);
  });

  describe('createTask', () => {
    it('should create a task with the correct properties', async () => {
      // Arrange
      const userId = 'test-user-id';
      const taskData = {
        title: 'Test Task',
        description: 'This is a test task',
        type: 'test',
        priority: 'high' as const,
      };

      // Act
      const result = await service.createTask(userId, taskData);

      // Assert
      expect(result).toEqual(expect.objectContaining({
        userId,
        title: taskData.title,
        description: taskData.description,
        status: 'pending',
        priority: taskData.priority,
      }));
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should store the task in Firestore', async () => {
      // Arrange
      const userId = 'test-user-id';
      const taskData = {
        title: 'Test Task',
        description: 'This is a test task',
      };

      // Mock Firestore
      const mockSet = jest.fn();
      const mockCollection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          set: mockSet,
        }),
      });
      jest.spyOn(global, 'getFirestore').mockReturnValue({
        collection: mockCollection,
      } as any);

      // Act
      const result = await service.createTask(userId, taskData);

      // Assert
      expect(mockCollection).toHaveBeenCalledWith('agent_tasks');
      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
        userId,
        title: taskData.title,
        description: taskData.description,
      }));
    });
  });
});
```

### Integration Testing
```typescript
// Example integration test for API endpoint
describe('Agent API Integration Tests', () => {
  let app: any;
  let authToken: string;

  beforeAll(async () => {
    app = await startTestServer();
    authToken = await getTestAuthToken('test-user');
  });

  afterAll(async () => {
    await stopTestServer(app);
  });

  describe('GET /api/agents', () => {
    it('should return a list of available agents', async () => {
      // Arrange & Act
      const response = await request(app)
        .get('/api/agents')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.agents).toBeInstanceOf(Array);
      expect(response.body.data.agents.length).toBeGreaterThan(0);

      const agent = response.body.data.agents[0];
      expect(agent).toHaveProperty('id');
      expect(agent).toHaveProperty('name');
      expect(agent).toHaveProperty('status');
    });

    it('should require authentication', async () => {
      // Act
      const response = await request(app)
        .get('/api/agents');

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/agents', () => {
    it('should create and start a new task', async () => {
      // Arrange
      const taskData = {
        task: {
          description: 'Test task from integration test',
          priority: 'medium'
        }
      };

      // Act
      const response = await request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task).toBeDefined();
      expect(response.body.data.task.id).toBeDefined();

      // Verify task was created in database
      const taskId = response.body.data.task.id;
      const taskDoc = await firebase.firestore()
        .collection('agent_tasks')
        .doc(taskId)
        .get();

      expect(taskDoc.exists).toBe(true);
      expect(taskDoc.data()).toEqual(expect.objectContaining({
        description: taskData.task.description,
        status: 'pending',
      }));
    });
  });
});
```

## Deployment Architecture

### Current Architecture
- Simple Next.js application on Vercel
- Firebase for backend services

### Phase 2 Architecture
- **Multi-tier Deployment**
  ```
  ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
  │   Frontend    │       │  API Gateway  │       │   Backend     │
  │   (Vercel)    │─────▶ │  (Vercel/     │─────▶ │   Services    │
  │               │       │   Cloud Run)   │       │  (Cloud Run)  │
  └───────────────┘       └───────────────┘       └───────────────┘
          │                       │                       │
          │                       │                       │
          ▼                       ▼                       ▼
  ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
  │    CDN        │       │   Firestore   │       │   Pub/Sub     │
  │  (Cloudflare) │       │  (Firebase)   │       │   (GCP)       │
  └───────────────┘       └───────────────┘       └───────────────┘
                                  │                       │
                                  │                       │
                                  ▼                       ▼
                          ┌───────────────┐       ┌───────────────┐
                          │ Cloud Storage │       │  Cloud Tasks  │
                          │   (GCP)       │       │    (GCP)      │
                          └───────────────┘       └───────────────┘
  ```

## Performance Optimizations

- **Caching Layer**
  ```typescript
  // Cache service implementation
  export class CacheService {
    private cache: NodeCache;

    constructor(options?: NodeCacheOptions) {
      this.cache = new NodeCache({
        stdTTL: 300,
        checkperiod: 60,
        ...options
      });
    }

    async get<T>(key: string): Promise<T | undefined> {
      return this.cache.get<T>(key);
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
      return this.cache.set<T>(key, value, ttl);
    }

    async getOrSet<T>(
      key: string,
      factory: () => Promise<T>,
      ttl?: number
    ): Promise<T> {
      const cached = await this.get<T>(key);
      if (cached !== undefined) {
        return cached;
      }

      const value = await factory();
      await this.set(key, value, ttl);
      return value;
    }

    async invalidate(key: string): Promise<void> {
      this.cache.del(key);
    }

    async invalidatePattern(pattern: string): Promise<void> {
      const keys = this.cache.keys().filter(key => key.match(pattern));
      this.cache.del(keys);
    }
  }
  ```

- **Query Optimization**
  ```typescript
  // Optimized query methods
  export class OptimizedQueries {
    static async getUserDashboard(userId: string): Promise<DashboardData> {
      // Use a single batch query instead of multiple queries
      const db = getFirestore();
      const batch = db.batch();

      const userRef = db.collection('users').doc(userId);
      const tasksRef = db.collection('agent_tasks')
        .where('userId', '==', userId)
        .where('status', 'in', ['pending', 'in_progress'])
        .orderBy('createdAt', 'desc')
        .limit(10);
      const projectsRef = db.collection('projects')
        .where('userId', '==', userId)
        .limit(5);
      const usageRef = db.collection('usage')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(1);

      // Execute all queries in parallel
      const [userDoc, tasksDocs, projectsDocs, usageDocs] = await Promise.all([
        userRef.get(),
        tasksRef.get(),
        projectsRef.get(),
        usageRef.get()
      ]);

      // Process results
      return {
        user: userDoc.data(),
        activeTasks: tasksDocs.docs.map(doc => doc.data()),
        recentProjects: projectsDocs.docs.map(doc => doc.data()),
        usage: usageDocs.docs[0]?.data()
      };
    }
  }
  ```

## Conclusion

This technical implementation guide provides a roadmap for Phase 2 development of the AIDE platform. By following these architectural patterns and implementation strategies, the development team will be able to build on the solid foundation established in Milestone 1 and deliver a robust, scalable, and feature-rich platform for AI-driven development.

---

*Document Version: 1.0*
*Last Updated: June 5, 2024*
