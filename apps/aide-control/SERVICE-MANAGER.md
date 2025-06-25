# AIDE Service Manager Implementation

## Overview

The **ServiceManager** is a core component of the AIDE dual-mode infrastructure system that coordinates AI services for users. It supports both **managed** (platform-hosted) and **self-managed** (user API keys) service modes.

## Features

### ✅ Completed Features

1. **Service Management**
   - LLM service management (OpenAI, Azure OpenAI, Anthropic)
   - Embedding service management (OpenAI, Azure OpenAI)
   - In-memory service caching with Maps
   - Singleton pattern for global access

2. **User Configuration Management**
   - Create, update, and delete user service configurations
   - Support for multiple providers per service type
   - Configuration validation and error handling

3. **Usage Tracking**
   - Record service usage for billing and analytics
   - Firestore integration for persistent storage
   - Usage increment tracking per user

4. **API Endpoints**
   - `/api/services/user` - User service configuration management
   - `/api/services/health` - Service manager health check
   - `/api/services/usage` - Usage recording

## Architecture

```
ServiceManager (Singleton)
├── LLM Services (Map<string, LLMService>)
├── Embedding Services (Map<string, EmbeddingService>)
├── Firebase Admin Integration
└── Usage Recording & Analytics
```

## Usage

### Initialize Services for a User

```typescript
import { serviceManager } from '@/lib/services/service-manager';

// Initialize all configured services for a user
await serviceManager.initializeUserServices('user-123');
```

### Get Services

```typescript
// Get LLM service
const llmService = serviceManager.getLLMService('user-123', 'openai');

// Get embedding service
const embeddingService = serviceManager.getEmbeddingService('user-123', 'openai');
```

### Update Service Configuration

```typescript
const config: ServiceConfig = {
	mode: 'self-managed',
	providerId: 'openai',
	serviceType: 'llm',
	apiKey: 'sk-...',
	additionalConfig: {
		model: 'gpt-4',
		maxTokens: 4096,
	},
};

await serviceManager.updateServiceConfig('user-123', 'llm', config);
```

### Record Usage

```typescript
await serviceManager.recordUsage('user-123', {
	serviceType: 'llm',
	providerId: 'openai',
	requestDetails: {
		endpoint: '/chat/completions',
		inputTokens: 100,
		outputTokens: 200,
		model: 'gpt-4',
	},
	cost: 0.002,
	timestamp: new Date(),
});
```

## API Endpoints

### User Service Management

#### GET `/api/services/user`

Get user's service configurations.

**Headers:**

```
Authorization: Bearer <firebase-token>
```

**Response:**

```json
{
  "serviceConfigs": {
    "llm": [...],
    "embedding": [...]
  }
}
```

#### POST `/api/services/user`

Update user's service configuration.

**Headers:**

```
Authorization: Bearer <firebase-token>
Content-Type: application/json
```

**Body:**

```json
{
	"serviceType": "llm",
	"config": {
		"mode": "self-managed",
		"providerId": "openai",
		"serviceType": "llm",
		"apiKey": "sk-...",
		"additionalConfig": {
			"model": "gpt-4"
		}
	}
}
```

#### DELETE `/api/services/user`

Remove user's service configuration.

**Headers:**

```
Authorization: Bearer <firebase-token>
```

**Query Parameters:**

- `serviceType`: "llm" | "embedding"
- `providerId`: Provider ID to remove

### Health Check

#### GET `/api/services/health`

Service manager health check (admin only).

**Headers:**

```
Authorization: Bearer <firebase-admin-token>
```

**Response:**

```json
{
	"status": "healthy",
	"services": {
		"llm": 5,
		"embedding": 3
	},
	"timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Usage Recording

#### POST `/api/services/usage`

Record service usage.

**Headers:**

```
Authorization: Bearer <firebase-token>
Content-Type: application/json
```

**Body:**

```json
{
	"serviceType": "llm",
	"providerId": "openai",
	"requestDetails": {
		"endpoint": "/chat/completions",
		"inputTokens": 100,
		"outputTokens": 200,
		"model": "gpt-4"
	},
	"cost": 0.002
}
```

## Dependencies

### Required

- `firebase` - Client-side Firebase SDK
- `firebase-admin` - Server-side Firebase Admin SDK
- `next` - Next.js framework

### Installation

```bash
# Add firebase-admin to package.json
npm install firebase-admin@^12.0.0

# Or with pnpm
pnpm add firebase-admin@^12.0.0
```

## Environment Variables

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Firebase Admin (Base64 encoded service account JSON)
FIREBASE_ADMIN_CREDENTIALS=base64-encoded-service-account-json
```

## Testing

Run the test file to verify ServiceManager functionality:

```bash
npx tsx test-service-manager.ts
```

## File Structure

```
apps/aide-control/
├── lib/
│   ├── services/
│   │   ├── service-manager.ts      # ✅ Main ServiceManager implementation
│   │   ├── llm-service.ts          # ✅ LLM service implementations
│   │   └── embedding-service.ts    # ✅ Embedding service implementations
│   ├── types.ts                    # ✅ Type definitions
│   └── firebase.ts                 # ✅ Firebase configuration
├── app/api/services/
│   ├── user/route.ts              # ✅ User service management API
│   ├── health/route.ts            # ✅ Health check API
│   └── usage/route.ts             # ✅ Usage recording API
└── test-service-manager.ts        # ✅ Basic functionality test
```

## Error Handling

The ServiceManager includes comprehensive error handling:

- **Firebase connectivity issues**: Graceful fallbacks and informative error messages
- **Service initialization failures**: Detailed logging and error propagation
- **Invalid configurations**: Validation and user-friendly error responses
- **Authentication errors**: Proper HTTP status codes and error messages

## Next Steps

1. **Install firebase-admin dependency** in production environment
2. **Set up Firebase Admin credentials** via environment variables
3. **Test full Firebase integration** with real database
4. **Add monitoring and alerting** for service health
5. **Implement rate limiting** for API endpoints
6. **Add caching layer** for frequently accessed configurations

## Performance Considerations

- **In-memory caching**: Services are cached in Maps for fast access
- **Lazy initialization**: Services are only created when needed
- **Singleton pattern**: Single ServiceManager instance across the application
- **Efficient cleanup**: Memory cleanup when users sign out

## Security

- **Authentication required**: All endpoints require valid Firebase tokens
- **Admin-only endpoints**: Health check requires admin privileges
- **API key encryption**: Store API keys securely (implement encryption)
- **Rate limiting**: Implement rate limiting for production use
