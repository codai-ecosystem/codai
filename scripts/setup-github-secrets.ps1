# AIDE Landing Page - GitHub Secrets Setup Script
# This script helps set up GitHub secrets for automatic Vercel deployment

$ErrorActionPreference = "Stop"

Write-Host "🔐 Setting up GitHub secrets for AIDE Landing Page deployment" -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Green

# Check if GitHub CLI is installed
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI not found. Please install GitHub CLI first:" -ForegroundColor Red
    Write-Host "   https://cli.github.com/" -ForegroundColor White
    Write-Host "   Or use the GitHub web interface to set up secrets manually" -ForegroundColor White
    exit 1
} else {
    Write-Host "✅ GitHub CLI found" -ForegroundColor Green
}

# Check if user is authenticated
gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "🔑 Please authenticate with GitHub first:" -ForegroundColor Yellow
    gh auth login
}

Write-Host ""
Write-Host "📋 Required Secrets for Automatic Deployment:" -ForegroundColor Yellow
Write-Host "=============================================="
Write-Host "1. VERCEL_TOKEN - Your Vercel API token" -ForegroundColor White
Write-Host "2. VERCEL_ORG_ID - Your Vercel organization/team ID" -ForegroundColor White
Write-Host "3. VERCEL_PROJECT_ID - Your Vercel project ID" -ForegroundColor White
Write-Host ""

# Get Vercel project information
Write-Host "📡 Getting Vercel project information..." -ForegroundColor Cyan
if (Test-Path ".vercel/project.json") {
    $projectJson = Get-Content ".vercel/project.json" | ConvertFrom-Json
    $ProjectId = $projectJson.projectId
    $OrgId = $projectJson.orgId

    Write-Host "✅ Found Vercel project configuration:" -ForegroundColor Green
    Write-Host "   Project ID: $ProjectId" -ForegroundColor White
    Write-Host "   Organization ID: $OrgId" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ Vercel project not linked. Please run 'vercel link' first." -ForegroundColor Red
    exit 1
}

# Function to set a GitHub secret
function Set-GitHubSecret {
    param(
        [string]$SecretName,
        [string]$SecretValue,
        [string]$Description
    )

    if ([string]::IsNullOrEmpty($SecretValue)) {
        Write-Host "⚠️  Skipping $SecretName (empty value)" -ForegroundColor Yellow
        return
    }

    Write-Host "Setting $SecretName..." -ForegroundColor Cyan
    $SecretValue | gh secret set $SecretName

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $SecretName set successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to set $SecretName" -ForegroundColor Red
    }
}

# Set project information secrets
Write-Host "🔧 Setting up Vercel project secrets..." -ForegroundColor Cyan
Set-GitHubSecret -SecretName "VERCEL_PROJECT_ID" -SecretValue $ProjectId -Description "Vercel project ID"
Set-GitHubSecret -SecretName "VERCEL_ORG_ID" -SecretValue $OrgId -Description "Vercel organization ID"

# Prompt for Vercel token
Write-Host ""
Write-Host "🔑 Please provide your Vercel API token:" -ForegroundColor Yellow
Write-Host "   1. Go to https://vercel.com/account/tokens" -ForegroundColor White
Write-Host "   2. Create a new token with deployment permissions" -ForegroundColor White
Write-Host "   3. Copy the token and paste it here" -ForegroundColor White
Write-Host ""
$VercelToken = Read-Host "Vercel Token" -AsSecureString
$VercelTokenPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($VercelToken))

if (-not [string]::IsNullOrEmpty($VercelTokenPlain)) {
    Set-GitHubSecret -SecretName "VERCEL_TOKEN" -SecretValue $VercelTokenPlain -Description "Vercel API token for deployments"
} else {
    Write-Host "⚠️  No Vercel token provided. You'll need to set this manually." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 GitHub secrets setup complete!" -ForegroundColor Green
Write-Host "================================="
Write-Host ""
Write-Host "✅ Configured secrets:" -ForegroundColor Green
Write-Host "   - VERCEL_PROJECT_ID" -ForegroundColor White
Write-Host "   - VERCEL_ORG_ID" -ForegroundColor White
Write-Host "   - VERCEL_TOKEN" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Your automatic deployment workflow is now ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Create and push preview and dev branches:" -ForegroundColor White
Write-Host "   git checkout -b preview && git push origin preview" -ForegroundColor Gray
Write-Host "   git checkout -b dev && git push origin dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configure custom domains in Vercel dashboard:" -ForegroundColor White
Write-Host "   - Production: aide.dev" -ForegroundColor White
Write-Host "   - Preview: preview.aide.dev" -ForegroundColor White
Write-Host "   - Development: dev.aide.dev" -ForegroundColor White
Write-Host ""
Write-Host "3. Test deployment by pushing to any branch" -ForegroundColor White
