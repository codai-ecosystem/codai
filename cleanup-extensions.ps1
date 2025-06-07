# Extension Cleanup Script for codai.ro
# This script removes unnecessary extensions while keeping essential development tools

Write-Host "Starting codai.ro Extension Cleanup..." -ForegroundColor Green

# Essential extensions to keep (12 extensions)
$keepExtensions = @(
    "aide-core",
    "copilot", 
    "github",
    "json-language-features",
    "markdown-language-features", 
    "yaml",
    "html-language-features",
    "css-language-features", 
    "npm",
    "simple-browser",
    "docker",
    "theme-defaults"
)

# Get all extension directories
$extensionsPath = "e:\GitHub\AIDE\extensions"
$allExtensions = Get-ChildItem -Path $extensionsPath -Directory | Where-Object { $_.Name -notin @(".npmrc", "cgmanifest.json", "package.json", "package-lock.json", "postinstall.mjs", "esbuild-webview-common.js", "mangle-loader.js", "shared.webpack.config.js", "tsconfig.base.json", "types") }

# Extensions to remove
$removeExtensions = $allExtensions | Where-Object { $_.Name -notin $keepExtensions }

Write-Host "Extensions to keep: $($keepExtensions.Count)" -ForegroundColor Green
Write-Host "Extensions to remove: $($removeExtensions.Count)" -ForegroundColor Yellow

# List extensions that will be removed
Write-Host "`nExtensions to be removed:" -ForegroundColor Yellow
foreach ($ext in $removeExtensions) {
    Write-Host "  - $($ext.Name)"
}

# Ask for confirmation
$confirmation = Read-Host "`nDo you want to proceed with removing these extensions? (y/N)"
if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
    
    Write-Host "`nRemoving extensions..." -ForegroundColor Red
    
    foreach ($ext in $removeExtensions) {
        try {
            Write-Host "Removing: $($ext.Name)" -ForegroundColor Yellow
            Remove-Item -Path $ext.FullName -Recurse -Force
            Write-Host "  ✓ Removed successfully" -ForegroundColor Green
        }
        catch {
            Write-Host "  ✗ Failed to remove: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host "`nCleanup completed!" -ForegroundColor Green
    Write-Host "Kept $($keepExtensions.Count) essential extensions:" -ForegroundColor Green
    foreach ($ext in $keepExtensions) {
        if (Test-Path "$extensionsPath\$ext") {
            Write-Host "  ✓ $ext" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ $ext (not found)" -ForegroundColor Yellow
        }
    }
    
} else {
    Write-Host "Extension cleanup cancelled." -ForegroundColor Yellow
}

Write-Host "`nDone!" -ForegroundColor Green
