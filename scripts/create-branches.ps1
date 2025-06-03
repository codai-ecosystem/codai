# AIDE Landing Page - Create Multi-Environment Branches
# This script creates and pushes the preview and dev branches

$ErrorActionPreference = "Stop"

Write-Host "🌿 Creating multi-environment branches for AIDE Landing Page" -ForegroundColor Green
Write-Host "============================================================"

# Get current branch
$CurrentBranch = git branch --show-current
Write-Host "Current branch: $CurrentBranch" -ForegroundColor White

# Ensure we're on main
if ($CurrentBranch -ne "main") {
    Write-Host "⚠️  Warning: Not on main branch. Switching to main..." -ForegroundColor Yellow
    git checkout main
}

# Ensure main is up to date
Write-Host "📥 Updating main branch..." -ForegroundColor Cyan
git pull origin main

# Create and push preview branch
Write-Host "🔄 Creating preview branch..." -ForegroundColor Cyan
git show-ref --verify --quiet refs/heads/preview 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Preview branch already exists locally" -ForegroundColor Green
    git checkout preview
    git merge main
} else {
    Write-Host "   📝 Creating new preview branch" -ForegroundColor Yellow
    git checkout -b preview
}

Write-Host "📤 Pushing preview branch..." -ForegroundColor Cyan
git push origin preview

# Create and push dev branch
Write-Host "🔄 Creating dev branch..." -ForegroundColor Cyan
git checkout main
git show-ref --verify --quiet refs/heads/dev 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Dev branch already exists locally" -ForegroundColor Green
    git checkout dev
    git merge main
} else {
    Write-Host "   📝 Creating new dev branch" -ForegroundColor Yellow
    git checkout -b dev
}

Write-Host "📤 Pushing dev branch..." -ForegroundColor Cyan
git push origin dev

# Return to original branch
Write-Host "🔄 Returning to $CurrentBranch..." -ForegroundColor Cyan
git checkout $CurrentBranch

Write-Host ""
Write-Host "🎉 Multi-environment branches created successfully!" -ForegroundColor Green
Write-Host "=================================================="
Write-Host ""
Write-Host "✅ Created branches:" -ForegroundColor Green
Write-Host "   - preview (for preview.aide.dev)" -ForegroundColor White
Write-Host "   - dev (for dev.aide.dev)" -ForegroundColor White
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Set up Vercel environments: .\scripts\setup-multi-env.ps1" -ForegroundColor White
Write-Host "2. Configure GitHub secrets: .\scripts\setup-github-secrets.ps1" -ForegroundColor White
Write-Host "3. Configure custom domains in Vercel dashboard" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Your multi-environment setup is ready for deployment!" -ForegroundColor Green
