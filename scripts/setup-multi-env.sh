#!/bin/bash

# AIDE Landing Page - Multi-Environment Vercel Setup Script
# This script sets up production, preview, and development environments in Vercel

set -e

echo "🚀 Setting up multi-environment Vercel deployment for AIDE Landing Page"
echo "=============================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel@latest
else
    echo "✅ Vercel CLI found"
fi

# Link to Vercel project if not already linked
if [ ! -f ".vercel/project.json" ]; then
    echo "📡 Linking to Vercel project..."
    vercel link
else
    echo "✅ Already linked to Vercel project"
fi

# Function to setup environment variables for a specific environment
setup_environment() {
    local env_name=$1
    local env_prefix=$2

    echo ""
    echo "🔧 Setting up $env_name environment variables..."
    echo "Environment: $env_name"
    echo "Prefix: $env_prefix"

    # Stripe Configuration
    echo "Setting up Stripe configuration for $env_name..."
    vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY $env_name < /dev/null || echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY already exists for $env_name"
    vercel env add STRIPE_SECRET_KEY $env_name < /dev/null || echo "STRIPE_SECRET_KEY already exists for $env_name"

    # Stripe Price IDs
    vercel env add NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID $env_name < /dev/null || echo "NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID already exists for $env_name"
    vercel env add NEXT_PUBLIC_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID $env_name < /dev/null || echo "NEXT_PUBLIC_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID already exists for $env_name"
    vercel env add NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID $env_name < /dev/null || echo "NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID already exists for $env_name"
    vercel env add NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID $env_name < /dev/null || echo "NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID already exists for $env_name"

    # Application URLs
    if [ "$env_name" = "production" ]; then
        BASE_URL="https://aide.dev"
        CONTROL_PANEL_URL="https://app.aide.dev"
    elif [ "$env_name" = "preview" ]; then
        BASE_URL="https://preview.aide.dev"
        CONTROL_PANEL_URL="https://preview-app.aide.dev"
    else
        BASE_URL="https://dev.aide.dev"
        CONTROL_PANEL_URL="https://dev-app.aide.dev"
    fi

    echo "Setting BASE_URL to: $BASE_URL"
    echo "$BASE_URL" | vercel env add NEXT_PUBLIC_BASE_URL $env_name || echo "NEXT_PUBLIC_BASE_URL already exists for $env_name"
    echo "$BASE_URL" | vercel env add NEXT_PUBLIC_SITE_URL $env_name || echo "NEXT_PUBLIC_SITE_URL already exists for $env_name"
    echo "$CONTROL_PANEL_URL" | vercel env add NEXT_PUBLIC_CONTROL_PANEL_URL $env_name || echo "NEXT_PUBLIC_CONTROL_PANEL_URL already exists for $env_name"

    echo "✅ $env_name environment setup complete"
}

# Set up each environment
echo "Setting up Production environment..."
setup_environment "production" "prod"

echo "Setting up Preview environment..."
setup_environment "preview" "preview"

echo "Setting up Development environment..."
setup_environment "development" "dev"

echo ""
echo "🎉 Multi-environment setup complete!"
echo "=============================================================="
echo ""
echo "📋 Next Steps:"
echo "1. Update Stripe keys in each environment:"
echo "   - Production: Real Stripe keys"
echo "   - Preview: Test Stripe keys for staging"
echo "   - Development: Test Stripe keys for development"
echo ""
echo "2. Set up GitHub secrets for automatic deployment:"
echo "   - VERCEL_TOKEN"
echo "   - VERCEL_ORG_ID"
echo "   - VERCEL_PROJECT_ID"
echo ""
echo "3. Configure custom domains in Vercel dashboard:"
echo "   - Production: aide.dev"
echo "   - Preview: preview.aide.dev"
echo "   - Development: dev.aide.dev"
echo ""
echo "4. Create preview and dev branches:"
echo "   git checkout -b preview"
echo "   git push origin preview"
echo "   git checkout -b dev"
echo "   git push origin dev"
echo ""
echo "🚀 Your multi-environment deployment is ready!"
