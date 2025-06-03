# AIDE Control Panel OAuth Configuration Script
# This script helps configure OAuth providers for the authentication system

param(
    [string]$GoogleClientId = "",
    [string]$GoogleClientSecret = "",
    [string]$GitHubClientId = "",
    [string]$GitHubClientSecret = "",
    [string]$Environment = "production",
    [switch]$Interactive = $false
)

Write-Host "=== AIDE Control Panel OAuth Configuration ===" -ForegroundColor Cyan
Write-Host ""

# Set the environment file path
$envFile = ".env.$Environment"
if ($Environment -eq "production") {
    $envFile = ".env.production"
} elseif ($Environment -eq "development") {
    $envFile = ".env.development"
}

Write-Host "Configuring OAuth for environment: $Environment" -ForegroundColor Yellow
Write-Host "Environment file: $envFile" -ForegroundColor Yellow
Write-Host ""

# Interactive mode
if ($Interactive) {
    Write-Host "=== Interactive OAuth Configuration ===" -ForegroundColor Green
    Write-Host ""

    Write-Host "Please provide your OAuth credentials:" -ForegroundColor White
    Write-Host ""

    # Google OAuth
    Write-Host "Google OAuth Configuration:" -ForegroundColor Cyan
    if ([string]::IsNullOrEmpty($GoogleClientId)) {
        $GoogleClientId = Read-Host "Enter Google Client ID"
    }
    if ([string]::IsNullOrEmpty($GoogleClientSecret)) {
        $GoogleClientSecret = Read-Host "Enter Google Client Secret" -AsSecureString
        $GoogleClientSecret = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($GoogleClientSecret))
    }

    Write-Host ""

    # GitHub OAuth
    Write-Host "GitHub OAuth Configuration:" -ForegroundColor Cyan
    if ([string]::IsNullOrEmpty($GitHubClientId)) {
        $GitHubClientId = Read-Host "Enter GitHub Client ID"
    }
    if ([string]::IsNullOrEmpty($GitHubClientSecret)) {
        $GitHubClientSecret = Read-Host "Enter GitHub Client Secret" -AsSecureString
        $GitHubClientSecret = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($GitHubClientSecret))
    }

    Write-Host ""
}

# Validate required parameters
$missingParams = @()
if ([string]::IsNullOrEmpty($GoogleClientId)) { $missingParams += "GoogleClientId" }
if ([string]::IsNullOrEmpty($GoogleClientSecret)) { $missingParams += "GoogleClientSecret" }
if ([string]::IsNullOrEmpty($GitHubClientId)) { $missingParams += "GitHubClientId" }
if ([string]::IsNullOrEmpty($GitHubClientSecret)) { $missingParams += "GitHubClientSecret" }

if ($missingParams.Count -gt 0) {
    Write-Host "Error: Missing required parameters: $($missingParams -join ', ')" -ForegroundColor Red
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\configure-oauth.ps1 -GoogleClientId 'your_id' -GoogleClientSecret 'your_secret' -GitHubClientId 'your_id' -GitHubClientSecret 'your_secret'"
    Write-Host "  .\configure-oauth.ps1 -Interactive"
    Write-Host ""
    exit 1
}

# Read existing environment file
$envContent = @{}
if (Test-Path $envFile) {
    Write-Host "Reading existing environment file: $envFile" -ForegroundColor Yellow
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $envContent[$matches[1]] = $matches[2]
        }
    }
} else {
    Write-Host "Creating new environment file: $envFile" -ForegroundColor Yellow
}

# Update OAuth configuration
Write-Host "Updating OAuth configuration..." -ForegroundColor Green

$envContent["NEXT_PUBLIC_GOOGLE_CLIENT_ID"] = $GoogleClientId
$envContent["GOOGLE_CLIENT_SECRET"] = $GoogleClientSecret
$envContent["NEXT_PUBLIC_GITHUB_CLIENT_ID"] = $GitHubClientId
$envContent["GITHUB_CLIENT_SECRET"] = $GitHubClientSecret

# Ensure other required variables are present
$requiredVars = @{
    "NEXTAUTH_SECRET" = "your-secret-key-please-change-this"
    "NEXTAUTH_URL" = if ($Environment -eq "development") { "http://localhost:3000" } else { "https://your-domain.com" }
}

