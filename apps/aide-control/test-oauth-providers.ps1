# Test OAuth Providers
# This script helps test OAuth provider configuration for the AIDE Control Panel

param(
    [switch]$Google = $false,
    [switch]$GitHub = $false,
    [string]$Environment = "development",
    [switch]$All = $false
)

Write-Host "=== AIDE Control Panel - OAuth Testing Script ===" -ForegroundColor Cyan
Write-Host ""

# Set the environment file path
$envFile = ".env.$Environment"
if ($Environment -eq "production") {
    $envFile = ".env.production"
} elseif ($Environment -eq "development") {
    $envFile = ".env.development"
}

if ($All) {
    $Google = $true
    $GitHub = $true
}

Write-Host "Testing OAuth for environment: $Environment" -ForegroundColor Yellow
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

# Verify OAuth providers configuration
function Test-GoogleOAuth {
    Write-Host "Testing Google OAuth Provider..." -ForegroundColor Cyan

    $googleClientId = $envContent["NEXT_PUBLIC_GOOGLE_CLIENT_ID"]
    $googleClientSecret = $envContent["GOOGLE_CLIENT_SECRET"]

    if ([string]::IsNullOrEmpty($googleClientId)) {
        Write-Host "❌ NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured" -ForegroundColor Red
        return $false
    }

    if ([string]::IsNullOrEmpty($googleClientSecret)) {
        Write-Host "❌ GOOGLE_CLIENT_SECRET is not configured" -ForegroundColor Red
        return $false
    }

    Write-Host "✅ Google OAuth credentials are configured" -ForegroundColor Green

    # Verify Google OAuth format
    if ($googleClientId -match '^[0-9]+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com$') {
        Write-Host "✅ Google Client ID format is valid" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Google Client ID format might be invalid (should end with .apps.googleusercontent.com)" -ForegroundColor Yellow
    }

    # Test OAuth redirect URI
    $callbackUrl = "$($envContent["NEXTAUTH_URL"])/auth/callback"
    Write-Host "Testing callback URL: $callbackUrl"

    try {
        $request = [System.Net.WebRequest]::Create($callbackUrl)
        $request.Method = "HEAD"
        $response = $request.GetResponse()

        if ($response.StatusCode -eq "OK") {
            Write-Host "✅ Callback endpoint is accessible" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Callback endpoint returned status: $($response.StatusCode)" -ForegroundColor Yellow
        }
        $response.Close()
    } catch {
        Write-Host "❌ Callback endpoint is not accessible: $_" -ForegroundColor Red
    }

    Write-Host ""
    return $true
}

function Test-GitHubOAuth {
    Write-Host "Testing GitHub OAuth Provider..." -ForegroundColor Cyan

    $githubClientId = $envContent["NEXT_PUBLIC_GITHUB_CLIENT_ID"]
    $githubClientSecret = $envContent["GITHUB_CLIENT_SECRET"]

    if ([string]::IsNullOrEmpty($githubClientId)) {
        Write-Host "❌ NEXT_PUBLIC_GITHUB_CLIENT_ID is not configured" -ForegroundColor Red
        return $false
    }

    if ([string]::IsNullOrEmpty($githubClientSecret)) {
        Write-Host "❌ GITHUB_CLIENT_SECRET is not configured" -ForegroundColor Red
        return $false
    }

    Write-Host "✅ GitHub OAuth credentials are configured" -ForegroundColor Green

    # Verify GitHub OAuth format
    if ($githubClientId -match '^[a-f0-9]{20}$') {
        Write-Host "✅ GitHub Client ID format is valid" -ForegroundColor Green
    } else {
        Write-Host "⚠️ GitHub Client ID format might be invalid (should be 20 character hex string)" -ForegroundColor Yellow
    }

    # Test OAuth redirect URI
    $callbackUrl = "$($envContent["NEXTAUTH_URL"])/auth/callback"
    Write-Host "Testing callback URL: $callbackUrl"

    try {
        $request = [System.Net.WebRequest]::Create($callbackUrl)
        $request.Method = "HEAD"
        $response = $request.GetResponse()

        if ($response.StatusCode -eq "OK") {
            Write-Host "✅ Callback endpoint is accessible" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Callback endpoint returned status: $($response.StatusCode)" -ForegroundColor Yellow
        }
        $response.Close()
    } catch {
        Write-Host "❌ Callback endpoint is not accessible: $_" -ForegroundColor Red
    }

    Write-Host ""
    return $true
}

# Verify NextAuth URL configuration
$nextauthUrl = $envContent["NEXTAUTH_URL"]
if ([string]::IsNullOrEmpty($nextauthUrl)) {
    Write-Host "❌ NEXTAUTH_URL is not configured" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ NEXTAUTH_URL is configured: $nextauthUrl" -ForegroundColor Green
    Write-Host ""
}

# Test selected OAuth providers
$allPassed = $true

if ($Google) {
    if (-not (Test-GoogleOAuth)) {
        $allPassed = $false
    }
}

if ($GitHub) {
    if (-not (Test-GitHubOAuth)) {
        $allPassed = $false
    }
}

if (-not ($Google -or $GitHub)) {
    Write-Host "No OAuth providers selected for testing." -ForegroundColor Yellow
    Write-Host "Use -Google, -GitHub, or -All to test specific providers." -ForegroundColor Yellow
    Write-Host ""
} else {
    # Summary
    Write-Host "=== OAuth Testing Summary ===" -ForegroundColor Cyan
    if ($allPassed) {
        Write-Host "All tested OAuth providers are properly configured." -ForegroundColor Green
    } else {
        Write-Host "Some OAuth providers have configuration issues." -ForegroundColor Red
    }
    Write-Host ""
}

# Provide next steps
Write-Host "=== Next Steps ===" -ForegroundColor Green
Write-Host ""
Write-Host "1. Configure OAuth providers in Firebase Console:" -ForegroundColor White
Write-Host "   - Go to Firebase Console > Authentication > Sign-in method" -ForegroundColor Gray
Write-Host "   - Enable Google and GitHub providers" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test OAuth flow:" -ForegroundColor White
Write-Host "   - Start your development server: npm run dev" -ForegroundColor Gray
Write-Host "   - Navigate to http://localhost:3000/login" -ForegroundColor Gray
Write-Host "   - Test the OAuth sign-in buttons" -ForegroundColor Gray
Write-Host ""
Write-Host "See docs/OAUTH_SETUP.md for complete setup instructions." -ForegroundColor Cyan
