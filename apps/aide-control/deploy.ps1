# Codai AIDE Control - Production Deployment Script (PowerShell)
# This script deploys the AIDE Control service to the Codai ecosystem

param(
    [string]$Command = "deploy",
    [string]$ImageTag = "latest"
)

# Configuration
$ServiceName = "codai-aide-control"
$ImageName = "codai/aide-control"
$ComposeFile = "docker-compose.production.yml"

# Logging functions
function Write-Info {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check prerequisites
function Test-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    # Check if Docker is installed and running
    try {
        docker info | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Docker daemon is not running"
        }
    }
    catch {
        Write-Error "Docker is not installed or not running"
        exit 1
    }
    
    # Check if Docker Compose is available
    try {
        docker-compose version | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Docker Compose is not available"
        }
    }
    catch {
        Write-Error "Docker Compose is not installed"
        exit 1
    }
    
    # Check if environment file exists
    if (-not (Test-Path ".env.production")) {
        Write-Error "Production environment file (.env.production) not found"
        Write-Info "Please create .env.production based on .env.production.template"
        exit 1
    }
    
    Write-Success "Prerequisites check passed"
}

# Build the Docker image
function Build-Image {
    Write-Info "Building Docker image..."
    
    # Build the image with build args for better caching
    docker build `
        --build-arg BUILDKIT_INLINE_CACHE=1 `
        --target runner `
        -t "$ImageName`:$ImageTag" `
        -t "$ImageName`:latest" `
        .
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Docker image built successfully"
    } else {
        Write-Error "Failed to build Docker image"
        exit 1
    }
}

# Run health checks
function Test-Health {
    Write-Info "Running health checks..."
    
    $maxAttempts = 30
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method Get -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Success "Health check passed"
                return $true
            }
        }
        catch {
            Write-Info "Attempt $attempt/$maxAttempts`: Waiting for service to be ready..."
            Start-Sleep -Seconds 2
            $attempt++
        }
    }
    
    Write-Error "Health check failed after $maxAttempts attempts"
    return $false
}

# Deploy the service
function Deploy-Service {
    Write-Info "Deploying $ServiceName..."
    
    # Stop existing containers if any
    $containers = docker-compose -f $ComposeFile ps -q
    if ($containers) {
        Write-Info "Stopping existing containers..."
        docker-compose -f $ComposeFile down
    }
    
    # Start the new deployment
    Write-Info "Starting new deployment..."
    docker-compose -f $ComposeFile up -d
    
    # Check if deployment was successful
    $runningContainers = docker-compose -f $ComposeFile ps | Select-String "Up"
    if ($runningContainers) {
        Write-Success "Deployment completed successfully"
    } else {
        Write-Error "Deployment failed"
        exit 1
    }
}

# Rollback to previous version
function Rollback-Service {
    Write-Warning "Rolling back to previous version..."
    
    # Get the previous image
    $images = docker images $ImageName --format "table {{.Tag}}" | Select-Object -Skip 1
    $previousImage = $images | Select-Object -First 1
    
    if (-not $previousImage) {
        Write-Error "No previous image found for rollback"
        exit 1
    }
    
    Write-Info "Rolling back to $ImageName`:$previousImage"
    
    # Update the image tag and redeploy
    $script:ImageTag = $previousImage
    Deploy-Service
    
    Write-Success "Rollback completed"
}

# Cleanup old images
function Clean-Images {
    Write-Info "Cleaning up old Docker images..."
    
    # Remove dangling images
    docker image prune -f
    
    # Keep only the last 3 versions of the service image
    $images = docker images $ImageName --format "{{.Tag}}" | Select-Object -Skip 3
    foreach ($tag in $images) {
        try {
            docker rmi "$ImageName`:$tag" 2>$null
        }
        catch {
            # Ignore errors for images that might be in use
        }
    }
    
    Write-Success "Cleanup completed"
}

# Show service status
function Show-Status {
    Write-Info "Service status:"
    docker-compose -f $ComposeFile ps
    
    Write-Info "Recent logs:"
    docker-compose -f $ComposeFile logs --tail=20
}

# Show help
function Show-Help {
    Write-Host "Codai AIDE Control - Deployment Script (PowerShell)"
    Write-Host ""
    Write-Host "Usage: .\deploy.ps1 [-Command <command>] [-ImageTag <tag>]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  deploy     Build and deploy the service (default)"
    Write-Host "  rollback   Rollback to the previous version"
    Write-Host "  status     Show service status and logs"
    Write-Host "  cleanup    Clean up old Docker images"
    Write-Host "  help       Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\deploy.ps1 -Command deploy -ImageTag v1.2.3"
    Write-Host "  .\deploy.ps1 -Command rollback"
    Write-Host "  .\deploy.ps1 -Command status"
}

# Main execution
switch ($Command.ToLower()) {
    "deploy" {
        Test-Prerequisites
        Build-Image
        Deploy-Service
        if (Test-Health) {
            Write-Success "🚀 Codai AIDE Control deployed successfully!"
        } else {
            Write-Error "Deployment health check failed"
            exit 1
        }
    }
    "rollback" {
        Test-Prerequisites
        Rollback-Service
        if (Test-Health) {
            Write-Success "🔄 Rollback completed successfully!"
        } else {
            Write-Error "Rollback health check failed"
            exit 1
        }
    }
    "status" {
        Show-Status
    }
    "cleanup" {
        Clean-Images
    }
    "help" {
        Show-Help
    }
    default {
        Write-Error "Unknown command: $Command"
        Show-Help
        exit 1
    }
}
