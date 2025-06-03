#!/usr/bin/env pwsh
# Update OAuth Configuration for AIDE Control Panel Production Deployment

param(
    [string]$ServiceUrl = "https://aide-control-xh6fsul3qq-uc.a.run.app",
    [switch]$SkipFirebaseUpdate = $false,
    [switch]$SkipGitHubUpdate = $false,
    [switch]$TestOnly = $false
)

Write-Host "🔧 OAuth Configuration Update for AIDE Control Panel" -ForegroundColor Blue
Write-Host "Service URL: $ServiceUrl" -ForegroundColor Cyan
Write-Host ""

# Define OAuth callback URLs
$GoogleCallbackUrl = "$ServiceUrl/api/auth/callback/google"
$GitHubCallbackUrl = "$ServiceUrl/api/auth/callback/github"
$FirebaseRedirectUrls = @(
    "$ServiceUrl",
    "$ServiceUrl/auth/callback",
    "$GoogleCallbackUrl",
    "$GitHubCallbackUrl"
)

Write-Host "📋 Required OAuth Configuration Updates:" -ForegroundColor Yellow
Write-Host ""

# Firebase OAuth Configuration
if (-not $SkipFirebaseUpdate) {
    Write-Host "🔥 Firebase Authentication Configuration:" -ForegroundColor Green
    Write-Host "   Project ID: aide-dev-461602"
    Write-Host "   Add these authorized domains in Firebase Console:"
    $FirebaseRedirectUrls | ForEach-Object {
        $domain = ([System.Uri]$_).Host
        Write-Host "   • $domain" -ForegroundColor Cyan
    }

    Write-Host ""
    Write-Host "   OAuth Redirect URLs to add:"
    $FirebaseRedirectUrls | ForEach-Object {
        Write-Host "   • $_" -ForegroundColor Cyan
    }

    Write-Host ""
    Write-Host "   🔗 Firebase Console URL:"
    Write-Host "   https://console.firebase.google.com/project/aide-dev-461602/authentication/providers" -ForegroundColor Blue
}

# GitHub OAuth Configuration
if (-not $SkipGitHubUpdate) {
    Write-Host ""
    Write-Host "🐙 GitHub OAuth App Configuration:" -ForegroundColor Green
    Write-Host "   Homepage URL: $ServiceUrl"
    Write-Host "   Authorization callback URL: $GitHubCallbackUrl" -ForegroundColor Cyan

    Write-Host ""
    Write-Host "   🔗 GitHub OAuth App Settings:"
    Write-Host "   https://github.com/settings/applications" -ForegroundColor Blue
    Write-Host "   (Update your GitHub OAuth App with the above URLs)"
}

Write-Host ""
Write-Host "⚡ Testing Authentication Endpoints:" -ForegroundColor Yellow

# Test health endpoint
Write-Host "Testing health endpoint..." -ForegroundColor Gray
try {
    $healthResponse = Invoke-RestMethod -Uri "$ServiceUrl/api/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Health endpoint: OK" -ForegroundColor Green
    if ($healthResponse.status) {
        Write-Host "   Status: $($healthResponse.status)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test NextAuth configuration endpoint
Write-Host "Testing NextAuth configuration..." -ForegroundColor Gray
try {
    $authResponse = Invoke-RestMethod -Uri "$ServiceUrl/api/auth/providers" -Method GET -TimeoutSec 10
    Write-Host "✅ NextAuth providers endpoint: OK" -ForegroundColor Green
    if ($authResponse) {
        Write-Host "   Available providers:" -ForegroundColor Gray
        $authResponse.PSObject.Properties | ForEach-Object {
            Write-Host "   • $($_.Name): $($_.Value.name)" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "❌ NextAuth providers failed: $($_.Exception.Message)" -ForegroundColor Red
}

if (-not $TestOnly) {
    Write-Host ""
    Write-Host "📝 Manual Configuration Required:" -ForegroundColor Yellow
    Write-Host ""

    if (-not $SkipFirebaseUpdate) {
        Write-Host "1. Firebase Console (https://console.firebase.google.com/project/aide-dev-461602):"
        Write-Host "   • Go to Authentication > Settings > Authorized domains"
        Write-Host "   • Add domain: aide-control-xh6fsul3qq-uc.a.run.app"
        Write-Host "   • Go to Authentication > Sign-in method > Google"
        Write-Host "   • Ensure Google provider is enabled"
        Write-Host "   • Add redirect URIs if using web client ID"
        Write-Host ""
    }

    if (-not $SkipGitHubUpdate) {
        Write-Host "2. GitHub OAuth App Settings:"
        Write-Host "   • Go to https://github.com/settings/applications"
        Write-Host "   • Find your AIDE OAuth app"
        Write-Host "   • Update Homepage URL: $ServiceUrl"
        Write-Host "   • Update Authorization callback URL: $GitHubCallbackUrl"
        Write-Host ""
    }

    Write-Host "3. Verify environment variables in Cloud Run:"
    Write-Host "   • GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are set"
    Write-Host "   • NEXTAUTH_URL=$ServiceUrl"
    Write-Host "   • NEXTAUTH_SECRET is set to a secure value"
    Write-Host ""
}

Write-Host "🧪 Test the authentication flow:" -ForegroundColor Green
Write-Host "1. Visit: $ServiceUrl" -ForegroundColor Cyan
Write-Host "2. Try logging in with Google OAuth" -ForegroundColor Cyan
Write-Host "3. Try logging in with GitHub OAuth (if configured)" -ForegroundColor Cyan
Write-Host "4. Verify user session and logout functionality" -ForegroundColor Cyan

Write-Host ""
Write-Host "✅ OAuth configuration update complete!" -ForegroundColor Green
