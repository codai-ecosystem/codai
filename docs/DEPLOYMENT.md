# AIDE Landing Page Deployment Guide

## 🚀 Quick Multi-Environment Setup

For a complete multi-environment deployment (production, preview, development), see [MULTI_ENVIRONMENT_DEPLOYMENT.md](./MULTI_ENVIRONMENT_DEPLOYMENT.md).

**Quick setup commands:**

**Windows:**

```powershell
.\scripts\setup-multi-env.ps1
.\scripts\setup-github-secrets.ps1
```

**Linux/macOS:**

```bash
./scripts/setup-multi-env.sh
./scripts/setup-github-secrets.sh
```

## 📋 Manual Single Environment Setup

### Prerequisites

1. **Vercel CLI**: Install if not already installed

   ```bash
   npm install -g vercel
   ```

2. **Stripe Account**: Set up Stripe with real price IDs
3. **Domain**: Configure aide.dev domain (optional)

### Deployment Steps

#### 1. Login to Vercel

```bash
vercel login
```

#### 2. Link Project

```bash
vercel link
```

#### 3. Configure Environment Variables

Set up the following environment variables in Vercel dashboard or via CLI:

```bash
# Production Stripe Keys (replace with real keys)
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
vercel env add STRIPE_SECRET_KEY production

# Stripe Price IDs
vercel env add NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID production
vercel env add NEXT_PUBLIC_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID production
vercel env add NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID production
vercel env add NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID production

# URLs
vercel env add NEXT_PUBLIC_CONTROL_PANEL_URL production
vercel env add NEXT_PUBLIC_SITE_URL production
vercel env add NEXT_PUBLIC_BASE_URL production
```

#### 4. Deploy

```bash
# From project root
vercel --prod
```

## 🔧 Environment Variables Required

### Stripe Configuration

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID`: Professional plan monthly price ID
- `NEXT_PUBLIC_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID`: Professional plan yearly price ID
- `NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID`: Enterprise plan monthly price ID
- `NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID`: Enterprise plan yearly price ID

### URLs

- `NEXT_PUBLIC_CONTROL_PANEL_URL`: URL of deployed aide-control app
- `NEXT_PUBLIC_SITE_URL`: Your production site URL
- `NEXT_PUBLIC_BASE_URL`: Base URL for metadata (same as site URL)

## Post-Deployment

1. **Test Stripe Integration**: Verify checkout flows work
2. **Configure Custom Domain**: Point aide.dev to Vercel
3. **Set up Analytics**: Add Google Analytics ID if desired
4. **SSL Certificate**: Automatically handled by Vercel

## Stripe Price IDs

You'll need to create products in Stripe and update the price IDs in:

- `apps/aide-landing/components/sections/pricing-section.tsx`

Current placeholder IDs need to be replaced with real ones:

- Professional Plan: `price_professional_monthly`
- Enterprise Plan: `price_enterprise_monthly`
