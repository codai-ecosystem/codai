#!/usr/bin/env pwsh
# Comprehensive Testing Script for AIDE Control Panel Deployment

param(
    [string]$ServiceUrl = "https://aide-control-xh6fsul3qq-uc.a.run.app",
    [switch]$SkipManualTests = $false
)

Write-Host "🚀 AIDE Control Panel - Complete Deployment Testing" -ForegroundColor Blue
Write-Host "=====================================================" -ForegroundColor Blue
Write-Host "Service URL: $ServiceUrl" -ForegroundColor Cyan
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

$testResults = @()

# Test 1: Service Health
Write-Host "1️⃣  Testing Service Health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$ServiceUrl/api/health" -Method GET -TimeoutSec 10
    $testResults += @{
        Test = "Service Health"
        Status = "✅ PASS"
        Details = "Status: $($healthResponse.status), Version: $($healthResponse.version)"
    }
    Write-Host "   ✅ Service is healthy" -ForegroundColor Green
} catch {
    $testResults += @{
        Test = "Service Health"
        Status = "❌ FAIL"
        Details = $_.Exception.Message
    }
    Write-Host "   ❌ Service health check failed" -ForegroundColor Red
}

# Test 2: Frontend Accessibility
Write-Host ""
Write-Host "2️⃣  Testing Frontend Accessibility..." -ForegroundColor Yellow
$frontendPages = @(
    @{ Name = "Main Page"; Url = $ServiceUrl }
    @{ Name = "Login Page"; Url = "$ServiceUrl/login" }
    @{ Name = "Users Page"; Url = "$ServiceUrl/users" }
    @{ Name = "Billing Page"; Url = "$ServiceUrl/billing" }
)

foreach ($page in $frontendPages) {
    try {
        $response = Invoke-WebRequest -Uri $page.Url -Method GET -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            $testResults += @{
                Test = "$($page.Name) Access"
                Status = "✅ PASS"
                Details = "HTTP $($response.StatusCode)"
            }
            Write-Host "   ✅ $($page.Name) accessible" -ForegroundColor Green
        } else {
            $testResults += @{
                Test = "$($page.Name) Access"
                Status = "⚠️  WARN"
                Details = "HTTP $($response.StatusCode)"
            }
            Write-Host "   ⚠️  $($page.Name) returned HTTP $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        $testResults += @{
            Test = "$($page.Name) Access"
            Status = "❌ FAIL"
            Details = $_.Exception.Message
        }
        Write-Host "   ❌ $($page.Name) failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 3: API Endpoint Security
Write-Host ""
Write-Host "3️⃣  Testing API Security..." -ForegroundColor Yellow
$protectedEndpoints = @(
    @{ Name = "Users API"; Url = "$ServiceUrl/api/users" }
    @{ Name = "Billing API"; Url = "$ServiceUrl/api/billing" }
    @{ Name = "Services API"; Url = "$ServiceUrl/api/services" }
)

foreach ($endpoint in $protectedEndpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint.Url -Method GET -TimeoutSec 10 -UseBasicParsing
        $testResults += @{
            Test = "$($endpoint.Name) Security"
            Status = "❌ FAIL"
            Details = "Endpoint accessible without authentication (HTTP $($response.StatusCode))"
        }
        Write-Host "   ❌ $($endpoint.Name) not properly protected" -ForegroundColor Red
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401 -or $_.Exception.Response.StatusCode -eq 403) {
            $testResults += @{
                Test = "$($endpoint.Name) Security"
                Status = "✅ PASS"
                Details = "Properly protected (HTTP $($_.Exception.Response.StatusCode))"
            }
            Write-Host "   ✅ $($endpoint.Name) properly protected" -ForegroundColor Green
        } elseif ($_.Exception.Response.StatusCode -eq 404) {
            $testResults += @{
                Test = "$($endpoint.Name) Security"
                Status = "⚠️  SKIP"
                Details = "Endpoint not found (HTTP 404)"
            }
            Write-Host "   ⚠️  $($endpoint.Name) not found" -ForegroundColor Yellow
        } else {
            $testResults += @{
                Test = "$($endpoint.Name) Security"
                Status = "❌ FAIL"
                Details = $_.Exception.Message
            }
            Write-Host "   ❌ $($endpoint.Name) test failed" -ForegroundColor Red
        }
    }
}

# Test 4: GitHub Webhook
Write-Host ""
Write-Host "4️⃣  Testing GitHub Webhook..." -ForegroundColor Yellow
try {
    $webhookTest = Invoke-RestMethod -Uri "$ServiceUrl/api/github/webhook" -Method POST -Body '{"test":"ping"}' -ContentType "application/json" -TimeoutSec 10
    if ($webhookTest.error -like "*signature*") {
        $testResults += @{
            Test = "GitHub Webhook"
            Status = "✅ PASS"
            Details = "Properly validates signatures"
        }
        Write-Host "   ✅ GitHub webhook properly validates signatures" -ForegroundColor Green
    } else {
        $testResults += @{
            Test = "GitHub Webhook"
            Status = "⚠️  WARN"
            Details = "Unexpected response: $($webhookTest)"
        }
        Write-Host "   ⚠️  GitHub webhook unexpected response" -ForegroundColor Yellow
    }
} catch {
    $testResults += @{
        Test = "GitHub Webhook"
        Status = "❌ FAIL"
        Details = $_.Exception.Message
    }
    Write-Host "   ❌ GitHub webhook test failed" -ForegroundColor Red
}

