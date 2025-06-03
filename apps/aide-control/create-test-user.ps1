#!/usr/bin/env pwsh
# Create a test user for AIDE Control Panel authentication testing

param(
    [string]$ServiceUrl = "https://aide-control-xh6fsul3qq-uc.a.run.app",
    [string]$TestEmail = "admin@aide-dev.com",
    [string]$TestPassword = "AdminTest123!",
    [string]$UserRole = "admin"
)

Write-Host "👤 Creating Test User for AIDE Control Panel" -ForegroundColor Blue
Write-Host "Service URL: $ServiceUrl" -ForegroundColor Cyan
Write-Host "Test Email: $TestEmail" -ForegroundColor Cyan
Write-Host "User Role: $UserRole" -ForegroundColor Cyan
Write-Host ""

# Test if we can create a user via the API (if registration endpoint exists)
Write-Host "🔍 Checking for user registration endpoint..." -ForegroundColor Yellow

# Try to find registration endpoint
$registrationEndpoints = @(
    "$ServiceUrl/api/auth/register",
    "$ServiceUrl/api/users/register",
    "$ServiceUrl/api/register"
)

$registrationFound = $false
foreach ($endpoint in $registrationEndpoints) {
    try {
        Write-Host "   Testing: $endpoint" -ForegroundColor Gray
        $response = Invoke-WebRequest -Uri $endpoint -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 405) {
            Write-Host "   ✅ Endpoint exists: $endpoint" -ForegroundColor Green
            $registrationFound = $true
            break
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 405) {
            Write-Host "   ✅ Endpoint exists (Method Not Allowed): $endpoint" -ForegroundColor Green
            $registrationFound = $true
            break
        }
        Write-Host "   ❌ Not found: $endpoint" -ForegroundColor Red
    }
}

if (-not $registrationFound) {
    Write-Host "📝 No API registration endpoint found. Manual user creation required." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔧 Manual User Creation Options:" -ForegroundColor Green
    Write-Host ""
    Write-Host "1. 🌐 Through the Application UI (if available):" -ForegroundColor Cyan
    Write-Host "   • Open: $ServiceUrl"
    Write-Host "   • Look for a 'Register' or 'Sign Up' option"
    Write-Host "   • Create account with: $TestEmail"
    Write-Host ""
    Write-Host "2. 🔥 Through Firebase Console:" -ForegroundColor Cyan
    Write-Host "   • Go to: https://console.firebase.google.com/project/aide-dev-461602/authentication/users"
    Write-Host "   • Click 'Add User'"
    Write-Host "   • Email: $TestEmail"
    Write-Host "   • Password: $TestPassword"
    Write-Host "   • Save the user"
    Write-Host ""
    Write-Host "3. 📧 Through Firebase CLI (if available):" -ForegroundColor Cyan
    Write-Host "   firebase auth:create --email $TestEmail --password $TestPassword"
    Write-Host ""
} else {
    Write-Host "🎯 Attempting to create user via API..." -ForegroundColor Yellow
    # Implementation would go here if registration endpoint was found
}

Write-Host "🧪 Testing Steps After User Creation:" -ForegroundColor Green
Write-Host ""
Write-Host "1. 🔐 Test Login:" -ForegroundColor Cyan
Write-Host "   • Navigate to: $ServiceUrl/login"
Write-Host "   • Email: $TestEmail"
Write-Host "   • Password: $TestPassword"
Write-Host "   • Verify successful login and redirect"
Write-Host ""
Write-Host "2. 🛡️  Test Protected Routes:" -ForegroundColor Cyan
Write-Host "   • Dashboard: $ServiceUrl"
Write-Host "   • Users Management: $ServiceUrl/users"
Write-Host "   • API Keys: $ServiceUrl/api-keys"
Write-Host "   • Configuration: $ServiceUrl/configuration"
Write-Host ""
Write-Host "3. 🔌 Test API Access:" -ForegroundColor Cyan
Write-Host "   • GET $ServiceUrl/api/users (should work with auth)"
Write-Host "   • GET $ServiceUrl/api/billing (should work with auth)"
Write-Host "   • GET $ServiceUrl/api/services (should work with auth)"
Write-Host ""
Write-Host "4. 💳 Test Stripe Integration:" -ForegroundColor Cyan
Write-Host "   • Navigate to billing section"
Write-Host "   • View subscription plans"
Write-Host "   • Test checkout flow (use Stripe test cards)"
Write-Host ""
Write-Host "5. 🔧 Test GitHub Integration:" -ForegroundColor Cyan
Write-Host "   • Test webhook endpoint: $ServiceUrl/api/github/webhook"
Write-Host "   • Verify GitHub App installation flow (if configured)"
Write-Host ""

Write-Host "🎯 Firebase Console Direct Link:" -ForegroundColor Blue
Write-Host "https://console.firebase.google.com/project/aide-dev-461602/authentication/users" -ForegroundColor Blue

Write-Host ""
Write-Host "✅ Test user creation guide complete!" -ForegroundColor Green
