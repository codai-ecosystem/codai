#!/bin/bash

# Codai AIDE Control - Production Deployment Script
# This script deploys the AIDE Control service to the Codai ecosystem

set -e  # Exit on any error

# Configuration
SERVICE_NAME="codai-aide-control"
IMAGE_NAME="codai/aide-control"
IMAGE_TAG="${1:-latest}"
COMPOSE_FILE="docker-compose.production.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    # Check if environment file exists
    if [[ ! -f ".env.production" ]]; then
        log_error "Production environment file (.env.production) not found"
        log_info "Please create .env.production based on .env.production.template"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Build the Docker image
build_image() {
    log_info "Building Docker image..."
    
    # Build the image with build args for better caching
    docker build \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --target runner \
        -t "$IMAGE_NAME:$IMAGE_TAG" \
        -t "$IMAGE_NAME:latest" \
        .
    
    log_success "Docker image built successfully"
}

# Run health checks
health_check() {
    log_info "Running health checks..."
    
    # Wait for the service to be ready
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s http://localhost:3000/api/health > /dev/null; then
            log_success "Health check passed"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts: Waiting for service to be ready..."
        sleep 2
        ((attempt++))
    done
    
    log_error "Health check failed after $max_attempts attempts"
    return 1
}

# Deploy the service
deploy() {
    log_info "Deploying $SERVICE_NAME..."
    
    # Load environment variables
    export $(cat .env.production | xargs)
    
    # Stop existing containers if any
    if docker-compose -f "$COMPOSE_FILE" ps -q | grep -q .; then
        log_info "Stopping existing containers..."
        docker-compose -f "$COMPOSE_FILE" down
    fi
    
    # Start the new deployment
    log_info "Starting new deployment..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # Check if deployment was successful
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log_success "Deployment completed successfully"
    else
        log_error "Deployment failed"
        exit 1
    fi
}

# Rollback to previous version
rollback() {
    log_warning "Rolling back to previous version..."
    
    # Get the previous image
    local previous_image=$(docker images "$IMAGE_NAME" --format "table {{.Tag}}" | sed -n '2p')
    
    if [[ -z "$previous_image" ]]; then
        log_error "No previous image found for rollback"
        exit 1
    fi
    
    log_info "Rolling back to $IMAGE_NAME:$previous_image"
    
    # Update the image tag and redeploy
    export IMAGE_TAG="$previous_image"
    deploy
    
    log_success "Rollback completed"
}

# Cleanup old images
cleanup() {
    log_info "Cleaning up old Docker images..."
    
    # Remove dangling images
    docker image prune -f
    
    # Keep only the last 3 versions of the service image
    docker images "$IMAGE_NAME" --format "{{.Tag}}" | tail -n +4 | xargs -r docker rmi "$IMAGE_NAME:" 2>/dev/null || true
    
    log_success "Cleanup completed"
}

# Show service status
status() {
    log_info "Service status:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    log_info "Recent logs:"
    docker-compose -f "$COMPOSE_FILE" logs --tail=20
}

# Show help
show_help() {
    echo "Codai AIDE Control - Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND] [IMAGE_TAG]"
    echo ""
    echo "Commands:"
    echo "  deploy     Build and deploy the service (default)"
    echo "  rollback   Rollback to the previous version"
    echo "  status     Show service status and logs"
    echo "  cleanup    Clean up old Docker images"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy v1.2.3"
    echo "  $0 rollback"
    echo "  $0 status"
}

# Main execution
main() {
    local command="${1:-deploy}"
    
    case "$command" in
        "deploy")
            check_prerequisites
            build_image
            deploy
            health_check
            log_success "🚀 Codai AIDE Control deployed successfully!"
            ;;
        "rollback")
            check_prerequisites
            rollback
            health_check
            log_success "🔄 Rollback completed successfully!"
            ;;
        "status")
            status
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
