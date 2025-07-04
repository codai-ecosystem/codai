# AIDE Vercel Environment Setup Script (PowerShell)
# This script sets up all required environment variables for Vercel deployment

Write-Host "🔧 Setting up Vercel Environment Variables for AIDE Landing Page" -ForegroundColor Blue
Write-Host "================================================================" -ForegroundColor Blue

function Add-VercelEnvVar {
    param(
        [string]$VarName,
        [string]$VarValue
    )

    Write-Host "Setting $VarName..." -ForegroundColor Yellow

    # Use here-string to pass the value to vercel
    $VarValue | vercel env add $VarName production

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $VarName set successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to set $VarName" -ForegroundColor Red
    }
}

Write-Host "`nSetting up Stripe Configuration..." -ForegroundColor Cyan
Add-VercelEnvVar "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "pk_test_PLACEHOLDER_REPLACE_WITH_ACTUAL_KEY"

Add-VercelEnvVar "STRIPE_SECRET_KEY" "sk_test_PLACEHOLDER_REPLACE_WITH_ACTUAL_KEY"

Write-Host "`nSetting up Price IDs (placeholder values)..." -ForegroundColor Cyan
Add-VercelEnvVar "NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID" "price_professional_monthly"

Add-VercelEnvVar "NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID" "price_enterprise_monthly"

Write-Host "`nSetting up URLs..." -ForegroundColor Cyan
Add-VercelEnvVar "NEXT_PUBLIC_CONTROL_PANEL_URL" "https://aide-control.vercel.app"

Add-VercelEnvVar "NEXT_PUBLIC_SITE_URL" "https://aide.vercel.app"

Add-VercelEnvVar "NEXT_PUBLIC_BASE_URL" "https://aide.vercel.app"

Write-Host "`n✅ Environment variables setup complete!" -ForegroundColor Green
Write-Host "📋 Remember to update these with production values later:" -ForegroundColor Yellow
Write-Host "   - Stripe keys (production keys)" -ForegroundColor Yellow
Write-Host "   - Price IDs (real Stripe price IDs)" -ForegroundColor Yellow
Write-Host "   - URLs (custom domain)" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Ready to deploy with: vercel --prod" -ForegroundColor Blue
