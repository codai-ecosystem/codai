#!/usr/bin/env pwsh

# Script to create a test user in Firebase Authentication
Write-Host "👤 Firebase Test User Creation Guide" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

$serviceUrl = "https://aide-control-xh6fsul3qq-uc.a.run.app"

Write-Host "📧 Create Test User via Firebase Console:" -ForegroundColor Yellow
Write-Host "1. Go to Firebase Console: https://console.firebase.google.com/"
Write-Host "2. Select project: aide-dev-461602"
Write-Host "3. Navigate to Authentication > Users"
Write-Host "4. Click 'Add user'"
Write-Host "5. Enter test credentials:"
Write-Host "   - Email: test@aide.dev"
Write-Host "   - Password: TestPassword123!"
Write-Host ""

Write-Host "🔐 Alternative: Create via Registration Page:" -ForegroundColor Yellow
Write-Host "1. Visit: $serviceUrl/login"
Write-Host "2. Look for 'Create Account' or 'Sign Up' option"
Write-Host "3. Register with test credentials"
Write-Host ""

Write-Host "🧪 Test Authentication Flow:" -ForegroundColor Green
Write-Host "1. Visit login page: $serviceUrl/login"
Write-Host "2. Try email/password login with test credentials"
Write-Host "3. Verify successful authentication and redirect"
Write-Host "4. Test logout functionality"
Write-Host ""

Write-Host "📊 Verify User in Firebase Console:" -ForegroundColor Cyan
Write-Host "1. Check Authentication > Users for new user"
Write-Host "2. Verify user shows up after registration/login"
Write-Host "3. Check user metadata and login history"
Write-Host ""

Write-Host "🔍 Debug Authentication Issues:" -ForegroundColor Red
Write-Host "1. Check browser console for errors"
Write-Host "2. Verify Firebase configuration in .env.production"
Write-Host "3. Check Cloud Run logs for authentication errors:"
Write-Host "   gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=aide-control' --limit=50 --format='value(textPayload)'"
Write-Host ""

Write-Host "Test credentials to use:" -ForegroundColor Green
Write-Host "Email: test@aide.dev"
Write-Host "Password: TestPassword123!"
Write-Host ""

Write-Host "Press any key to continue..."
Read-Host
