#!/usr/bin/env pwsh

# Script to configure Firebase Authentication OAuth providers
Write-Host "🔧 Firebase OAuth Configuration Guide" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

$serviceUrl = "https://aide-control-xh6fsul3qq-uc.a.run.app"

Write-Host "Current deployed service URL: $serviceUrl" -ForegroundColor Green
Write-Host ""

Write-Host "📝 Firebase Console Configuration Steps:" -ForegroundColor Yellow
Write-Host "1. Go to Firebase Console: https://console.firebase.google.com/"
Write-Host "2. Select your project: aide-dev-461602"
Write-Host "3. Navigate to Authentication > Sign-in method"
Write-Host ""

Write-Host "🔐 Enable Google OAuth Provider:" -ForegroundColor Yellow
Write-Host "1. Click on 'Google' provider"
Write-Host "2. Enable the provider"
Write-Host "3. Add authorized domain: aide-control-xh6fsul3qq-uc.a.run.app"
Write-Host "4. Add redirect URI: $serviceUrl/__/auth/handler"
Write-Host ""

Write-Host "🐙 Enable GitHub OAuth Provider:" -ForegroundColor Yellow
Write-Host "1. Click on 'GitHub' provider"
Write-Host "2. Enable the provider"
Write-Host "3. You'll need GitHub OAuth App credentials:"
Write-Host "   - Client ID: (from GitHub OAuth App)"
Write-Host "   - Client Secret: (from GitHub OAuth App)"
Write-Host ""

Write-Host "📱 GitHub OAuth App Configuration:" -ForegroundColor Yellow
Write-Host "1. Go to GitHub: https://github.com/settings/developers"
Write-Host "2. Navigate to OAuth Apps"
Write-Host "3. Create new OAuth App or update existing:"
Write-Host "   - Application name: AIDE Control Panel"
Write-Host "   - Homepage URL: $serviceUrl"
Write-Host "   - Authorization callback URL: $serviceUrl/__/auth/handler"
Write-Host ""

Write-Host "🌐 Authorized Domains in Firebase:" -ForegroundColor Yellow
Write-Host "Add these domains to Firebase Authentication > Settings > Authorized domains:"
Write-Host "- aide-control-xh6fsul3qq-uc.a.run.app"
Write-Host "- localhost (for development)"
Write-Host ""

Write-Host "✅ Verification Steps:" -ForegroundColor Green
Write-Host "1. Test Google OAuth: $serviceUrl/login"
Write-Host "2. Test GitHub OAuth: $serviceUrl/login"
Write-Host "3. Test email/password auth: $serviceUrl/login"
Write-Host ""

Write-Host "🔍 Current OAuth redirect URL should be:" -ForegroundColor Cyan
Write-Host "$serviceUrl/__/auth/handler"
Write-Host ""

Write-Host "Press any key to continue..."
Read-Host
