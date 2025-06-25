# AIDE Control Production Setup Guide

## Environment Variables

Create a `.env.local` file in the `apps/aide-control` directory with the following variables:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-private-key-content\n-----END PRIVATE KEY-----"

# Database URLs
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Stripe Configuration (for billing)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Next.js Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret

# Admin Configuration
ADMIN_EMAILS=admin1@yourcompany.com,admin2@yourcompany.com
```

## Firebase Setup

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Enable Authentication with Email/Password
4. Create a service account:
   - Go to Project Settings > Service Accounts
   - Generate a new private key
   - Download the JSON file
   - Extract the required fields for environment variables

## Firestore Database Structure

The application expects the following collections:

### `users` collection

```javascript
{
  uid: string,
  email: string,
  isAdmin: boolean,
  createdAt: timestamp,
  lastLoginAt: timestamp,
  profile: {
    name: string,
    company: string
  }
}
```

### `serviceConfigurations` collection

```javascript
{
  id: string,
  userId: string,
  mode: 'managed' | 'self-managed',
  serviceType: 'llm' | 'embedding',
  providerId: string,
  model?: string,
  apiKey?: string, // encrypted
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp,
  settings: {
    temperature?: number,
    maxTokens?: number,
    // other provider-specific settings
  }
}
```

### `usageStats` collection

```javascript
{
  id: string,
  userId: string,
  configId: string,
  date: string, // YYYY-MM-DD format
  requestCount: number,
  tokenCount: number,
  cost: number,
  timestamp: timestamp
}
```

## Stripe Integration

1. Create a Stripe account
2. Set up products and pricing plans
3. Configure webhooks to handle:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## Security Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Service configurations - users can manage their own
    match /serviceConfigurations/{configId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.userId ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }

    // Usage stats - read-only for users, read-write for admins
    match /usageStats/{statId} {
      allow read: if request.auth != null &&
        (request.auth.uid == resource.data.userId ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Set build command: `cd apps/aide-control && npm run build`
4. Set output directory: `apps/aide-control/.next`

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/aide-control/package*.json ./apps/aide-control/

# Install dependencies
RUN npm install

# Copy source code
COPY apps/aide-control ./apps/aide-control

# Build application
WORKDIR /app/apps/aide-control
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## Monitoring

Consider setting up:

- Firebase Performance Monitoring
- Sentry for error tracking
- Google Analytics for usage insights
- Uptime monitoring (Pingdom, UptimeRobot)

## Admin Access

Admin users are identified by:

1. Email address listed in `ADMIN_EMAILS` environment variable
2. `isAdmin: true` field in their Firestore user document

Initial admin setup:

1. Create account through normal registration
2. Manually set `isAdmin: true` in Firestore
3. Add email to `ADMIN_EMAILS` environment variable
