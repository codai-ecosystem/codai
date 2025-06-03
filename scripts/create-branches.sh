#!/bin/bash

# AIDE Landing Page - Create Multi-Environment Branches
# This script creates and pushes the preview and dev branches

set -e

echo "🌿 Creating multi-environment branches for AIDE Landing Page"
echo "============================================================"

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

# Ensure we're on main
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  Warning: Not on main branch. Switching to main..."
    git checkout main
fi

# Ensure main is up to date
echo "📥 Updating main branch..."
git pull origin main

# Create and push preview branch
echo "🔄 Creating preview branch..."
if git show-ref --verify --quiet refs/heads/preview; then
    echo "   ✅ Preview branch already exists locally"
    git checkout preview
    git merge main
else
    echo "   📝 Creating new preview branch"
    git checkout -b preview
fi

echo "📤 Pushing preview branch..."
git push origin preview

# Create and push dev branch
echo "🔄 Creating dev branch..."
git checkout main
if git show-ref --verify --quiet refs/heads/dev; then
    echo "   ✅ Dev branch already exists locally"
    git checkout dev
    git merge main
else
    echo "   📝 Creating new dev branch"
    git checkout -b dev
fi

echo "📤 Pushing dev branch..."
git push origin dev

# Return to original branch
echo "🔄 Returning to $CURRENT_BRANCH..."
git checkout $CURRENT_BRANCH

echo ""
echo "🎉 Multi-environment branches created successfully!"
echo "=================================================="
echo ""
echo "✅ Created branches:"
echo "   - preview (for preview.aide.dev)"
echo "   - dev (for dev.aide.dev)"
echo ""
echo "📋 Next steps:"
echo "1. Set up Vercel environments: ./scripts/setup-multi-env.sh"
echo "2. Configure GitHub secrets: ./scripts/setup-github-secrets.sh"
echo "3. Configure custom domains in Vercel dashboard"
echo ""
echo "🚀 Your multi-environment setup is ready for deployment!"
