# AIDE Landing Page - Multi-Environment Vercel Setup Script
# This script sets up production, preview, and development environments in Vercel

$ErrorActionPreference = "Stop"

Write-Host "🚀 Setting up multi-environment Vercel deployment for AIDE Landing Page" -ForegroundColor Green
Write-Host "==============================================================" -ForegroundColor Green

# Check if Vercel CLI is installed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel@latest
} else {
    Write-Host "✅ Vercel CLI found" -ForegroundColor Green
}

# Link to Vercel project if not already linked
if (-not (Test-Path ".vercel/project.json")) {
    Write-Host "📡 Linking to Vercel project..." -ForegroundColor Yellow
    vercel link
} else {
    Write-Host "✅ Already linked to Vercel project" -ForegroundColor Green
}

# Function to setup environment variables for a specific environment
function Set-EnvironmentVariables {
    param(
        [string]$EnvName,
        [string]$EnvPrefix
    )

    Write-Host ""
    Write-Host "🔧 Setting up $EnvName environment variables..." -ForegroundColor Cyan
    Write-Host "Environment: $EnvName" -ForegroundColor White
    Write-Host "Prefix: $EnvPrefix" -ForegroundColor White

    # Stripe Configuration
    Write-Host "Setting up Stripe configuration for $EnvName..." -ForegroundColor Yellow

    try { vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY $EnvName 2>$null } catch { Write-Host "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY already exists for $EnvName" -ForegroundColor Yellow }
    try { vercel env add STRIPE_SECRET_KEY $EnvName 2>$null } catch { Write-Host "STRIPE_SECRET_KEY already exists for $EnvName" -ForegroundColor Yellow }

    # Stripe Price IDs
    try { vercel env add NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID $EnvName 2>$null } catch { Write-Host "NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID already exists for $EnvName" -ForegroundColor Yellow }
    try { vercel env add NEXT_PUBLIC_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID $EnvName 2>$null } catch { Write-Host "NEXT_PUBLIC_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID already exists for $EnvName" -ForegroundColor Yellow }
    try { vercel env add NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID $EnvName 2>$null } catch { Write-Host "NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID already exists for $EnvName" -ForegroundColor Yellow }
    try { vercel env add NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID $EnvName 2>$null } catch { Write-Host "NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID already exists for $EnvName" -ForegroundColor Yellow }

    # Application URLs
    switch ($EnvName) {
        "production" {
            $BaseUrl = "https://aide.dev"
            $ControlPanelUrl = "https://app.aide.dev"
        }
        "preview" {
            $BaseUrl = "https://preview.aide.dev"
            $ControlPanelUrl = "https://preview-app.aide.dev"
        }
        default {
            $BaseUrl = "https://dev.aide.dev"
            $ControlPanelUrl = "https://dev-app.aide.dev"
        }
    }

    Write-Host "Setting BASE_URL to: $BaseUrl" -ForegroundColor White
    try { Write-Output $BaseUrl | vercel env add NEXT_PUBLIC_BASE_URL $EnvName 2>$null } catch { Write-Host "NEXT_PUBLIC_BASE_URL already exists for $EnvName" -ForegroundColor Yellow }
    try { Write-Output $BaseUrl | vercel env add NEXT_PUBLIC_SITE_URL $EnvName 2>$null } catch { Write-Host "NEXT_PUBLIC_SITE_URL already exists for $EnvName" -ForegroundColor Yellow }
    try { Write-Output $ControlPanelUrl | vercel env add NEXT_PUBLIC_CONTROL_PANEL_URL $EnvName 2>$null } catch { Write-Host "NEXT_PUBLIC_CONTROL_PANEL_URL already exists for $EnvName" -ForegroundColor Yellow }

    Write-Host "✅ $EnvName environment setup complete" -ForegroundColor Green
}

# Set up each environment
Write-Host "Setting up Production environment..." -ForegroundColor Cyan
Set-EnvironmentVariables -EnvName "production" -EnvPrefix "prod"

Write-Host "Setting up Preview environment..." -ForegroundColor Cyan
Set-EnvironmentVariables -EnvName "preview" -EnvPrefix "preview"

Write-Host "Setting up Development environment..." -ForegroundColor Cyan
Set-EnvironmentVariables -EnvName "development" -EnvPrefix "dev"

Write-Host ""
Write-Host "🎉 Multi-environment setup complete!" -ForegroundColor Green
Write-Host "==============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update Stripe keys in each environment:" -ForegroundColor White
Write-Host "   - Production: Real Stripe keys" -ForegroundColor White
Write-Host "   - Preview: Test Stripe keys for staging" -ForegroundColor White
Write-Host "   - Development: Test Stripe keys for development" -ForegroundColor White
Write-Host ""
Write-Host "2. Set up GitHub secrets for automatic deployment:" -ForegroundColor White
Write-Host "   - VERCEL_TOKEN" -ForegroundColor White
Write-Host "   - VERCEL_ORG_ID" -ForegroundColor White
Write-Host "   - VERCEL_PROJECT_ID" -ForegroundColor White
Write-Host ""
Write-Host "3. Configure custom domains in Vercel dashboard:" -ForegroundColor White
Write-Host "   - Production: aide.dev" -ForegroundColor White
Write-Host "   - Preview: preview.aide.dev" -ForegroundColor White
Write-Host "   - Development: dev.aide.dev" -ForegroundColor White
Write-Host ""
Write-Host "4. Create preview and dev branches:" -ForegroundColor White
Write-Host "   git checkout -b preview" -ForegroundColor Gray
Write-Host "   git push origin preview" -ForegroundColor Gray
Write-Host "   git checkout -b dev" -ForegroundColor Gray
Write-Host "   git push origin dev" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Your multi-environment deployment is ready!" -ForegroundColor Green
