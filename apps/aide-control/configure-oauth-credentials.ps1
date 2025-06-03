#!/usr/bin/env pwsh
# Configure OAuth Credentials for AIDE Control Panel
# This script helps set up OAuth credentials for Google and GitHub

param(
    [string]$GoogleClientId = "",
    [string]$GoogleClientSecret = "",
    [string]$GitHubClientId = "",
    [string]$GitHubClientSecret = "",
    [string]$Environment = "development",
    [switch]$Force = $false
)

Write-Host "=== AIDE Control Panel - OAuth Credentials Configuration ===" -ForegroundColor Cyan
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

# Check if environment file exists
if (-not (Test-Path $envFile)) {
    Write-Host "Error: Environment file not found: $envFile" -ForegroundColor Red

    $createFile = Read-Host "Create environment file? (y/n)"
    if ($createFile -ne "y") {
        exit 1
    }

    # Create environment file with template
    @"
# $Environment Environment for AIDE Control Panel

# Firebase Configuration (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Auth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Application Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
"@ | Out-File $envFile -Encoding utf8

    Write-Host "Created new environment file: $envFile" -ForegroundColor Green
}

# Read environment file
$envContent = Get-Content $envFile -Raw

# Interactive mode if no parameters provided
if ([string]::IsNullOrEmpty($GoogleClientId) -and [string]::IsNullOrEmpty($GoogleClientSecret) -and
    [string]::IsNullOrEmpty($GitHubClientId) -and [string]::IsNullOrEmpty($GitHubClientSecret)) {

    Write-Host "Enter OAuth credentials (leave empty to skip):" -ForegroundColor Yellow

    # Extract existing values
    if ($envContent -match 'NEXT_PUBLIC_GOOGLE_CLIENT_ID=(.*)') {
        $existingGoogleClientId = $matches[1].Trim()
        if ($existingGoogleClientId -ne "") {
            Write-Host "Current Google Client ID: $existingGoogleClientId" -ForegroundColor Gray
        }
    }

    $GoogleClientId = Read-Host "Google Client ID"

    if ($envContent -match 'GOOGLE_CLIENT_SECRET=(.*)') {
        $existingGoogleClientSecret = $matches[1].Trim()
        if ($existingGoogleClientSecret -ne "") {
            Write-Host "Current Google Client Secret: $existingGoogleClientSecret" -ForegroundColor Gray
        }
    }

    $GoogleClientSecret = Read-Host "Google Client Secret"

    if ($envContent -match 'NEXT_PUBLIC_GITHUB_CLIENT_ID=(.*)') {
        $existingGitHubClientId = $matches[1].Trim()
        if ($existingGitHubClientId -ne "") {
            Write-Host "Current GitHub Client ID: $existingGitHubClientId" -ForegroundColor Gray
        }
    }

    $GitHubClientId = Read-Host "GitHub Client ID"

    if ($envContent -match 'GITHUB_CLIENT_SECRET=(.*)') {
        $existingGitHubClientSecret = $matches[1].Trim()
        if ($existingGitHubClientSecret -ne "") {
            Write-Host "Current GitHub Client Secret: $existingGitHubClientSecret" -ForegroundColor Gray
        }
    }

    $GitHubClientSecret = Read-Host "GitHub Client Secret"
}

# Update Google OAuth credentials
if (-not [string]::IsNullOrEmpty($GoogleClientId)) {
    if ($envContent -match 'NEXT_PUBLIC_GOOGLE_CLIENT_ID=.*') {
        $envContent = $envContent -replace 'NEXT_PUBLIC_GOOGLE_CLIENT_ID=.*', "NEXT_PUBLIC_GOOGLE_CLIENT_ID=$GoogleClientId"
    } else {
        $envContent += "`nNEXT_PUBLIC_GOOGLE_CLIENT_ID=$GoogleClientId"
    }
    Write-Host "Updated Google Client ID" -ForegroundColor Green
}

if (-not [string]::IsNullOrEmpty($GoogleClientSecret)) {
    if ($envContent -match 'GOOGLE_CLIENT_SECRET=.*') {
        $envContent = $envContent -replace 'GOOGLE_CLIENT_SECRET=.*', "GOOGLE_CLIENT_SECRET=$GoogleClientSecret"
    } else {
        $envContent += "`nGOOGLE_CLIENT_SECRET=$GoogleClientSecret"
    }
    Write-Host "Updated Google Client Secret" -ForegroundColor Green
}

# Update GitHub OAuth credentials
if (-not [string]::IsNullOrEmpty($GitHubClientId)) {
    if ($envContent -match 'NEXT_PUBLIC_GITHUB_CLIENT_ID=.*') {
        $envContent = $envContent -replace 'NEXT_PUBLIC_GITHUB_CLIENT_ID=.*', "NEXT_PUBLIC_GITHUB_CLIENT_ID=$GitHubClientId"
    } else {
        $envContent += "`nNEXT_PUBLIC_GITHUB_CLIENT_ID=$GitHubClientId"
    }
    Write-Host "Updated GitHub Client ID" -ForegroundColor Green
}

if (-not [string]::IsNullOrEmpty($GitHubClientSecret)) {
    if ($envContent -match 'GITHUB_CLIENT_SECRET=.*') {
        $envContent = $envContent -replace 'GITHUB_CLIENT_SECRET=.*', "GITHUB_CLIENT_SECRET=$GitHubClientSecret"
    } else {
        $envContent += "`nGITHUB_CLIENT_SECRET=$GitHubClientSecret"
    }
    Write-Host "Updated GitHub Client Secret" -ForegroundColor Green
}

# Ensure NEXTAUTH_URL is set
if (-not ($envContent -match 'NEXTAUTH_URL=.*')) {
    $defaultUrl = if ($Environment -eq "development") { "http://localhost:3000" } else { "https://control.yourdomain.com" }
    $envContent += "`nNEXTAUTH_URL=$defaultUrl"
    Write-Host "Added default NEXTAUTH_URL: $defaultUrl" -ForegroundColor Yellow
}

# Ensure NEXTAUTH_SECRET is set
if (-not ($envContent -match 'NEXTAUTH_SECRET=.*') -or ($envContent -match 'NEXTAUTH_SECRET=$' -and $Force)) {
    $randomSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

    if ($envContent -match 'NEXTAUTH_SECRET=.*') {
        $envContent = $envContent -replace 'NEXTAUTH_SECRET=.*', "NEXTAUTH_SECRET=$randomSecret"
    } else {
        $envContent += "`nNEXTAUTH_SECRET=$randomSecret"
    }
    Write-Host "Generated random NEXTAUTH_SECRET" -ForegroundColor Green
}

# Save updated content
$envContent | Out-File $envFile -Encoding utf8
Write-Host "Updated environment file: $envFile" -ForegroundColor Green
Write-Host ""

# Print next steps
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Configure Firebase Authentication to enable OAuth providers:" -ForegroundColor Yellow
Write-Host "   Run: ./update-firebase-oauth.ps1" -ForegroundColor Yellow
Write-Host "2. Test OAuth configuration:" -ForegroundColor Yellow
Write-Host "   Run: ./test-oauth-providers.ps1 -All" -ForegroundColor Yellow
Write-Host "3. Test authentication flow:" -ForegroundColor Yellow
Write-Host "   Run: ./test-oauth-authentication.ps1 -All" -ForegroundColor Yellow