foreach ($key in $requiredVars.Keys) {
    if (-not $envContent.ContainsKey($key) -or [string]::IsNullOrEmpty($envContent[$key])) {
        $envContent[$key] = $requiredVars[$key]
        Write-Host "Added default value for $key" -ForegroundColor Yellow
    }
}

# Write environment file
$envLines = @()
$envLines += "# Environment Variables for AIDE Control Panel"
$envLines += "# Generated on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$envLines += ""

# Group variables
$groups = @{
    "Firebase Configuration" = @("NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "NEXT_PUBLIC_FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "NEXT_PUBLIC_FIREBASE_APP_ID", "FIREBASE_ADMIN_CREDENTIALS")
    "OAuth Configuration" = @("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "NEXT_PUBLIC_GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET")
    "Auth Configuration" = @("NEXTAUTH_SECRET", "NEXTAUTH_URL")
    "Stripe Configuration" = @("STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET")
    "API Configuration" = @("NEXT_PUBLIC_API_URL")
    "Service Provider Keys" = @("OPENAI_API_KEY", "AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT", "ANTHROPIC_API_KEY")
}

foreach ($groupName in $groups.Keys) {
    $envLines += "# $groupName"
    foreach ($varName in $groups[$groupName]) {
        $value = if ($envContent.ContainsKey($varName)) { $envContent[$varName] } else { "" }
        $envLines += "$varName=$value"
    }
    $envLines += ""
}

# Add any remaining variables
$addedVars = $groups.Values | ForEach-Object { $_ } | Sort-Object -Unique
foreach ($key in ($envContent.Keys | Sort-Object)) {
    if ($key -notin $addedVars) {
        $envLines += "$key=$($envContent[$key])"
    }
}

# Write to file
$envLines | Out-File -FilePath $envFile -Encoding utf8
Write-Host "Environment file updated: $envFile" -ForegroundColor Green

# Validation
Write-Host ""
Write-Host "=== Configuration Validation ===" -ForegroundColor Cyan
Write-Host ""

$validationResults = @()

# Check OAuth configurations
if ($GoogleClientId -match '^[0-9]+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com$') {
    $validationResults += @{ Status = "✅"; Item = "Google Client ID format" }
} else {
    $validationResults += @{ Status = "⚠️"; Item = "Google Client ID format (should end with .apps.googleusercontent.com)" }
}

if ($GitHubClientId -match '^[a-f0-9]{20}$') {
    $validationResults += @{ Status = "✅"; Item = "GitHub Client ID format" }
} else {
    $validationResults += @{ Status = "⚠️"; Item = "GitHub Client ID format (should be 20 character hex string)" }
}

if ($GoogleClientSecret.Length -gt 20) {
    $validationResults += @{ Status = "✅"; Item = "Google Client Secret length" }
} else {
    $validationResults += @{ Status = "⚠️"; Item = "Google Client Secret length" }
}

if ($GitHubClientSecret.Length -gt 30) {
    $validationResults += @{ Status = "✅"; Item = "GitHub Client Secret length" }
} else {
    $validationResults += @{ Status = "⚠️"; Item = "GitHub Client Secret length" }
}

# Display validation results
foreach ($result in $validationResults) {
    Write-Host "$($result.Status) $($result.Item)" -ForegroundColor White
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Green
Write-Host ""
Write-Host "1. Configure OAuth providers in Firebase Console:" -ForegroundColor White
Write-Host "   - Go to Firebase Console > Authentication > Sign-in method" -ForegroundColor Gray
Write-Host "   - Enable Google and GitHub providers" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configure authorized domains in Firebase:" -ForegroundColor White
Write-Host "   - Add your domain to the authorized domains list" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test OAuth authentication:" -ForegroundColor White
Write-Host "   - Start your development server: npm run dev" -ForegroundColor Gray
Write-Host "   - Navigate to http://localhost:3000/login" -ForegroundColor Gray
Write-Host "   - Test Google and GitHub sign-in" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Deploy and test in production:" -ForegroundColor White
Write-Host "   - Update production environment variables" -ForegroundColor Gray
Write-Host "   - Deploy application" -ForegroundColor Gray
Write-Host "   - Test OAuth providers in production" -ForegroundColor Gray
Write-Host ""

Write-Host "OAuth configuration completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "For detailed setup instructions, see: docs/OAUTH_SETUP.md" -ForegroundColor Cyan
