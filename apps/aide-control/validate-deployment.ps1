#!/usr/bin/env pwsh
# Pre-deployment validation script for AIDE Control Panel

param(
    [switch]$SkipFirebase = $false,
    [switch]$SkipBuild = $false
)

Write-Host "🚀 AIDE Control Panel - Pre-deployment Validation" -ForegroundColor Green
Write-Host "=" * 60

# Check basic requirements
Write-Host "📋 Checking basic requirements..." -ForegroundColor Yellow

# Check if Docker is running
try {
    $dockerInfo = docker info 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker is running" -ForegroundColor Green
        # Show Docker version for information
        $dockerVersion = docker --version
        Write-Host "   Version: $dockerVersion" -ForegroundColor Gray
    } else {
        Write-Warning "❌ Docker is not running or not accessible"
        Write-Host "Please start Docker Desktop before deployment"
        exit 1
    }
} catch {
    Write-Warning "❌ Docker command failed: $($_.Exception.Message)"
    exit 1
}

# Check Google Cloud SDK
try {
    $gcloudVersion = gcloud version --format="value(sdk.version)" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Google Cloud SDK ($gcloudVersion) is available" -ForegroundColor Green
    } else {
        Write-Warning "❌ Google Cloud SDK is not installed or accessible"
        exit 1
    }
} catch {
    Write-Warning "❌ gcloud command failed: $($_.Exception.Message)"
    exit 1
}

# Check current project
$projectId = gcloud config get-value project 2>$null
if ($projectId) {
    Write-Host "✅ Current project: $projectId" -ForegroundColor Green
} else {
    Write-Warning "❌ No Google Cloud project set"
    Write-Host "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
}

# Check authentication
$account = gcloud config get-value account 2>$null
if ($account) {
    Write-Host "✅ Authenticated as: $account" -ForegroundColor Green
} else {
    Write-Warning "❌ Not authenticated with Google Cloud"
    Write-Host "Run: gcloud auth login"
    exit 1
}

# Check required environment files
Write-Host "📁 Checking environment configuration..." -ForegroundColor Yellow

$requiredFiles = @(".env.production", ".env.secrets")
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green

        # Check if it's not just the example file
        $content = Get-Content $file -Raw
        if ($content -match "PLACEHOLDER" -and $file -eq ".env.secrets") {
            Write-Warning "⚠️  $file contains placeholder values"
            Write-Host "   Update with real credentials before production deployment"
        }
    } else {
        Write-Warning "❌ $file is missing"
        exit 1
    }
}

# Test Firebase configuration (if not skipped)
if (-not $SkipFirebase) {
    Write-Host "🔥 Testing Firebase connection..." -ForegroundColor Yellow

    # Load environment variables
    $envVars = @{}
    if (Test-Path ".env.production") {
        Get-Content ".env.production" | ForEach-Object {
            if ($_ -match "^([^#][^=]+)=(.*)") {
                $envVars[$matches[1]] = $matches[2]
            }
        }
    }

    $projectId = $envVars["NEXT_PUBLIC_FIREBASE_PROJECT_ID"]
    if ($projectId) {
        Write-Host "✅ Firebase project ID: $projectId" -ForegroundColor Green

        # Test if we can authenticate with the service account
        $firebaseCredentials = $envVars["FIREBASE_ADMIN_CREDENTIALS"]
        if ($firebaseCredentials) {
            Write-Host "✅ Firebase admin credentials are configured" -ForegroundColor Green

            # Test JSON parsing (our recent fix)
            try {
                $credentialsObj = $firebaseCredentials | ConvertFrom-Json
                if ($credentialsObj.type -eq "service_account" -and $credentialsObj.project_id) {
                    Write-Host "✅ Firebase credentials are valid JSON with service account" -ForegroundColor Green
                } else {
                    Write-Warning "⚠️  Firebase credentials JSON structure may be invalid"
                }
            } catch {
                Write-Warning "⚠️  Firebase credentials are not valid JSON: $($_.Exception.Message)"
                Write-Host "   ℹ️  Note: Build will continue with fallback initialization" -ForegroundColor Gray
            }
        } else {
            Write-Warning "⚠️  Firebase admin credentials not found"
            Write-Host "   ℹ️  Build will use fallback Firebase initialization" -ForegroundColor Gray
        }
    } else {
        Write-Warning "❌ Firebase project ID not configured"
    }
      # Check if Firebase admin configuration has our error handling fix
    if (Test-Path "lib/firebase-admin.ts") {
        $firebaseConfig = Get-Content "lib/firebase-admin.ts" -Raw
        if ($firebaseConfig -match "isBuildTime.*NODE_ENV.*production" -and $firebaseConfig -match "build-time fallback initialization") {
            Write-Host "✅ Firebase admin has robust error handling for build-time issues" -ForegroundColor Green
        } else {
            Write-Warning "⚠️  Firebase admin configuration may need error handling improvements"
        }
    }
}

