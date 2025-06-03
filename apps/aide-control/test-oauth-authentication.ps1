#!/usr/bin/env pwsh
# Test OAuth Authentication Flow
# This script helps test the complete OAuth authentication flow

param(
    [switch]$Google = $false,
    [switch]$GitHub = $false,
    [switch]$All = $false,
    [switch]$Verify = $false
)

Write-Host "=== AIDE Control Panel - OAuth Authentication Testing ===" -ForegroundColor Cyan
Write-Host ""

if ($All) {
    $Google = $true
    $GitHub = $true
}

if (-not $Google -and -not $GitHub) {
    Write-Host "Please specify at least one provider to test:" -ForegroundColor Yellow
    Write-Host "  -Google: Test Google OAuth authentication" -ForegroundColor Yellow
    Write-Host "  -GitHub: Test GitHub OAuth authentication" -ForegroundColor Yellow
    Write-Host "  -All: Test both providers" -ForegroundColor Yellow
    Write-Host "  -Verify: Only verify configuration, don't launch browser" -ForegroundColor Yellow
    exit 1
}

# Check if required environment variables are set
$envFile = ".env.development"
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

# Verify environment variables
function Test-Environment {
    $isValid = $true

    # Check NEXTAUTH_URL
    if ([string]::IsNullOrEmpty($envContent["NEXTAUTH_URL"])) {
        Write-Host "❌ NEXTAUTH_URL is not configured" -ForegroundColor Red
        $isValid = $false
    } else {
        Write-Host "✅ NEXTAUTH_URL is set to: $($envContent["NEXTAUTH_URL"])" -ForegroundColor Green
    }

    # Verify Firebase config
    if ([string]::IsNullOrEmpty($envContent["NEXT_PUBLIC_FIREBASE_API_KEY"])) {
        Write-Host "❌ NEXT_PUBLIC_FIREBASE_API_KEY is not configured" -ForegroundColor Red
        $isValid = $false
    } else {
        Write-Host "✅ Firebase API Key is configured" -ForegroundColor Green
    }

    # Verify Firebase Admin credentials
    if ([string]::IsNullOrEmpty($envContent["FIREBASE_ADMIN_CREDENTIALS"])) {
        Write-Host "⚠️ FIREBASE_ADMIN_CREDENTIALS is not set - OAuth server-side authentication might fail" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Firebase Admin credentials are configured" -ForegroundColor Green
    }

    return $isValid
}

# Verify Google OAuth configuration
function Test-GoogleOAuth {
    if (-not $Google) {
        return $true
    }

    $isValid = $true
    Write-Host ""
    Write-Host "Verifying Google OAuth Configuration:" -ForegroundColor Cyan

    if ([string]::IsNullOrEmpty($envContent["NEXT_PUBLIC_GOOGLE_CLIENT_ID"])) {
        Write-Host "❌ NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured" -ForegroundColor Red
        $isValid = $false
    } else {
        Write-Host "✅ Google Client ID is configured" -ForegroundColor Green
    }

    if ([string]::IsNullOrEmpty($envContent["GOOGLE_CLIENT_SECRET"])) {
        Write-Host "❌ GOOGLE_CLIENT_SECRET is not configured" -ForegroundColor Red
        $isValid = $false
    } else {
        Write-Host "✅ Google Client Secret is configured" -ForegroundColor Green
    }

    return $isValid
}

# Verify GitHub OAuth configuration
function Test-GitHubOAuth {
    if (-not $GitHub) {
        return $true
    }

    $isValid = $true
    Write-Host ""
    Write-Host "Verifying GitHub OAuth Configuration:" -ForegroundColor Cyan

    if ([string]::IsNullOrEmpty($envContent["NEXT_PUBLIC_GITHUB_CLIENT_ID"])) {
        Write-Host "❌ NEXT_PUBLIC_GITHUB_CLIENT_ID is not configured" -ForegroundColor Red
        $isValid = $false
    } else {
        Write-Host "✅ GitHub Client ID is configured" -ForegroundColor Green
    }

    if ([string]::IsNullOrEmpty($envContent["GITHUB_CLIENT_SECRET"])) {
        Write-Host "❌ GITHUB_CLIENT_SECRET is not configured" -ForegroundColor Red
        $isValid = $false
    } else {
        Write-Host "✅ GitHub Client Secret is configured" -ForegroundColor Green
    }

    return $isValid
}

