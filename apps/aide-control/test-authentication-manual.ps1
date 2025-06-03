#!/usr/bin/env pwsh

# Create Firebase Test User and Test Authentication
Write-Host "👤 Firebase Authentication Testing Guide" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$serviceUrl = "https://aide-control-xh6fsul3qq-uc.a.run.app"

Write-Host "🔧 Step 1: Create Test User in Firebase Console" -ForegroundColor Yellow
Write-Host "1. Go to Firebase Console: https://console.firebase.google.com/"
Write-Host "2. Select project: aide-dev-461602"
Write-Host "3. Navigate to Authentication > Users"
Write-Host "4. Click 'Add user'"
Write-Host "5. Enter test credentials:"
Write-Host "   Email: test@aide.dev"
Write-Host "   Password: TestPassword123!"
Write-Host "6. Click 'Add user'"
Write-Host ""

Write-Host "🌐 Step 2: Test Login Flow" -ForegroundColor Yellow
Write-Host "1. Open: $serviceUrl/login"
Write-Host "2. Enter test credentials:"
Write-Host "   Email: test@aide.dev"
Write-Host "   Password: TestPassword123!"
Write-Host "3. Click 'Sign in'"
Write-Host "4. Verify successful login and redirect"
Write-Host ""

Write-Host "🔒 Step 3: Test Protected Pages Access" -ForegroundColor Yellow
Write-Host "After successful login, test these pages:"
Write-Host "• Dashboard: $serviceUrl/"
Write-Host "• Users: $serviceUrl/users"
Write-Host "• Billing: $serviceUrl/billing"
Write-Host ""

Write-Host "🚪 Step 4: Test Logout" -ForegroundColor Yellow
Write-Host "1. Look for logout button/option"
Write-Host "2. Click logout"
Write-Host "3. Verify redirect to login page"
Write-Host "4. Try accessing protected pages (should redirect to login)"
Write-Host ""

Write-Host "🧪 Automated Test Script" -ForegroundColor Cyan
Write-Host "After creating the test user, run:"
Write-Host ".\test-authentication-complete.ps1"
Write-Host ""

Write-Host "📊 What to Watch For:" -ForegroundColor Green
Write-Host "✅ Login form accepts credentials"
Write-Host "✅ Successful authentication redirects to dashboard"
Write-Host "✅ Protected pages accessible after login"
Write-Host "✅ Logout works correctly"
Write-Host "✅ Unauthenticated users redirected to login"
Write-Host ""

Write-Host "🐛 Troubleshooting:" -ForegroundColor Red
Write-Host "If login fails:"
Write-Host "1. Check browser console for errors"
Write-Host "2. Verify Firebase configuration in browser dev tools"
Write-Host "3. Check Cloud Run logs:"
Write-Host "   gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=aide-control' --limit=20"
Write-Host ""

Write-Host "Ready to start? Press any key to open Firebase Console..."
Read-Host

# Open Firebase Console
Start-Process "https://console.firebase.google.com/project/aide-dev-461602/authentication/users"

Write-Host ""
Write-Host "After creating the test user, press any key to open the login page..."
Read-Host

# Open login page
Start-Process "$serviceUrl/login"
