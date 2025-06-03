#!/bin/bash

# AIDE Landing Page - GitHub Secrets Setup Script
# This script helps set up GitHub secrets for automatic Vercel deployment

set -e

echo "🔐 Setting up GitHub secrets for AIDE Landing Page deployment"
echo "============================================================="

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found. Please install GitHub CLI first:"
    echo "   https://cli.github.com/"
    echo "   Or use the GitHub web interface to set up secrets manually"
    exit 1
else
    echo "✅ GitHub CLI found"
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "🔑 Please authenticate with GitHub first:"
    gh auth login
fi

echo ""
echo "📋 Required Secrets for Automatic Deployment:"
echo "=============================================="
echo "1. VERCEL_TOKEN - Your Vercel API token"
echo "2. VERCEL_ORG_ID - Your Vercel organization/team ID"
echo "3. VERCEL_PROJECT_ID - Your Vercel project ID"
echo ""

# Get Vercel project information
echo "📡 Getting Vercel project information..."
if [ -f ".vercel/project.json" ]; then
    PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
    ORG_ID=$(cat .vercel/project.json | grep -o '"orgId":"[^"]*' | cut -d'"' -f4)

    echo "✅ Found Vercel project configuration:"
    echo "   Project ID: $PROJECT_ID"
    echo "   Organization ID: $ORG_ID"
    echo ""
else
    echo "❌ Vercel project not linked. Please run 'vercel link' first."
    exit 1
fi

# Function to set a GitHub secret
set_github_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3

    if [ -z "$secret_value" ]; then
        echo "⚠️  Skipping $secret_name (empty value)"
        return
    fi

    echo "Setting $secret_name..."
    echo "$secret_value" | gh secret set "$secret_name" --body "$(cat)"

    if [ $? -eq 0 ]; then
        echo "✅ $secret_name set successfully"
    else
        echo "❌ Failed to set $secret_name"
    fi
}

# Set project information secrets
echo "🔧 Setting up Vercel project secrets..."
set_github_secret "VERCEL_PROJECT_ID" "$PROJECT_ID" "Vercel project ID"
set_github_secret "VERCEL_ORG_ID" "$ORG_ID" "Vercel organization ID"

# Prompt for Vercel token
echo ""
echo "🔑 Please provide your Vercel API token:"
echo "   1. Go to https://vercel.com/account/tokens"
echo "   2. Create a new token with deployment permissions"
echo "   3. Copy the token and paste it here"
echo ""
read -s -p "Vercel Token: " VERCEL_TOKEN
echo ""

if [ -n "$VERCEL_TOKEN" ]; then
    set_github_secret "VERCEL_TOKEN" "$VERCEL_TOKEN" "Vercel API token for deployments"
else
    echo "⚠️  No Vercel token provided. You'll need to set this manually."
fi

echo ""
echo "🎉 GitHub secrets setup complete!"
echo "================================="
echo ""
echo "✅ Configured secrets:"
echo "   - VERCEL_PROJECT_ID"
echo "   - VERCEL_ORG_ID"
echo "   - VERCEL_TOKEN"
echo ""
echo "🚀 Your automatic deployment workflow is now ready!"
echo ""
echo "📋 Next steps:"
echo "1. Create and push preview and dev branches:"
echo "   git checkout -b preview && git push origin preview"
echo "   git checkout -b dev && git push origin dev"
echo ""
echo "2. Configure custom domains in Vercel dashboard:"
echo "   - Production: aide.dev"
echo "   - Preview: preview.aide.dev"
echo "   - Development: dev.aide.dev"
echo ""
echo "3. Test deployment by pushing to any branch"
