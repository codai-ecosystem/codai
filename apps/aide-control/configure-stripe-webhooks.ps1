# Configure Stripe Webhooks for AIDE Control Panel
# This script helps you set up Stripe webhooks for the deployed service

Write-Host "🔧 Stripe Webhook Configuration Helper" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

$serviceUrl = "https://aide-control-xh6fsul3qq-ew.a.run.app"
$webhookEndpoint = "$serviceUrl/api/billing/webhook"

Write-Host ""
Write-Host "📍 Service Information:" -ForegroundColor Yellow
Write-Host "   Service URL: $serviceUrl" -ForegroundColor White
Write-Host "   Webhook Endpoint: $webhookEndpoint" -ForegroundColor White
Write-Host ""

# Get the current webhook secret from Secret Manager
Write-Host "🔑 Retrieving webhook secret from Secret Manager..." -ForegroundColor Yellow
try {
    $webhookSecret = gcloud secrets versions access latest --secret="stripe-webhook-secret" --format="value(payload.data)" | ForEach-Object { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }
    Write-Host "   ✅ Webhook secret retrieved successfully" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to retrieve webhook secret" -ForegroundColor Red
    Write-Host "   Please ensure you have access to Secret Manager" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎯 Required Stripe Webhook Events:" -ForegroundColor Yellow
$requiredEvents = @(
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "payment_intent.canceled",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.payment_succeeded",
    "invoice.payment_failed",
    "checkout.session.completed"
)

foreach ($event in $requiredEvents) {
    Write-Host "   • $event" -ForegroundColor White
}

Write-Host ""
Write-Host "📋 Manual Configuration Steps:" -ForegroundColor Yellow
Write-Host "1. Log into your Stripe Dashboard (https://dashboard.stripe.com)" -ForegroundColor White
Write-Host "2. Navigate to Developers → Webhooks" -ForegroundColor White
Write-Host "3. Click 'Add endpoint'" -ForegroundColor White
Write-Host "4. Enter the endpoint URL: $webhookEndpoint" -ForegroundColor Cyan
Write-Host "5. Select the required events listed above" -ForegroundColor White
Write-Host "6. Use the webhook secret from Secret Manager (already configured)" -ForegroundColor White
Write-Host ""

Write-Host "🧪 Test the webhook endpoint:" -ForegroundColor Yellow
Write-Host "   Test URL: $webhookEndpoint" -ForegroundColor Cyan
Write-Host "   Expected: HTTP 200 response for valid Stripe webhook calls" -ForegroundColor White
Write-Host ""

# Test if the webhook endpoint is accessible
Write-Host "🔍 Testing webhook endpoint accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $webhookEndpoint -Method GET -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 405) {
        Write-Host "   ✅ Endpoint is accessible (405 Method Not Allowed is expected for GET)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Unexpected response: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq "MethodNotAllowed") {
        Write-Host "   ✅ Endpoint is accessible (405 Method Not Allowed is expected for GET)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Endpoint may not be accessible: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔗 Useful Links:" -ForegroundColor Yellow
Write-Host "   • Stripe Dashboard: https://dashboard.stripe.com/webhooks" -ForegroundColor Cyan
Write-Host "   • Stripe Webhook Testing: https://dashboard.stripe.com/test/webhooks" -ForegroundColor Cyan
Write-Host "   • Webhook Events Documentation: https://stripe.com/docs/api/events/types" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Configuration helper complete!" -ForegroundColor Green
Write-Host "After configuring webhooks in Stripe, test them using the Stripe dashboard." -ForegroundColor White
