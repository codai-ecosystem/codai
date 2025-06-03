# Deploying AIDE Control Panel to Google Cloud Run

This guide walks you through deploying the AIDE Control Panel to Google Cloud Run using the Docker container we've created.

## Prerequisites

1. [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed and configured
2. Docker installed on your development machine
3. A Firebase project with Authentication and Firestore enabled
4. A Stripe account (for billing features)
5. Google Cloud project with Cloud Run API enabled

## Environment Variables

Before deploying, you need to set up the following environment variables:

### Required Environment Variables

- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase web API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase app ID
- `FIREBASE_ADMIN_CREDENTIALS` - Base64-encoded Firebase service account key JSON
- `STRIPE_SECRET_KEY` - Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `NEXT_PUBLIC_API_URL` - URL where the API will be hosted (can be the same as the app URL)
- `NEXTAUTH_SECRET` - Secret for NextAuth.js
- `NEXTAUTH_URL` - URL of the application (where it will be hosted)

### Optional Environment Variables

- `OPENAI_API_KEY` - OpenAI API key (for managed mode)
- `AZURE_OPENAI_API_KEY` - Azure OpenAI API key (for managed mode)
- `AZURE_OPENAI_ENDPOINT` - Azure OpenAI endpoint (for managed mode)
- `ANTHROPIC_API_KEY` - Anthropic API key (for managed mode)
- `DEFAULT_SERVICE_MODE` - Default service mode (`managed` or `self-hosted`)

## Generate Firebase Admin Credentials

The Firebase Admin SDK credentials need to be encoded in base64 format:

1. Generate a Firebase Admin SDK private key from the Firebase Console:

   - Go to **Project Settings** > **Service Accounts** > **Generate new private key**
   - This will download a JSON file with your credentials

2. Encode this file to base64:

   ```bash
   # On macOS/Linux
   cat your-firebase-credentials.json | base64

   # On Windows PowerShell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("your-firebase-credentials.json"))
   ```

3. Use this base64-encoded string as the value for `FIREBASE_ADMIN_CREDENTIALS`

## Build and Deploy to Google Cloud Run

### 1. Build the Docker image

```bash
# Navigate to the aide-control directory
cd apps/aide-control

# Build the Docker image
docker build -t gcr.io/YOUR_GCP_PROJECT_ID/aide-control:latest .
```

### 2. Push the image to Google Container Registry

```bash
# Authenticate with GCP
gcloud auth configure-docker

# Push the image
docker push gcr.io/YOUR_GCP_PROJECT_ID/aide-control:latest
```

### 3. Deploy to Cloud Run

```bash
gcloud run deploy aide-control \
  --image gcr.io/YOUR_GCP_PROJECT_ID/aide-control:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --set-env-vars="NEXT_PUBLIC_FIREBASE_API_KEY=your_value,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_value" \
  --set-env-vars="NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_value,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_value" \
  --set-env-vars="NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_value,NEXT_PUBLIC_FIREBASE_APP_ID=your_value" \
  --set-env-vars="STRIPE_SECRET_KEY=your_value,NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_value" \
  --set-env-vars="STRIPE_WEBHOOK_SECRET=your_value,NEXTAUTH_SECRET=your_value" \
  --set-env-vars="NEXTAUTH_URL=https://your-cloud-run-url" \
  --set-env-vars="NEXT_PUBLIC_API_URL=https://your-cloud-run-url" \
  --set-env-vars-file=.env.secrets
```

**Note:** For sensitive environment variables like `FIREBASE_ADMIN_CREDENTIALS`, it's better to use a secrets file:

1. Create a file named `.env.secrets` with sensitive variables:

   ```
   FIREBASE_ADMIN_CREDENTIALS=your_base64_encoded_credentials
   ```

2. Include `--set-env-vars-file=.env.secrets` in your deploy command

### 4. Set up Stripe Webhooks

After deployment, set up a Stripe webhook pointing to `https://your-cloud-run-url/api/billing/webhook` with the following events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Firestore Structure

Ensure your Firestore database has the following collections:

- `users` - User information
- `billing_plans` - Available subscription plans
- `subscriptions` - User subscriptions
- `api_keys` - API keys for managed services

## Testing the Deployment

1. Visit your Cloud Run URL
2. Sign in with a Firebase-authenticated account
3. Test the admin functionality if applicable

## Monitoring and Logging

- View logs in Google Cloud Console under Cloud Run > aide-control > Logs
- Set up Cloud Monitoring alerts for any issues

## Troubleshooting

- **Firebase Auth issues**: Check that your Firebase project configurations match
- **Stripe webhook failures**: Verify webhook secrets and event configurations
- **Database access issues**: Check Firebase Admin credentials and permissions
