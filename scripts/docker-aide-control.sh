#!/bin/bash

# AIDE Control Panel Docker Management Script
# This script provides easy commands for managing the AIDE Control Panel Docker container

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_COMPOSE_FILE="$SCRIPT_DIR/docker-compose.aide-control.yml"
DOCKERFILE="$SCRIPT_DIR/Dockerfile.aide-control"
IMAGE_NAME="aide-control"
CONTAINER_NAME="aide-control-panel"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_usage() {
    echo "AIDE Control Panel Docker Management"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build     Build the Docker image"
    echo "  start     Start the control panel container"
    echo "  stop      Stop the control panel container"
    echo "  restart   Restart the control panel container"
    echo "  logs      Show container logs"
    echo "  status    Show container status"
    echo "  clean     Remove container and image"
    echo "  dev       Start in development mode with live reload"
    echo "  health    Check container health"
    echo "  shell     Open shell in running container"
    echo ""
    echo "Examples:"
    echo "  $0 build && $0 start"
    echo "  $0 logs -f"
    echo "  $0 status"
}

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

check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
}

build_image() {
    log_info "Building AIDE Control Panel Docker image..."

    if [ ! -f "$DOCKERFILE" ]; then
        log_error "Dockerfile not found: $DOCKERFILE"
        exit 1
    fi

    docker build -f "$DOCKERFILE" -t "$IMAGE_NAME:latest" "$SCRIPT_DIR"
    log_success "Docker image built successfully"
}

start_container() {
    log_info "Starting AIDE Control Panel container..."

    if docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
        log_warning "Container $CONTAINER_NAME is already running"
        return 0
    fi

    if docker ps -aq -f name="$CONTAINER_NAME" | grep -q .; then
        log_info "Starting existing container..."
        docker start "$CONTAINER_NAME"
    else
        log_info "Creating and starting new container..."
        docker run -d \
            --name "$CONTAINER_NAME" \
            -p 8080:8080 \
            -e NODE_ENV=production \
            -e NEXT_TELEMETRY_DISABLED=1 \
            --restart unless-stopped \
            "$IMAGE_NAME:latest"
    fi

    log_success "Container started successfully"
    log_info "AIDE Control Panel is available at: http://localhost:8080"
}

stop_container() {
    log_info "Stopping AIDE Control Panel container..."

    if docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
        docker stop "$CONTAINER_NAME"
        log_success "Container stopped successfully"
    else
        log_warning "Container $CONTAINER_NAME is not running"
    fi
}

restart_container() {
    stop_container
    start_container
}

show_logs() {
    local follow_flag=""
    if [[ "$1" == "-f" ]] || [[ "$1" == "--follow" ]]; then
        follow_flag="-f"
    fi

    if docker ps -aq -f name="$CONTAINER_NAME" | grep -q .; then
        docker logs $follow_flag "$CONTAINER_NAME"
    else
        log_error "Container $CONTAINER_NAME does not exist"
        exit 1
    fi
}

show_status() {
    log_info "AIDE Control Panel Status:"
    echo ""

    if docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
        log_success "Container is running"
        docker ps --filter name="$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""

        # Check if the service is responding
        if curl -s -f http://localhost:8080 > /dev/null 2>&1; then
            log_success "Service is responding on http://localhost:8080"
        else
            log_warning "Service is not responding on http://localhost:8080"
        fi
    elif docker ps -aq -f name="$CONTAINER_NAME" | grep -q .; then
        log_warning "Container exists but is not running"
        docker ps -a --filter name="$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}"
    else
        log_warning "Container does not exist"
    fi

    echo ""

    # Show image info
    if docker images -q "$IMAGE_NAME" | grep -q .; then
        log_info "Docker image information:"
        docker images --filter reference="$IMAGE_NAME" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    else
        log_warning "Docker image $IMAGE_NAME not found"
    fi
}

clean_all() {
    log_info "Cleaning up AIDE Control Panel resources..."

    # Stop and remove container
    if docker ps -aq -f name="$CONTAINER_NAME" | grep -q .; then
        docker stop "$CONTAINER_NAME" 2>/dev/null || true
        docker rm "$CONTAINER_NAME"
        log_success "Container removed"
    fi

    # Remove image
    if docker images -q "$IMAGE_NAME" | grep -q .; then
        docker rmi "$IMAGE_NAME:latest"
        log_success "Image removed"
    fi

    log_success "Cleanup completed"
}

check_health() {
    if docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
        log_info "Checking container health..."

        # Basic container health
        container_status=$(docker inspect --format='{{.State.Status}}' "$CONTAINER_NAME")
        echo "Container Status: $container_status"

        # HTTP health check
        if curl -s -f http://localhost:8080 > /dev/null; then
            log_success "HTTP health check: PASSED"
        else
            log_error "HTTP health check: FAILED"
        fi

        # Show resource usage
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" "$CONTAINER_NAME"
    else
        log_error "Container is not running"
        exit 1
    fi
}

open_shell() {
    if docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
        log_info "Opening shell in container..."
        docker exec -it "$CONTAINER_NAME" sh
    else
        log_error "Container is not running"
        exit 1
    fi
}

# Main script logic
check_docker

case "${1:-}" in
    build)
        build_image
        ;;
    start)
        start_container
        ;;
    stop)
        stop_container
        ;;
    restart)
        restart_container
        ;;
    logs)
        show_logs "$2"
        ;;
    status)
        show_status
        ;;
    clean)
        clean_all
        ;;
    health)
        check_health
        ;;
    shell)
        open_shell
        ;;
    dev)
        log_info "For development mode, use: pnpm dev in the apps/aide-control directory"
        ;;
    "")
        print_usage
        ;;
    *)
        log_error "Unknown command: $1"
        print_usage
        exit 1
        ;;
esac
