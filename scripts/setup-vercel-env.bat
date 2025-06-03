@echo off
REM AIDE Vercel Environment Setup Script
REM This script sets up all required environment variables for Vercel deployment

echo 🔧 Setting up Vercel Environment Variables for AIDE Landing Page
echo ================================================================

echo Setting up Stripe Configuration...
echo NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production - <<< "pk_test_51Hq9X2KpV1ZMxPLJ0bV2WkV2C3X6s7T8uP9Q0qR1S2t3U4v5W6x7Y8z9A0b1C2d3E4f5G6h7I8j9K0l1M2n3O4p5Q6r"

echo STRIPE_SECRET_KEY | vercel env add STRIPE_SECRET_KEY production - <<< "sk_test_51Hq9X2KpV1ZMxPLJ0bV2WkV2C3X6s7T8uP9Q0qR1S2t3U4v5W6x7Y8z9A0b1C2d3E4f5G6h7I8j9K0l1M2n3O4p5Q6r"

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
