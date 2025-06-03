# Firebase Integration for AIDE Control Panel

This document explains the Firebase integration for the AIDE Control Panel.

## Overview

The AIDE Control Panel uses Firebase for:

- User authentication
- Data storage (Firestore)
- Real-time updates
- Security rules

## Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable the following services:
   - Firebase Authentication
   - Firestore Database
   - Storage (if needed)

### 2. Create a Web App

1. In Firebase Console, go to "Project Settings"
2. Click "Add App" and select "Web"
3. Follow the instructions to register your app
4. Copy the Firebase configuration (apiKey, authDomain, etc.)

### 3. Set Up Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 4. Set Up Firebase Admin SDK

1. In Firebase Console, go to "Project Settings" > "Service Accounts"
2. Click "Generate new private key"
3. Download the JSON file
4. Encode the file to base64:

```bash
# On macOS/Linux
cat your-firebase-credentials.json | base64

# On Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("your-firebase-credentials.json"))
```

5. Add the base64-encoded string to your `.env.local` file:

```
FIREBASE_ADMIN_CREDENTIALS=your-base64-encoded-string
```

## Firestore Data Structure

### Collections

1. **`users`** - User information

```typescript
interface User {
	uid: string; // Firebase Auth UID
	email: string; // User email
	displayName?: string; // User display name
	role: 'user' | 'admin'; // User role
	stripeCustomerId?: string; // Stripe customer ID
	createdAt: Timestamp; // Account creation timestamp
	updatedAt: Timestamp; // Last update timestamp
}
```

2. **`billing_plans`** - Available subscription plans

```typescript
interface BillingPlan {
	id: string; // Plan ID
	name: string; // Plan name
	description: string; // Plan description
	price: number; // Price in cents
	interval: 'month' | 'year'; // Billing interval
	features: string[]; // List of features
	stripePriceId: string; // Stripe price ID
	active: boolean; // Whether the plan is active
}
```

3. **`subscriptions`** - User subscriptions

```typescript
interface Subscription {
	id: string; // Subscription ID
	userId: string; // User ID
	planId: string; // Plan ID
	stripeSubscriptionId: string; // Stripe subscription ID
	status: 'active' | 'canceled' | 'past_due'; // Subscription status
	currentPeriodEnd: Timestamp; // End of current billing period
	createdAt: Timestamp; // Subscription creation timestamp
	cancelAtPeriodEnd: boolean; // Whether to cancel at period end
}
```

4. **`api_keys`** - API keys for services

```typescript
interface ApiKey {
	id: string; // API key ID
	userId: string; // User ID
	service: string; // Service name (e.g., 'openai', 'anthropic')
	key: string; // Encrypted API key
	name: string; // Key name
	createdAt: Timestamp; // Key creation timestamp
	lastUsed?: Timestamp; // Last usage timestamp
}
```

5. **`service_configs`** - Service configurations

```typescript
interface ServiceConfig {
	id: string; // Config ID
	userId: string; // User ID
	service: string; // Service name
	config: any; // Service-specific configuration
	createdAt: Timestamp; // Config creation timestamp
	updatedAt: Timestamp; // Last update timestamp
}
```

## Security Rules

Here are the recommended Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User can read and write their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Only admins can read all users
    match /users/{userId} {
      allow read: if request.auth != null &&
                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Users can read available plans
    match /billing_plans/{planId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Users can read their own subscriptions
    match /subscriptions/{subscriptionId} {
      allow read: if request.auth != null &&
                    resource.data.userId == request.auth.uid;
    }

    // Users can read and write their own API keys
    match /api_keys/{keyId} {
      allow read, write: if request.auth != null &&
                           resource.data.userId == request.auth.uid;
    }

    // Users can read and write their own service configs
    match /service_configs/{configId} {
      allow read, write: if request.auth != null &&
                           resource.data.userId == request.auth.uid;
    }
  }
}
```

## Firebase Functions

For certain operations, you might need to create Firebase Cloud Functions:

1. **Stripe webhook handler** - Process Stripe events
2. **User creation hook** - Set up new user data
3. **Usage tracking** - Log API usage for billing

## Implementation Details

### Client-side Firebase

The project uses client-side Firebase for authentication and real-time updates:

```typescript
// lib/firebase-client.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
```

### Server-side Firebase Admin

For server-side operations, we use Firebase Admin SDK:

```typescript
// lib/firebase.ts
import { getAdminApp } from './firebase-admin';
import { getFirestoreDb } from './server/firebase-utils';

// Example function to get user data
async function getUserData(uid: string) {
	const db = getFirestoreDb();
	const userDoc = await db.collection('users').doc(uid).get();
	return userDoc.exists ? userDoc.data() : null;
}
```

## Best Practices

1. **Security** - Never expose Firebase Admin credentials in client code
2. **Data Validation** - Use Firestore security rules and server-side validation
3. **Error Handling** - Properly handle Firebase operation errors
4. **Caching** - Use client-side caching for frequently accessed data
5. **Batching** - Use batch operations for multiple writes
6. **Transactions** - Use transactions for operations that need atomicity
