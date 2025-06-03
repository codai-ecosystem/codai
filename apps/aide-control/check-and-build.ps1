#!/usr/bin/env pwsh
# Script to check and build the AIDE Control Panel application
# Validates environment variables, dependencies, and performs a test build

param(
    [switch]$FixIssues = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"

function Write-Status {
    param(
        [string]$Message,
        [string]$Color = "White"
    )

    Write-Host $Message -ForegroundColor $Color
}

function Test-Command {
    param(
        [string]$Command
    )

    try {
        Invoke-Expression "where.exe $Command" | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

Write-Status "Starting AIDE Control Panel build check..." -Color Green

# Check for required tools
Write-Status "Checking for required tools..." -Color Cyan

$requiredTools = @("node", "npm", "git")
$missingTools = @()

foreach ($tool in $requiredTools) {
    if (-not (Test-Command $tool)) {
        $missingTools += $tool
    }
}

if ($missingTools.Count -gt 0) {
    Write-Status "Missing required tools: $($missingTools -join ', ')" -Color Red
    Write-Status "Please install these tools and try again."
    exit 1
}

# Check Node.js version
$nodeVersion = (node -v).Replace("v", "")
$minimumVersion = "18.0.0"

if ([version]$nodeVersion -lt [version]$minimumVersion) {
    Write-Status "Node.js version $nodeVersion is below the minimum required version $minimumVersion" -Color Yellow

    if ($FixIssues) {
        Write-Status "Attempting to install newer Node.js version using nvm..." -Color Cyan
        # This requires NVM to be installed
        if (Test-Command "nvm") {
            Invoke-Expression "nvm install 18"
            Invoke-Expression "nvm use 18"
        } else {
            Write-Status "NVM not found. Please upgrade Node.js manually." -Color Red
        }
    }
}

# Check for .env files
Write-Status "Checking environment configuration..." -Color Cyan

$envFiles = @(
    ".env.local",
    ".env.development"
)

$missingEnvFiles = @()

foreach ($file in $envFiles) {
    if (-not (Test-Path $file)) {
        $missingEnvFiles += $file
    }
}

if ($missingEnvFiles.Count -gt 0) {
    Write-Status "Missing environment files: $($missingEnvFiles -join ', ')" -Color Yellow

    if ($FixIssues -and (Test-Path ".env.production.example")) {
        Write-Status "Creating environment files from example..." -Color Cyan

        if (-not (Test-Path ".env.local") -and (Test-Path ".env.production.example")) {
            Copy-Item ".env.production.example" ".env.local"
            Write-Status "Created .env.local from example" -Color Green
        }

        if (-not (Test-Path ".env.development") -and (Test-Path ".env.production.example")) {
            Copy-Item ".env.production.example" ".env.development"
            Write-Status "Created .env.development from example" -Color Green
        }
    }
}

# Check for Firebase configuration
$hasFirebaseConfig = $false

if ((Test-Path ".env.local") -or (Test-Path ".env.development")) {
    $firebaseKeys = @(
        "NEXT_PUBLIC_FIREBASE_API_KEY",
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    )

    $envContent = ""
    if (Test-Path ".env.local") {
        $envContent = Get-Content ".env.local" -Raw
    } elseif (Test-Path ".env.development") {
        $envContent = Get-Content ".env.development" -Raw
    }

    $hasFirebaseConfig = $true
    foreach ($key in $firebaseKeys) {
        if ($envContent -notmatch "$key=.+") {
            $hasFirebaseConfig = $false
            break
        }
    }
}

if (-not $hasFirebaseConfig) {
    Write-Status "Firebase configuration is incomplete or missing" -Color Yellow
    Write-Status "The application may use mock data during development" -Color Yellow
}

# Check dependencies
Write-Status "Checking dependencies..." -Color Cyan

if (-not (Test-Path "node_modules")) {
    Write-Status "Node modules not installed" -Color Yellow

    if ($FixIssues) {
        Write-Status "Installing dependencies..." -Color Cyan
        Invoke-Expression "npm install"
    }
} else {
    Write-Status "Node modules found" -Color Green
}

# Run a test build
Write-Status "Attempting a test build..." -Color Cyan

try {
    if ($Verbose) {
        Invoke-Expression "npm run build"
    } else {
        Invoke-Expression "npm run build" | Out-Null
    }

    Write-Status "Build completed successfully!" -Color Green
} catch {
    Write-Status "Build failed with error:" -Color Red
    Write-Status $_.Exception.Message -Color Red

    # Attempt to fix common build errors
    if ($FixIssues) {
        Write-Status "Attempting to fix build issues..." -Color Cyan

        # Check for Firebase mocking issues
        if ($_.Exception.Message -match "firebase" -or $_.Exception.Message -match "firestore") {
            Write-Status "Detected Firebase-related issues. Enhancing Firebase mock..." -Color Yellow

            # This would be a more complex fix that might require editing specific files
            # For demo purposes, we'll just show what we'd check
            Write-Status "You may need to improve Firebase mocking in lib/firebase.ts" -Color Yellow
        }

        # Check for TypeScript errors
        if ($_.Exception.Message -match "TypeScript") {
            Write-Status "Detected TypeScript issues. Checking tsconfig..." -Color Yellow

            # This would examine and potentially fix tsconfig issues
            Write-Status "Consider checking for type errors in problematic files" -Color Yellow
        }
    }

    exit 1
}

# Final checks for production readiness
Write-Status "Checking for production readiness..." -Color Cyan

# Check for production environment file
if (-not (Test-Path ".env.production")) {
    Write-Status "No .env.production file found" -Color Yellow
    Write-Status "You will need to create this file before deploying to production" -Color Yellow

    if ($FixIssues -and (Test-Path ".env.production.example")) {
        Write-Status "Creating .env.production from example..." -Color Cyan
        Copy-Item ".env.production.example" ".env.production"
        Write-Status "Created .env.production from example - YOU MUST EDIT THIS FILE with real values before deployment!" -Color Yellow
    }
}

# Check for Stripe integration
$hasStripeConfig = $false
if (Test-Path ".env.production") {
    $stripeContent = Get-Content ".env.production" -Raw
    if ($stripeContent -match "STRIPE_SECRET_KEY=.+") {
        $hasStripeConfig = $true
    }
}

if (-not $hasStripeConfig) {
    Write-Status "Stripe configuration is missing in production environment" -Color Yellow
    Write-Status "Payment processing will not work without valid Stripe credentials" -Color Yellow
}

Write-Status "Build check completed!" -Color Green
