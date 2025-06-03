#!/usr/bin/env pwsh
# Test Authentication Flow for AIDE Control Panel

param(
    [string]$ServiceUrl = "https://aide-control-xh6fsul3qq-uc.a.run.app",
    [string]$TestEmail = "test@aide-dev.com",
    [string]$TestPassword = "TestPassword123!",
    [switch]$SkipRegistration = $false
)

Write-Host "🧪 Testing AIDE Control Panel Authentication" -ForegroundColor Blue
Write-Host "Service URL: $ServiceUrl" -ForegroundColor Cyan
Write-Host "Test Email: $TestEmail" -ForegroundColor Cyan
Write-Host ""

# Test service availability
Write-Host "📡 Testing service availability..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$ServiceUrl/api/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Service is running" -ForegroundColor Green
    Write-Host "   Status: $($healthResponse.status)" -ForegroundColor Gray
    Write-Host "   Service: $($healthResponse.service)" -ForegroundColor Gray
    Write-Host "   Version: $($healthResponse.version)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Service health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test main page accessibility
Write-Host ""
Write-Host "🌐 Testing main page accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $ServiceUrl -Method GET -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Main page accessible (HTTP $($response.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Main page returned HTTP $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Main page access failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test login page
Write-Host ""
Write-Host "🔐 Testing login page..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$ServiceUrl/login" -Method GET -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Login page accessible (HTTP $($response.StatusCode))" -ForegroundColor Green

        # Check if login form is present
        if ($response.Content -like "*email*" -and $response.Content -like "*password*") {
            Write-Host "✅ Login form detected" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Login form elements not detected in content" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Login page returned HTTP $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Login page access failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test API endpoints
Write-Host ""
Write-Host "🔌 Testing API endpoints..." -ForegroundColor Yellow

# Test users endpoint (should require authentication)
try {
    $response = Invoke-WebRequest -Uri "$ServiceUrl/api/users" -Method GET -TimeoutSec 10 -UseBasicParsing
    Write-Host "⚠️  Users API accessible without auth (HTTP $($response.StatusCode))" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 401 -or $_.Exception.Response.StatusCode -eq 403) {
        Write-Host "✅ Users API properly protected (HTTP $($_.Exception.Response.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "❌ Users API test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test billing endpoint (should require authentication)
try {
    $response = Invoke-WebRequest -Uri "$ServiceUrl/api/billing/subscriptions" -Method GET -TimeoutSec 10 -UseBasicParsing
    Write-Host "⚠️  Billing API accessible without auth (HTTP $($response.StatusCode))" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 401 -or $_.Exception.Response.StatusCode -eq 403) {
        Write-Host "✅ Billing API properly protected (HTTP $($_.Exception.Response.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "❌ Billing API test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔑 Authentication Configuration Status:" -ForegroundColor Yellow

# Check Firebase configuration
Write-Host "   Firebase Client Configuration:" -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "$ServiceUrl/_next/static/chunks/pages/_app.js" -Method GET -TimeoutSec 10 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($response.Content -like "*firebase*") {
        Write-Host "   ✅ Firebase client detected" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Firebase client not detected in app bundle" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Could not analyze client bundle" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Next Steps for Complete Testing:" -ForegroundColor Green
Write-Host "1. 🌐 Open the application in a browser:" -ForegroundColor Cyan
Write-Host "   $ServiceUrl" -ForegroundColor Blue
Write-Host ""
Write-Host "2. 📝 Register a test user (if registration is available):" -ForegroundColor Cyan
Write-Host "   • Email: $TestEmail"
Write-Host "   • Password: $TestPassword"
Write-Host ""
Write-Host "3. 🔐 Test login functionality:" -ForegroundColor Cyan
Write-Host "   • Navigate to: $ServiceUrl/login"
Write-Host "   • Try logging in with test credentials"
Write-Host "   • Verify successful authentication and redirect"
Write-Host ""
Write-Host "4. 🧪 Test protected routes:" -ForegroundColor Cyan
Write-Host "   • Dashboard: $ServiceUrl"
Write-Host "   • Users: $ServiceUrl/users"
Write-Host "   • Billing: $ServiceUrl/billing"
Write-Host "   • API Keys: $ServiceUrl/api-keys"
Write-Host ""
Write-Host "5. 💳 Test Stripe integration:" -ForegroundColor Cyan
Write-Host "   • Navigate to billing section"
Write-Host "   • Test subscription plan selection"
Write-Host "   • Verify Stripe checkout (use test cards)"
Write-Host ""

if (-not $SkipRegistration) {
    Write-Host "🔧 Manual Testing Required:" -ForegroundColor Yellow
    Write-Host "Since user registration via API is not available, you'll need to:"
    Write-Host "1. Check if there's a registration form in the UI"
    Write-Host "2. Use Firebase Console to create a test user manually"
    Write-Host "3. Or implement OAuth providers (Google/GitHub) for easier testing"
}

Write-Host ""
Write-Host "✅ Authentication testing script complete!" -ForegroundColor Green
Write-Host "🔗 Open the application: $ServiceUrl" -ForegroundColor Blue
