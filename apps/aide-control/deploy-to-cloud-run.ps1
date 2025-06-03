#!/usr/bin/env pwsh
# Deploy AIDE Control Panel to Google Cloud Run with proper secret management

param(
    [string]$ProjectId = "",
    [string]$Region = "us-central1",
    [string]$ServiceName = "aide-control"
)

# Configuration
if ([string]::IsNullOrEmpty($ProjectId)) {
    $ProjectId = gcloud config get-value project
}

$Image = "gcr.io/$ProjectId/$ServiceName"

Write-Host "Deploying AIDE Control Panel to Google Cloud Run" -ForegroundColor Green
Write-Host "Project ID: $ProjectId"
Write-Host "Region: $Region"
Write-Host "Service: $ServiceName"
Write-Host "Image: $Image"
Write-Host ""

# Check if required secret files exist
$requiredSecrets = @(
    ".env.production",
    ".env.secrets"
)

foreach ($secretFile in $requiredSecrets) {
    if (-not (Test-Path $secretFile)) {
        Write-Warning "$secretFile not found. This file should contain your sensitive environment variables."
        Write-Host "Create this file with format:"
        Write-Host "FIREBASE_ADMIN_CREDENTIALS=<base64-encoded-service-account>"
        Write-Host "STRIPE_SECRET_KEY=<your-stripe-secret>"
        Write-Host "STRIPE_WEBHOOK_SECRET=<your-webhook-secret>"
        Write-Host ""

        $continue = Read-Host "Continue without $secretFile ? (y/n)"
        if ($continue -ne "y") {
            exit 1
        }
    }
}

# Create or update secrets in Google Secret Manager
Write-Host "Managing secrets in Google Secret Manager..." -ForegroundColor Yellow

if (Test-Path ".env.secrets") {
    $secrets = Get-Content ".env.secrets" | Where-Object { $_ -notmatch "^#" -and $_ -match "=" }

    foreach ($line in $secrets) {
        $parts = $line -split "=", 2
        if ($parts.Length -eq 2) {
            $secretName = $parts[0].ToLower().Replace("_", "-")
            $secretValue = $parts[1]
              Write-Host "Updating secret: $secretName"

            # Check if secret exists and update/create accordingly
            $secretCheckResult = gcloud secrets describe $secretName --project=$ProjectId 2>$null

            if ($LASTEXITCODE -eq 0) {
                # Update existing secret
                Write-Output $secretValue | gcloud secrets versions add $secretName --data-file=- --project=$ProjectId
            } else {
                # Create new secret
                Write-Output $secretValue | gcloud secrets create $secretName --data-file=- --project=$ProjectId
            }
        }
    }
}

# Build and push the Docker image
Write-Host "Building Docker image..." -ForegroundColor Yellow

# Change to root directory for workspace build
$originalDir = Get-Location
Set-Location "../.."

docker build -f Dockerfile.aide-control -t "$Image`:latest" -t "$Image`:$(git rev-parse --short HEAD)" .

# Return to original directory
Set-Location $originalDir

if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker build failed"
    exit 1
}

Write-Host "Pushing image to Google Container Registry..." -ForegroundColor Yellow
gcloud auth configure-docker --quiet
docker push "$Image`:latest"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker push failed"
    exit 1
}

# Deploy to Cloud Run using gcloud run deploy
Write-Host "Deploying to Cloud Run..." -ForegroundColor Yellow

# Collect all environment variables (PORT is automatically set by Cloud Run)
$allEnvVars = @("NODE_ENV=production", "NEXT_TELEMETRY_DISABLED=1", "ALLOW_TEST_USERS=true")

# Add public environment variables from .env.production
if (Test-Path ".env.production") {
    $publicEnvVars = Get-Content ".env.production" | Where-Object {
        $_ -notmatch "^#" -and $_ -match "^NEXT_PUBLIC_" -and $_ -match "="
    }
    $allEnvVars += $publicEnvVars
}

$deployArgs = @(
    "run", "deploy", $ServiceName,
    "--image", "$Image`:latest",
    "--region", $Region,
    "--platform", "managed",
    "--allow-unauthenticated",
    "--port", "8080",
    "--memory", "2Gi",
    "--cpu", "1",
    "--max-instances", "10",
    "--min-instances", "1",
    "--concurrency", "80",
    "--timeout", "300"
)

# Add environment variables if any exist
if ($allEnvVars.Length -gt 0) {
    $deployArgs += "--set-env-vars"
    $deployArgs += ($allEnvVars -join ",")
}

# Add secrets if they exist
$secretMappings = @(
    "firebase-admin-credentials=FIREBASE_ADMIN_CREDENTIALS",
    "stripe-secret=STRIPE_SECRET_KEY",
    "stripe-webhook-secret=STRIPE_WEBHOOK_SECRET",
    "openai-api-key=OPENAI_API_KEY",
    "azure-openai-key=AZURE_OPENAI_API_KEY",
    "azure-openai-endpoint=AZURE_OPENAI_ENDPOINT",
    "anthropic-api-key=ANTHROPIC_API_KEY",
    "nextauth-secret=NEXTAUTH_SECRET",
    "github-app-id=GITHUB_APP_ID",
    "github-app-private-key=GITHUB_APP_PRIVATE_KEY",
    "github-client-id=GITHUB_CLIENT_ID",
    "github-client-secret=GITHUB_CLIENT_SECRET",
    "github-webhook-secret=GITHUB_WEBHOOK_SECRET"
)

$secretArgs = @()
foreach ($mapping in $secretMappings) {
    $parts = $mapping -split "="
    $secretName = $parts[0]
    $envVar = $parts[1]

    # Check if secret exists
    $secretExists = gcloud secrets describe $secretName --project=$ProjectId 2>$null
    if ($LASTEXITCODE -eq 0) {
        $secretArgs += "$envVar=$secretName`:latest"
    }
}

if ($secretArgs.Length -gt 0) {
    $deployArgs += "--set-secrets"
    $deployArgs += ($secretArgs -join ",")
}

# Execute deployment
& gcloud @deployArgs

if ($LASTEXITCODE -ne 0) {
    Write-Error "Cloud Run deployment failed"
    exit 1
}

# Get the service URL
$serviceUrl = gcloud run services describe $ServiceName --region=$Region --format="value(status.url)" 2>$null

Write-Host ""
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "Service URL: $serviceUrl"
Write-Host "Health check: $serviceUrl/api/health"
Write-Host ""

# Test the health endpoint
Write-Host "Testing health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$serviceUrl/api/health" -Method Get -TimeoutSec 30
    Write-Host "Health check successful:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 2)
} catch {
    Write-Warning "Health check failed: $($_.Exception.Message)"
    Write-Host "This might be normal if the service is still starting up."
}

Write-Host ""
Write-Host "Deployment logs can be viewed with:"
Write-Host "gcloud logs tail --service=$ServiceName --region=$Region" -ForegroundColor Cyan
