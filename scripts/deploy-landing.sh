#!/bin/bash

# AIDE Landing Page Deployment Script
# This script deploys the AIDE landing page to Vercel

set -e

echo "🚀 AIDE Landing Page Deployment"
echo "================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Check if we're logged into Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

# Build locally first to ensure everything works
echo "🔨 Building locally..."
cd apps/aide-landing
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Local build failed. Please fix the errors before deploying."
    exit 1
fi

echo "✅ Local build successful!"

# Go back to project root
cd ../..

# Deploy to Vercel
echo "🌍 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your custom domain in Vercel dashboard"
echo "2. Set up real Stripe price IDs using scripts/setup-stripe.js"
echo "3. Test the deployed application"
echo "4. Update DNS records if using custom domain"
