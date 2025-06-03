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
add_env_var "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "pk_test_51Hq9X2KpV1ZMxPLJ0bV2WkV2C3X6s7T8uP9Q0qR1S2t3U4v5W6x7Y8z9A0b1C2d3E4f5G6h7I8j9K0l1M2n3O4p5Q6r"

add_env_var "STRIPE_SECRET_KEY" "sk_test_51Hq9X2KpV1ZMxPLJ0bV2WkV2C3X6s7T8uP9Q0qR1S2t3U4v5W6x7Y8z9A0b1C2d3E4f5G6h7I8j9K0l1M2n3O4p5Q6r"

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