# Test 5: Environment Configuration
Write-Host ""
Write-Host "5️⃣  Testing Environment Configuration..." -ForegroundColor Yellow

# Test if Firebase is configured
try {
    $response = Invoke-WebRequest -Uri $ServiceUrl -Method GET -TimeoutSec 10 -UseBasicParsing
    if ($response.Content -like "*firebase*" -or $response.Content -like "*aide-dev-461602*") {
        $testResults += @{
            Test = "Firebase Configuration"
            Status = "✅ PASS"
            Details = "Firebase client detected in page"
        }
        Write-Host "   ✅ Firebase configuration detected" -ForegroundColor Green
    } else {
        $testResults += @{
            Test = "Firebase Configuration"
            Status = "⚠️  WARN"
            Details = "Firebase not detected in page content"
        }
        Write-Host "   ⚠️  Firebase configuration not clearly detected" -ForegroundColor Yellow
    }
} catch {
    $testResults += @{
        Test = "Firebase Configuration"
        Status = "❌ FAIL"
        Details = $_.Exception.Message
    }
    Write-Host "   ❌ Firebase configuration test failed" -ForegroundColor Red
}

# Display Summary
Write-Host ""
Write-Host "📊 TEST RESULTS SUMMARY" -ForegroundColor Blue
Write-Host "========================" -ForegroundColor Blue
$passCount = ($testResults | Where-Object { $_.Status -like "*PASS*" }).Count
$failCount = ($testResults | Where-Object { $_.Status -like "*FAIL*" }).Count
$warnCount = ($testResults | Where-Object { $_.Status -like "*WARN*" }).Count
$skipCount = ($testResults | Where-Object { $_.Status -like "*SKIP*" }).Count

Write-Host "✅ Passed: $passCount" -ForegroundColor Green
Write-Host "❌ Failed: $failCount" -ForegroundColor Red
Write-Host "⚠️  Warnings: $warnCount" -ForegroundColor Yellow
Write-Host "⏭️  Skipped: $skipCount" -ForegroundColor Gray

Write-Host ""
Write-Host "📋 DETAILED RESULTS:" -ForegroundColor Cyan
foreach ($result in $testResults) {
    Write-Host "$($result.Status) $($result.Test): $($result.Details)" -ForegroundColor Gray
}

if (-not $SkipManualTests) {
    Write-Host ""
    Write-Host "🔧 MANUAL TESTING REQUIRED:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. 👤 Create Test User:" -ForegroundColor Cyan
    Write-Host "   • Go to: https://console.firebase.google.com/project/aide-dev-461602/authentication/users"
    Write-Host "   • Click 'Add User'"
    Write-Host "   • Email: admin@aide-dev.com"
    Write-Host "   • Password: AdminTest123!"
    Write-Host "   • Save the user"
    Write-Host ""
    Write-Host "2. 🔐 Test Authentication:" -ForegroundColor Cyan
    Write-Host "   • Visit: $ServiceUrl/login"
    Write-Host "   • Login with the test user credentials"
    Write-Host "   • Verify successful login and redirect to dashboard"
    Write-Host "   • Test logout functionality"
    Write-Host ""
    Write-Host "3. 🛡️  Test Protected Routes (after login):" -ForegroundColor Cyan
    Write-Host "   • Dashboard: $ServiceUrl"
    Write-Host "   • Users: $ServiceUrl/users"
    Write-Host "   • Billing: $ServiceUrl/billing"
    Write-Host "   • API Keys: $ServiceUrl/api-keys"
    Write-Host "   • Configuration: $ServiceUrl/configuration"
    Write-Host ""
    Write-Host "4. 💳 Test Stripe Integration:" -ForegroundColor Cyan
    Write-Host "   • Navigate to billing section"
    Write-Host "   • View available plans"
    Write-Host "   • Test checkout flow with Stripe test cards:"
    Write-Host "     - Success: 4242 4242 4242 4242"
    Write-Host "     - Decline: 4000 0000 0000 0002"
    Write-Host ""
    Write-Host "5. 🔧 Configure OAuth (if needed):" -ForegroundColor Cyan
    Write-Host "   • Firebase Console: https://console.firebase.google.com/project/aide-dev-461602/authentication/providers"
    Write-Host "   • GitHub OAuth: https://github.com/settings/applications"
    Write-Host "   • Update redirect URLs to: $ServiceUrl/api/auth/callback/..."
    Write-Host ""
}

Write-Host "🎯 NEXT STEPS:" -ForegroundColor Green
if ($failCount -eq 0) {
    Write-Host "   ✅ All automated tests passed! Proceed with manual testing." -ForegroundColor Green
    Write-Host "   🔗 Open the application: $ServiceUrl" -ForegroundColor Blue
} else {
    Write-Host "   ⚠️  Some tests failed. Review the issues above before proceeding." -ForegroundColor Yellow
    Write-Host "   🔧 Fix failing tests, then run manual testing." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Deployment testing complete!" -ForegroundColor Green
Write-Host "📅 Completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
