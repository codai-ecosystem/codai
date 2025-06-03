# Update Firebase OAuth Configuration
# This script helps configure Firebase Auth for OAuth providers

param(
    [string]$GoogleClientId = "",
    [string]$GitHubClientId = "",
    [string]$Environment = "production"
)

Write-Host "=== AIDE Control Panel - Firebase OAuth Configuration ===" -ForegroundColor Cyan
Write-Host ""

# Set the environment file path
$envFile = ".env.$Environment"
if ($Environment -eq "production") {
    $envFile = ".env.production"
} elseif ($Environment -eq "development") {
    $envFile = ".env.development"
}

Write-Host "Configuring Firebase OAuth for environment: $Environment" -ForegroundColor Yellow
Write-Host "Environment file: $envFile" -ForegroundColor Yellow
Write-Host ""

# Check if environment file exists
if (-not (Test-Path $envFile)) {
    Write-Host "Error: Environment file not found: $envFile" -ForegroundColor Red
    exit 1
}

# Read environment file
$envContent = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $envContent[$matches[1]] = $matches[2]
    }
}

# Get OAuth client IDs from environment file if not provided
if ([string]::IsNullOrEmpty($GoogleClientId)) {
    $GoogleClientId = $envContent["NEXT_PUBLIC_GOOGLE_CLIENT_ID"]
}

if ([string]::IsNullOrEmpty($GitHubClientId)) {
    $GitHubClientId = $envContent["NEXT_PUBLIC_GITHUB_CLIENT_ID"]
}

# Check if Firebase CLI is installed
try {
    $firebaseVersion = firebase --version
    Write-Host "Firebase CLI version: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "Firebase CLI is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Firebase CLI first: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

# Get Firebase project ID from environment
$projectId = $envContent["NEXT_PUBLIC_FIREBASE_PROJECT_ID"]
if ([string]::IsNullOrEmpty($projectId)) {
    Write-Host "Error: Firebase project ID not found in environment file." -ForegroundColor Red
    Write-Host "Please ensure NEXT_PUBLIC_FIREBASE_PROJECT_ID is set." -ForegroundColor Yellow
    exit 1
}

Write-Host "Firebase Project ID: $projectId" -ForegroundColor Yellow
Write-Host ""

# Login to Firebase if needed
Write-Host "Checking Firebase authentication..." -ForegroundColor Cyan
firebase login:list | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to Firebase..."
    firebase login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to login to Firebase." -ForegroundColor Red
        exit 1
    }
}
Write-Host "Firebase authentication confirmed." -ForegroundColor Green
Write-Host ""

# Get callback URL
$nextauthUrl = $envContent["NEXTAUTH_URL"]
if ([string]::IsNullOrEmpty($nextauthUrl)) {
    Write-Host "Warning: NEXTAUTH_URL not found in environment file." -ForegroundColor Yellow
    $nextauthUrl = if ($Environment -eq "development") { "http://localhost:3000" } else { "https://yourdomain.com" }
    Write-Host "Using default NEXTAUTH_URL: $nextauthUrl" -ForegroundColor Yellow
}

$callbackUrl = "$nextauthUrl/auth/callback"

# Configure Google OAuth
if (-not [string]::IsNullOrEmpty($GoogleClientId)) {
    Write-Host "Configuring Google OAuth provider..." -ForegroundColor Cyan

    # Display configuration information
    Write-Host "Google Client ID: $GoogleClientId" -ForegroundColor Yellow
    Write-Host "Google Redirect URI: $callbackUrl" -ForegroundColor Yellow

    Write-Host ""
    Write-Host "Manual configuration required:" -ForegroundColor Yellow
    Write-Host "Please open Firebase Console > Authentication > Sign-in method > Google and:" -ForegroundColor White
    Write-Host "1. Enable Google sign-in provider" -ForegroundColor Gray
    Write-Host "2. Add this client ID: $GoogleClientId" -ForegroundColor Gray
    Write-Host "3. Enable 'Project support email'" -ForegroundColor Gray
    Write-Host "4. Save the changes" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "Skipping Google OAuth configuration (no client ID provided)" -ForegroundColor Yellow
    Write-Host ""
}

# Configure GitHub OAuth
if (-not [string]::IsNullOrEmpty($GitHubClientId)) {
    Write-Host "Configuring GitHub OAuth provider..." -ForegroundColor Cyan

    # Display configuration information
    Write-Host "GitHub Client ID: $GitHubClientId" -ForegroundColor Yellow
    Write-Host "GitHub Callback URL: $callbackUrl" -ForegroundColor Yellow

    Write-Host ""
    Write-Host "Manual configuration required:" -ForegroundColor Yellow
    Write-Host "Please open Firebase Console > Authentication > Sign-in method > GitHub and:" -ForegroundColor White
    Write-Host "1. Enable GitHub sign-in provider" -ForegroundColor Gray
    Write-Host "2. Add this client ID: $GitHubClientId" -ForegroundColor Gray
    Write-Host "3. Add the client secret from your environment file" -ForegroundColor Gray
    Write-Host "4. Add this callback URL: $callbackUrl" -ForegroundColor Gray
    Write-Host "5. Save the changes" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "Skipping GitHub OAuth configuration (no client ID provided)" -ForegroundColor Yellow
    Write-Host ""
}

# Configure authorized domains
$domain = if ($nextauthUrl -match 'https?://([^/]+)') { $matches[1] } else { "localhost" }

Write-Host "Configuring authorized domains..." -ForegroundColor Cyan
Write-Host "Adding domain: $domain" -ForegroundColor Yellow

Write-Host ""
Write-Host "Manual configuration required:" -ForegroundColor Yellow
Write-Host "Please open Firebase Console > Authentication > Settings > Authorized domains and:" -ForegroundColor White
Write-Host "1. Add this domain: $domain" -ForegroundColor Gray
Write-Host "2. Save the changes" -ForegroundColor Gray
Write-Host ""

# Summary
Write-Host "=== Configuration Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Firebase Project: $projectId" -ForegroundColor White
Write-Host "Environment: $Environment" -ForegroundColor White
Write-Host "Callback URL: $callbackUrl" -ForegroundColor White
Write-Host ""
Write-Host "OAuth Providers:" -ForegroundColor White
Write-Host "- Google: $(if (-not [string]::IsNullOrEmpty($GoogleClientId)) { "Configured" } else { "Not configured" })" -ForegroundColor $(if (-not [string]::IsNullOrEmpty($GoogleClientId)) { "Green" } else { "Yellow" })
Write-Host "- GitHub: $(if (-not [string]::IsNullOrEmpty($GitHubClientId)) { "Configured" } else { "Not configured" })" -ForegroundColor $(if (-not [string]::IsNullOrEmpty($GitHubClientId)) { "Green" } else { "Yellow" })
Write-Host ""
Write-Host "Reminder: Complete the manual configuration steps above in the Firebase Console" -ForegroundColor Yellow
Write-Host ""

# Next steps
Write-Host "=== Next Steps ===" -ForegroundColor Green
Write-Host ""
Write-Host "1. Complete manual configuration in Firebase Console" -ForegroundColor White
Write-Host "2. Test OAuth login flow using the test-oauth-providers.ps1 script" -ForegroundColor White
Write-Host "3. Deploy updated authentication system" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see: docs/OAUTH_SETUP.md" -ForegroundColor Cyan
