#!/bin/bash

# AIDE Vercel Environment Setup Script
# This script sets up all required environment variables for Vercel deployment

echo "🔧 Setting up Vercel Environment Variables for AIDE Landing Page"
echo "================================================================"

# Function to add environment variable
add_env_var() {
    local var_name=$1
    local var_value=$2
    echo "Setting $var_name..."
    echo "$var_value" | vercel env add "$var_name" production
}

echo "Setting up Stripe Configuration..."
add_env_var "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "pk_test_PLACEHOLDER_REPLACE_WITH_ACTUAL_KEY"

add_env_var "STRIPE_SECRET_KEY" "sk_test_PLACEHOLDER_REPLACE_WITH_ACTUAL_KEY"

echo "Setting up Price IDs (placeholder values)..."
add_env_var "NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID" "price_professional_monthly"

add_env_var "NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID" "price_enterprise_monthly"

echo "Setting up URLs..."
add_env_var "NEXT_PUBLIC_CONTROL_PANEL_URL" "https://aide-control.vercel.app"

add_env_var "NEXT_PUBLIC_SITE_URL" "https://aide.vercel.app"

add_env_var "NEXT_PUBLIC_BASE_URL" "https://aide.vercel.app"

echo "✅ Environment variables setup complete!"
echo "📋 Remember to update these with production values later:"
echo "   - Stripe keys (production keys)"
echo "   - Price IDs (real Stripe price IDs)"
echo "   - URLs (custom domain)"
echo ""
echo "🚀 Ready to deploy with: vercel --prod"