# Test OAuth Authentication Flow
function Test-OAuthFlow {
    param (
        [string]$Provider
    )

    Write-Host ""
    Write-Host "Testing $Provider OAuth Authentication Flow:" -ForegroundColor Cyan

    $baseUrl = $envContent["NEXTAUTH_URL"]
    if ([string]::IsNullOrEmpty($baseUrl)) {
        $baseUrl = "http://localhost:3000"
    }

    $url = "$baseUrl/api/auth/oauth?provider=$($Provider.ToLower())"
    Write-Host "Opening OAuth initialization URL: $url" -ForegroundColor Yellow
    Start-Process $url

    Write-Host ""
    Write-Host "Follow the browser instructions to complete authentication." -ForegroundColor Yellow
    Write-Host "After successful authentication, you should be redirected to the dashboard." -ForegroundColor Yellow
}

# Main execution
$envValid = Test-Environment
$googleValid = Test-GoogleOAuth
$githubValid = Test-GitHubOAuth

if (-not $envValid -or (-not $googleValid -and $Google) -or (-not $githubValid -and $GitHub)) {
    Write-Host ""
    Write-Host "❌ Configuration verification failed. Please fix the issues before testing." -ForegroundColor Red
    exit 1
}

if ($Verify) {
    Write-Host ""
    Write-Host "✅ Configuration verification completed successfully." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "Configuration verification completed successfully." -ForegroundColor Green
Write-Host ""

# Check if dev server is running
$devServerRunning = $false
try {
    $testUrl = $envContent["NEXTAUTH_URL"]
    if ([string]::IsNullOrEmpty($testUrl)) {
        $testUrl = "http://localhost:3000"
    }

    $request = [System.Net.WebRequest]::Create("$testUrl/api/health")
    $request.Method = "HEAD"
    $request.Timeout = 5000
    $response = $request.GetResponse()
    $devServerRunning = $true
    $response.Close()
} catch {
    $devServerRunning = $false
}

if (-not $devServerRunning) {
    Write-Host "Development server is not running. Starting it now..." -ForegroundColor Yellow
    Write-Host "Please wait for the server to start..." -ForegroundColor Yellow

    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow

    # Wait for server to start
    Write-Host "Waiting for development server to start" -ForegroundColor Yellow
    $maxAttempts = 30
    $attempts = 0
    $serverStarted = $false

    while (-not $serverStarted -and $attempts -lt $maxAttempts) {
        $attempts++
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2

        try {
            $request = [System.Net.WebRequest]::Create("$testUrl/api/health")
            $request.Method = "HEAD"
            $request.Timeout = 1000
            $response = $request.GetResponse()
            $serverStarted = $true
            $response.Close()
        } catch {
            $serverStarted = $false
        }
    }

    Write-Host ""

    if (-not $serverStarted) {
        Write-Host "Failed to start development server after $maxAttempts attempts." -ForegroundColor Red
        Write-Host "Please start the development server manually and try again." -ForegroundColor Yellow
        exit 1
    }

    Write-Host "Development server started successfully." -ForegroundColor Green
}

# Test OAuth flows
if ($Google) {
    Test-OAuthFlow -Provider "Google"
}

if ($GitHub) {
    Test-OAuthFlow -Provider "GitHub"
}

Write-Host ""
Write-Host "OAuth authentication test initiated. Check the browser for the authentication flow." -ForegroundColor Green
