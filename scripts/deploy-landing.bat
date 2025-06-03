@echo off
REM AIDE Landing Page Deployment Script for Windows
REM This script deploys the AIDE landing page to Vercel

echo 🚀 AIDE Landing Page Deployment
echo ================================

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Vercel CLI is not installed. Installing...
    npm install -g vercel
)

REM Check if we're logged into Vercel
vercel whoami >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 🔐 Please login to Vercel...
    vercel login
)

REM Build locally first to ensure everything works
echo 🔨 Building locally...
cd apps\aide-landing
npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Local build failed. Please fix the errors before deploying.
    exit /b 1
)

echo ✅ Local build successful!

REM Go back to project root
cd ..\..

REM Deploy to Vercel
echo 🌍 Deploying to Vercel...
vercel --prod

echo ✅ Deployment complete!
echo.
echo 📋 Next steps:
echo 1. Configure your custom domain in Vercel dashboard
echo 2. Set up real Stripe price IDs using scripts\setup-stripe.js
echo 3. Test the deployed application
echo 4. Update DNS records if using custom domain
