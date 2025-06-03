#!/usr/bin/env pwsh
# Final comprehensive test of AIDE Control Panel deployment

param(
    [string]$ServiceUrl = "https://aide-control-xh6fsul3qq-uc.a.run.app"
)

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "AIDE CONTROL PANEL - FINAL DEPLOYMENT TEST" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "Service URL: $ServiceUrl"
Write-Host "Test Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""

# Test results collection
$testResults = @()

function Test-Endpoint {
    param(
        [string]$Path,
        [string]$Method = "GET",
        [string]$Description,
        [string]$ExpectedStatus = "200"
    )

    $url = "$ServiceUrl$Path"
    try {
        $response = curl -s -o $null -w '%{http_code}' $url
        $success = $response -eq $ExpectedStatus
        $status = switch ($response) {
            "200" { "✓ OK" }
            "401" { "🔒 Requires Auth (Expected)" }
            "404" { "❌ Not Found" }
            "405" { "⚠️ Method Not Allowed (Expected for webhooks)" }
            default { "Status: $response" }
        }

        $testResults += @{
            Path = $Path
            Method = $Method
            Description = $Description
            ActualStatus = $response
            ExpectedStatus = $ExpectedStatus
            Status = $status
            Success = ($response -eq $ExpectedStatus -or ($ExpectedStatus -eq "401" -and $response -eq "401") -or ($ExpectedStatus -eq "405" -and $response -eq "405"))
        }

        Write-Host ("{0,-30} {1,-8} {2,-40} {3}" -f $Path, $Method, $Description, $status)
    }
    catch {
        Write-Host ("{0,-30} {1,-8} {2,-40} ❌ Network Error" -f $Path, $Method, $Description) -ForegroundColor Red
        $testResults += @{
            Path = $Path
            Method = $Method
            Description = $Description
            Status = "❌ Network Error"
            Success = $false
        }
    }
}

Write-Host "1. CORE INFRASTRUCTURE TESTS" -ForegroundColor Yellow
Write-Host "-----------------------------"
Test-Endpoint -Path "/api/health" -Description "Health check endpoint" -ExpectedStatus "200"
Test-Endpoint -Path "/" -Description "Main application" -ExpectedStatus "200"

Write-Host ""
Write-Host "2. AUTHENTICATION & USER MANAGEMENT" -ForegroundColor Yellow
Write-Host "-----------------------------------"
Test-Endpoint -Path "/api/users" -Description "User management API" -ExpectedStatus "401"
Test-Endpoint -Path "/api/admin" -Description "Admin functions" -ExpectedStatus "401"

Write-Host ""
Write-Host "3. BILLING & SUBSCRIPTION MANAGEMENT" -ForegroundColor Yellow
Write-Host "------------------------------------"
Test-Endpoint -Path "/api/billing" -Description "Billing information" -ExpectedStatus "401"
Test-Endpoint -Path "/api/billing/plans" -Description "Billing plans" -ExpectedStatus "401"
Test-Endpoint -Path "/api/billing/checkout" -Description "Checkout sessions" -ExpectedStatus "401"
Test-Endpoint -Path "/api/billing/portal" -Description "Customer portal" -ExpectedStatus "401"

Write-Host ""
Write-Host "4. WEBHOOK INTEGRATION" -ForegroundColor Yellow
Write-Host "---------------------"
Test-Endpoint -Path "/api/webhooks/stripe" -Description "Stripe webhook handler" -ExpectedStatus "405"

Write-Host ""
Write-Host "5. SERVICE MANAGEMENT" -ForegroundColor Yellow
Write-Host "--------------------"
Test-Endpoint -Path "/api/services" -Description "Service management" -ExpectedStatus "401"
Test-Endpoint -Path "/api/projects" -Description "Project management" -ExpectedStatus "401"
Test-Endpoint -Path "/api/api-keys" -Description "API key management" -ExpectedStatus "401"

Write-Host ""
Write-Host "6. MONITORING & METRICS" -ForegroundColor Yellow
Write-Host "----------------------"
Test-Endpoint -Path "/api/usage" -Description "Usage metrics" -ExpectedStatus "401"
Test-Endpoint -Path "/api/quota" -Description "Quota information" -ExpectedStatus "401"

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT SUMMARY" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Cyan

$totalTests = $testResults.Count
$successfulTests = ($testResults | Where-Object { $_.Success }).Count
$successRate = [math]::Round(($successfulTests / $totalTests) * 100, 2)

Write-Host "Total Tests: $totalTests"
Write-Host "Successful: $successfulTests"
Write-Host "Success Rate: $successRate%"
Write-Host ""

if ($successRate -ge 90) {
    Write-Host "🎉 DEPLOYMENT STATUS: SUCCESS" -ForegroundColor Green
    Write-Host "The AIDE Control Panel has been successfully deployed and is ready for use!" -ForegroundColor Green
} elseif ($successRate -ge 70) {
    Write-Host "⚠️ DEPLOYMENT STATUS: PARTIAL SUCCESS" -ForegroundColor Yellow
    Write-Host "Most endpoints are working, but some issues need attention." -ForegroundColor Yellow
} else {
    Write-Host "❌ DEPLOYMENT STATUS: NEEDS ATTENTION" -ForegroundColor Red
    Write-Host "Multiple endpoints are not responding correctly." -ForegroundColor Red
}

Write-Host ""
Write-Host "IMPORTANT CONFIGURATION UPDATES NEEDED:" -ForegroundColor Magenta
Write-Host "---------------------------------------"
Write-Host "1. Update Stripe webhook URL to:" -ForegroundColor White
Write-Host "   https://aide-control-xh6fsul3qq-uc.a.run.app/api/webhooks/stripe" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Update any client applications to use the new service URL:" -ForegroundColor White
Write-Host "   $ServiceUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Configure Firebase Authentication OAuth redirect URLs:" -ForegroundColor White
Write-Host "   $ServiceUrl/api/auth/callback/google" -ForegroundColor Cyan
Write-Host "   $ServiceUrl/api/auth/callback/github" -ForegroundColor Cyan
Write-Host ""

Write-Host "NEXT STEPS:" -ForegroundColor Magenta
Write-Host "----------"
Write-Host "1. Update Stripe webhook configuration"
Write-Host "2. Test authentication flows through the web interface"
Write-Host "3. Test subscription management functionality"
Write-Host "4. Verify all environment variables are correctly configured"
Write-Host "5. Monitor application logs for any runtime errors"
Write-Host ""

Write-Host "View deployment logs with:"
Write-Host "gcloud logs tail --service=aide-control --region=us-central1" -ForegroundColor Gray
Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