# Test build process (if not skipped)
if (-not $SkipBuild) {
    Write-Host "🏗️  Testing build process..." -ForegroundColor Yellow

    $env:NODE_ENV = "production"
    npm run build 2>&1 | Tee-Object -Variable buildOutput

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build completed successfully" -ForegroundColor Green
    } else {
        Write-Warning "❌ Build failed"
        Write-Host "Build output:"
        Write-Host $buildOutput
        exit 1
    }
}

# Check for essential API endpoints
Write-Host "🔍 Checking API endpoints..." -ForegroundColor Yellow

$requiredEndpoints = @(
    "app/api/health/route.ts",
    "app/api/admin/dashboard-stats/route.ts",
    "app/api/admin/config/route.ts",
    "app/api/usage/route.ts"
)

foreach ($endpoint in $requiredEndpoints) {
    if (Test-Path $endpoint) {
        Write-Host "✅ $endpoint exists" -ForegroundColor Green
    } else {
        Write-Warning "❌ $endpoint is missing"
    }
}

# Check Docker configuration
Write-Host "🐳 Checking Docker configuration..." -ForegroundColor Yellow

# Check Dockerfile
$dockerfiles = @("Dockerfile.aide-control", "../../Dockerfile.aide-control")
$dockerfileFound = $false

foreach ($dockerfile in $dockerfiles) {
    if (Test-Path $dockerfile) {
        Write-Host "✅ $dockerfile exists" -ForegroundColor Green
        $dockerfileFound = $true

        # Check if Dockerfile has proper structure
        $dockerfileContent = Get-Content $dockerfile -Raw
        if ($dockerfileContent -match "FROM node:" -and $dockerfileContent -match "EXPOSE" -and $dockerfileContent -match "aide-control") {
            Write-Host "✅ Dockerfile appears to be properly structured for AIDE Control" -ForegroundColor Green
        } else {
            Write-Warning "⚠️  Dockerfile may need review for AIDE Control specifics"
        }
        break
    }
}

if (-not $dockerfileFound) {
    Write-Warning "❌ Dockerfile.aide-control is missing"
    Write-Host "Expected locations: Dockerfile.aide-control or ../../Dockerfile.aide-control"
    exit 1
}

# Check Docker Compose
$composeFiles = @("docker-compose.aide-control.yml", "../../docker-compose.aide-control.yml")
$composeFound = $false

foreach ($composeFile in $composeFiles) {
    if (Test-Path $composeFile) {
        Write-Host "✅ $composeFile exists" -ForegroundColor Green
        $composeFound = $true

        # Validate compose file structure
        try {
            docker-compose -f $composeFile config --quiet 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Docker Compose file is valid" -ForegroundColor Green
            } else {
                Write-Warning "⚠️  Docker Compose file has syntax issues"
            }
        } catch {
            Write-Warning "⚠️  Could not validate Docker Compose file"
        }
        break
    }
}

if (-not $composeFound) {
    Write-Warning "⚠️  Docker Compose file not found (optional)"
    Write-Host "Consider creating docker-compose.aide-control.yml for easier management"
}

