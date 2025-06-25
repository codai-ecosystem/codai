# AIDE Cloud Infrastructure Setup Guide

This document provides step-by-step setup instructions for integrating Microsoft Azure, Google Cloud Platform (GCP), and Stripe with your AIDE platform.

---

## ✅ MICROSOFT AZURE CONFIGURATION

### 1. Azure Subscription

- Ensure access to a paid Azure subscription.

### 2. Azure OpenAI Setup

- Create an Azure OpenAI resource in a supported region.
- Deploy models (`gpt-4`, `gpt-35-turbo`, etc.).
- Retrieve `resource name`, `deployment name`, `endpoint`, and `API key`.

#### Env Variables

```env
AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com/
AZURE_OPENAI_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT=gpt-4
```

### 3. Azure Entra ID App Registration

- Register a new app in Entra ID.
- Save `Client ID`, `Tenant ID`, and generate a `Client Secret`.
- Assign Microsoft Graph API permissions.

#### Env Variables

```env
AZURE_TENANT_ID=
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
```

### 4. Link to GitHub Enterprise Cloud

- Configure SAML + SCIM in GitHub Enterprise settings and Azure Entra.

### 5. (Optional) Azure Blob Storage

- For file uploads and caching, use Azure Blob Storage.

---

## ✅ GOOGLE CLOUD PLATFORM (GCP) CONFIGURATION

### 1. Create GCP Project

- Use the GCP Console to create a new project.

### 2. Enable Required APIs

- Cloud Run, Cloud Build, IAM, Firestore, Firebase Management, Artifact Registry.

### 3. Service Account Creation

- Create a `aide-deployer` service account.
- Assign roles: Cloud Run Admin, Cloud Build Editor, etc.
- Download JSON key.

#### Env Variables

```env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GCP_PROJECT_ID=your-project-id
```

### 4. Cloud Run Setup

- Create a service.
- Allow unauthenticated access.
- Use Artifact Registry or GCR for container images.

### 5. Firebase Setup (Optional)

- Create Firebase project and enable necessary services.

### 6. Billing

- Link a billing account to your project.

---

## ✅ STRIPE CONFIGURATION

### 1. Stripe Account

- Create a Stripe Business account.

### 2. Enable Stripe Connect

- Enable Express or Standard accounts.
- Set up platform fee settings.

### 3. API Keys

- Go to Developers > API keys.
- Retrieve secret key for backend.

### 4. Webhook Setup

- Create endpoint `/api/webhook/stripe` for events like `checkout.session.completed`.

### 5. Connect Branding (Optional)

- Customize hosted onboarding flows.

#### Env Variables

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## 🔐 Centralized Backend Environment Configuration

Example `.env` config:

```env
# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GCP_PROJECT_ID=

# Azure
AZURE_TENANT_ID=
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_KEY=
AZURE_OPENAI_DEPLOYMENT=
```

---

## 🧠 What AIDE Can Do With This Setup

- Use Azure OpenAI to call GPT-4 securely.
- Deploy apps via Cloud Run using GCP build tools.
- Provision GitHub repos via GitHub App and Entra integration.
- Assign Copilot Chat licenses.
- Handle user payments with Stripe Connect.
- Log activity and configurations through Firestore.

---
