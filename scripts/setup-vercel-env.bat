@echo off
REM AIDE Vercel Environment Setup Script
REM This script sets up all required environment variables for Vercel deployment

echo 🔧 Setting up Vercel Environment Variables for AIDE Landing Page
echo ================================================================

echo Setting up Stripe Configuration...
echo NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production - <<< "pk_test_PLACEHOLDER_REPLACE_WITH_ACTUAL_KEY"

echo STRIPE_SECRET_KEY | vercel env add STRIPE_SECRET_KEY production - <<< "sk_test_PLACEHOLDER_REPLACE_WITH_ACTUAL_KEY"

echo Setting up Price IDs (placeholder values)...
echo NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID | vercel env add NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID production - <<< "price_professional_monthly"

echo NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID | vercel env add NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID production - <<< "price_enterprise_monthly"

echo Setting up URLs...
echo NEXT_PUBLIC_CONTROL_PANEL_URL | vercel env add NEXT_PUBLIC_CONTROL_PANEL_URL production - <<< "https://aide-control.vercel.app"

echo NEXT_PUBLIC_SITE_URL | vercel env add NEXT_PUBLIC_SITE_URL production - <<< "https://aide.vercel.app"

echo NEXT_PUBLIC_BASE_URL | vercel env add NEXT_PUBLIC_BASE_URL production - <<< "https://aide.vercel.app"

echo ✅ Environment variables setup complete!
echo 📋 Remember to update these with production values later:
echo    - Stripe keys (production keys)
echo    - Price IDs (real Stripe price IDs)
echo    - URLs (custom domain)
echo.
echo 🚀 Ready to deploy with: vercel --prod
