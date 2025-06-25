# AIDE Deployment Scripts

This directory contains scripts to help with deploying the AIDE Landing Page across multiple environments.

## 🚀 Quick Multi-Environment Setup

Run these scripts in order for a complete multi-environment deployment setup:

### 1. Create Branches

Create the required git branches for multi-environment deployment:

**Windows:**

```powershell
.\scripts\create-branches.ps1
```

**Linux/macOS:**

```bash
./scripts/create-branches.sh
```

### 2. Setup Vercel Environments

Configure environment variables for production, preview, and development:

**Windows:**

```powershell
.\scripts\setup-multi-env.ps1
```

**Linux/macOS:**

```bash
./scripts/setup-multi-env.sh
```

### 3. Setup GitHub Secrets

Configure GitHub repository secrets for automatic deployment:

**Windows:**

```powershell
.\scripts\setup-github-secrets.ps1
```

**Linux/macOS:**

```bash
./scripts/setup-github-secrets.sh
```

## 📋 Script Descriptions

### Branch Management

- **`create-branches.sh/.ps1`** - Creates and pushes `preview` and `dev` branches

### Vercel Configuration

- **`setup-multi-env.sh/.ps1`** - Sets up environment variables in Vercel for all environments
- **`setup-vercel-env.sh/.ps1`** - Legacy single-environment setup script

### GitHub Integration

- **`setup-github-secrets.sh/.ps1`** - Configures GitHub secrets for automatic deployment

### Stripe Setup

- **`setup-stripe.js`** - Creates Stripe products and prices (Node.js script)

### Legacy Deployment

- **`deploy-landing.sh/.bat`** - Manual deployment scripts (single environment)

## 🌍 Deployment Environments

| Environment     | Branch    | URL                | Script Coverage |
| --------------- | --------- | ------------------ | --------------- |
| **Production**  | `main`    | `aide.dev`         | ✅ All scripts  |
| **Preview**     | `preview` | `preview.aide.dev` | ✅ All scripts  |
| **Development** | `dev`     | `dev.aide.dev`     | ✅ All scripts  |

## 🔧 Prerequisites

Before running the scripts, ensure you have:

1. **Git** - For branch management
2. **Node.js & npm** - For package management
3. **Vercel CLI** - `npm install -g vercel`
4. **GitHub CLI** - For secrets management (optional)
5. **Vercel Account** - Linked to your project
6. **Stripe Account** - For payment processing

## 📚 Documentation

For detailed instructions, see:

- [MULTI_ENVIRONMENT_DEPLOYMENT.md](../MULTI_ENVIRONMENT_DEPLOYMENT.md) - Complete multi-environment guide
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Single environment deployment
- [Phase 2 Complete](../PHASE2-COMPLETE.md) - Project completion status

## 🚨 Important Notes

### Security

- **Never commit secrets** to version control
- **Use test Stripe keys** for preview/development environments
- **Rotate API tokens** regularly

### Environment Separation

- **Production**: Real Stripe keys, live data
- **Preview**: Test Stripe keys, staging data
- **Development**: Test Stripe keys, development data

### Script Execution

- Scripts are designed to be **idempotent** (safe to run multiple times)
- **Windows users**: Use PowerShell (.ps1) scripts
- **Linux/macOS users**: Use Bash (.sh) scripts

## 🐛 Troubleshooting

### Common Issues

1. **Permission denied**: Scripts might need execution permissions on Linux/macOS
2. **Vercel not linked**: Run `vercel link` first
3. **GitHub CLI not authenticated**: Run `gh auth login`
4. **Missing dependencies**: Install prerequisites listed above

### Getting Help

1. Check script output for error messages
2. Review the documentation files
3. Verify prerequisites are installed
4. Test with a single environment first

---

**Happy deploying! 🚀**