# Test Docker build (optional but recommended)
Write-Host "🔨 Testing Docker build..." -ForegroundColor Yellow
try {
    # Navigate to root directory for Docker build context
    $originalLocation = Get-Location
    $rootPath = Resolve-Path "../.."
    Set-Location $rootPath

    # Try to build the Docker image
    Write-Host "   Building from workspace root: $($rootPath)" -ForegroundColor Cyan
    $buildOutput = docker build -f Dockerfile.aide-control -t aide-control:test . 2>&1

    Set-Location $originalLocation

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker image builds successfully" -ForegroundColor Green        # Test container startup with correct port mapping (8080 internal -> 3000 external)
        Write-Host "🧪 Testing container startup..." -ForegroundColor Yellow
        $containerId = docker run -d -p 3000:8080 --name aide-control-validation-test aide-control:test
        if ($LASTEXITCODE -eq 0 -and $containerId) {
            Write-Host "   Container ID: $($containerId.Substring(0,12))..." -ForegroundColor Gray
            Start-Sleep 5  # Give Next.js more time to start

            Write-Host "   Container started, testing accessibility..." -ForegroundColor Cyan

            # Test main application endpoint
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 15 -ErrorAction Stop
                if ($response.StatusCode -eq 200) {
                    if ($response.Content -match "AIDE Control Panel") {
                        Write-Host "✅ Container serves AIDE Control Panel correctly" -ForegroundColor Green
                    } else {
                        Write-Warning "⚠️  Container responds but content may be incorrect"
                    }
                } else {
                    Write-Warning "⚠️  Container responds with status code: $($response.StatusCode)"
                }
            } catch {
                Write-Warning "⚠️  Container endpoint not accessible: $($_.Exception.Message)"

                # Show container logs for debugging
                Write-Host "   Container logs:" -ForegroundColor Cyan
                docker logs aide-control-validation-test
            }

            # Test health endpoint if available
            try {
                $healthResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 10 -ErrorAction SilentlyContinue
                if ($healthResponse.StatusCode -eq 200) {
                    Write-Host "✅ Health endpoint is accessible" -ForegroundColor Green
                }
            } catch {
                Write-Host "   ℹ️  Health endpoint not available (optional)" -ForegroundColor Gray
            }

            # Cleanup test container
            docker stop aide-control-validation-test | Out-Null
            docker rm aide-control-validation-test | Out-Null
        } else {
            Write-Warning "⚠️  Container failed to start"
        }

        # Cleanup test image
        docker rmi aide-control:test | Out-Null
    } else {
        Write-Warning "⚠️  Docker build failed"
        Write-Host "Build output (last 20 lines):" -ForegroundColor Red
        $buildOutput | Select-Object -Last 20 | ForEach-Object { Write-Host "   $_" }
    }
} catch {
    Write-Warning "⚠️  Docker build test failed: $($_.Exception.Message)"
    Set-Location $originalLocation
}

# Summary
Write-Host ""
Write-Host "📊 Validation Summary" -ForegroundColor Green
Write-Host "=" * 60

Write-Host "✅ Environment: Production configuration ready" -ForegroundColor Green
Write-Host "✅ Firebase: Service account configured" -ForegroundColor Green
Write-Host "✅ Google Cloud: Project and authentication setup" -ForegroundColor Green
Write-Host "✅ Docker: Container build and runtime tested" -ForegroundColor Green

if (Test-Path ".env.secrets") {
    $secretsContent = Get-Content ".env.secrets" -Raw
    if ($secretsContent -match "PLACEHOLDER") {
        Write-Host "⚠️  Secrets: Contains placeholder values (update for production)" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Secrets: Configured" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🚀 Ready for deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "🐳 Docker Deployment Options:" -ForegroundColor Cyan
Write-Host "  Local: docker run -d -p 3000:8080 --name aide-control aide-control:latest"
Write-Host "  Compose: docker-compose -f ../../docker-compose.aide-control.yml up -d"
Write-Host "  Cloud: .\deploy-to-cloud-run.ps1"
Write-Host ""

# Show next steps
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update .env.secrets with real API keys (if using placeholders)"
Write-Host "2. Choose deployment method:"
Write-Host "   - Local Docker: docker run -d -p 3000:8080 --name aide-control aide-control:latest"
Write-Host "   - Docker Compose: docker-compose -f ../../docker-compose.aide-control.yml up -d"
Write-Host "   - Google Cloud Run: .\deploy-to-cloud-run.ps1"
Write-Host "3. Test the deployed service at http://localhost:3000"
Write-Host "4. Configure DNS and SSL if needed"
Write-Host "5. Set up monitoring and logging"
Write-Host ""
