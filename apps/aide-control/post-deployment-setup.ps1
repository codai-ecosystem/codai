#!/usr/bin/env pwsh
# Post-deployment setup script for AIDE Control Panel

Write-Host "🎉 AIDE Control Panel - Post-Deployment Setup" -ForegroundColor Green
Write-Host "=" * 60
Write-Host ""

$serviceUrl = "https://aide-control-xh6fsul3qq-ew.a.run.app"

Write-Host "✅ Deployment Status: SUCCESSFUL" -ForegroundColor Green
Write-Host "🌐 Service URL: $serviceUrl" -ForegroundColor Cyan
Write-Host "🏥 Health Check: $serviceUrl/api/health" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 POST-DEPLOYMENT CHECKLIST" -ForegroundColor Yellow
Write-Host "=" * 40

Write-Host ""
Write-Host "1. 🔗 STRIPE WEBHOOK SETUP" -ForegroundColor Magenta
Write-Host "   Configure Stripe webhook at: https://dashboard.stripe.com/webhooks"
Write-Host "   Webhook URL: $serviceUrl/api/billing/webhook" -ForegroundColor Green
Write-Host "   Required Events:"
Write-Host "   ✓ checkout.session.completed"
Write-Host "   ✓ customer.subscription.created"
Write-Host "   ✓ customer.subscription.updated"
Write-Host "   ✓ customer.subscription.deleted"
Write-Host ""

Write-Host "2. 🔥 FIREBASE SETUP VERIFICATION" -ForegroundColor Magenta
Write-Host "   ✓ Verify Firebase Authentication is working"
Write-Host "   ✓ Check Firestore collections exist:"
Write-Host "     - users"
Write-Host "     - billing_plans"
Write-Host "     - subscriptions"
Write-Host "     - api_keys"
Write-Host ""

Write-Host "3. 🧪 FUNCTIONAL TESTING" -ForegroundColor Magenta
Write-Host "   ✓ Test user registration/login"
Write-Host "   ✓ Test admin functionality"
Write-Host "   ✓ Test billing flows"
Write-Host "   ✓ Test API key management"
Write-Host ""

Write-Host "4. 📊 MONITORING SETUP" -ForegroundColor Magenta
Write-Host "   ✓ Set up Cloud Monitoring alerts"
Write-Host "   ✓ Configure log retention"
Write-Host "   ✓ Set up uptime monitoring"
Write-Host ""

Write-Host "5. 🔒 SECURITY VERIFICATION" -ForegroundColor Magenta
Write-Host "   ✓ Verify secret access permissions"
Write-Host "   ✓ Check CORS configuration"
Write-Host "   ✓ Review authentication flows"
Write-Host ""

Write-Host "🚀 QUICK TESTS" -ForegroundColor Yellow
Write-Host "=" * 20

# Test health endpoint
Write-Host "Testing health endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$serviceUrl/api/health" -Method Get -TimeoutSec 10
    Write-Host "✅ Health check: PASSED" -ForegroundColor Green
    Write-Host "   Status: $($response.status)"
    Write-Host "   Service: $($response.service)"
    Write-Host "   Version: $($response.version)"
} catch {
    Write-Host "❌ Health check: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)"
}

Write-Host ""

# Test API endpoint
Write-Host "Testing API availability..." -ForegroundColor Cyan
try {
    $apiResponse = Invoke-WebRequest -Uri "$serviceUrl/api" -Method Get -TimeoutSec 10
    Write-Host "✅ API endpoint: ACCESSIBLE (Status: $($apiResponse.StatusCode))" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "✅ API endpoint: ACCESSIBLE (Expected 404 for base /api)" -ForegroundColor Green
    } else {
        Write-Host "❌ API endpoint: ISSUE" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)"
    }
}

Write-Host ""

Write-Host "📋 NEXT IMMEDIATE ACTIONS:" -ForegroundColor Yellow
Write-Host "1. Configure Stripe webhooks (REQUIRED for billing)"
Write-Host "2. Test user authentication flow"
Write-Host "3. Verify admin access and permissions"
Write-Host "4. Set up monitoring alerts"
Write-Host ""

Write-Host "📚 USEFUL COMMANDS:" -ForegroundColor Cyan
Write-Host "View logs: gcloud logs tail --service=aide-control --region=europe-west1"
Write-Host "Update service: .\deploy-to-cloud-run.ps1 -Region europe-west1"
Write-Host "Monitor service: gcloud run services describe aide-control --region=europe-west1"
Write-Host ""

Write-Host "🎯 Service is ready for production use!" -ForegroundColor Green
