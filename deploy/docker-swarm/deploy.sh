#!/bin/bash

# Docker Swarm Deployment Script
# This script automates the deployment process for EC2 Ubuntu 24.04

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="nasa"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if running as root or with sudo
check_permissions() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo privileges"
    fi
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker is not running. Please start Docker first."
    fi
    
    log "Docker is installed and running"
}

# Check if Docker Swarm is initialized
check_swarm() {
    if ! docker info | grep -q "Swarm: active"; then
        log "Initializing Docker Swarm..."
        docker swarm init
    else
        log "Docker Swarm is already initialized"
    fi
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    local dirs=(
        "/opt/cache"
        "/opt/nginx/ssl"
        "/opt/certbot/www"
        "/opt/certbot/conf"
    )
    
    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            log "Created directory: $dir"
        else
            log "Directory already exists: $dir"
        fi
    done
    
    chmod 700 /opt/nginx/ssl
}

# Check if environment file exists
check_env_file() {
    if [[ ! -f "$ENV_FILE" ]]; then
        error "Environment file $ENV_FILE not found. Please copy env.example to .env and configure it."
    fi
    
    log "Environment file found: $ENV_FILE"
}

# Read environment file
read_env_file() {
    log "Reading environment file: $ENV_FILE"
    export $(grep -vE '^\s*#|^\s*$' "$ENV_FILE" | xargs)
}

# Login to GitHub Container Registry if needed
login_ghcr() {
    if [[ -f "$ENV_FILE" ]]; then
        GHCR_USERNAME=$(grep "^GHCR_USERNAME=" "$ENV_FILE" | cut -d'=' -f2)
        GHCR_TOKEN=$(grep "^GHCR_TOKEN=" "$ENV_FILE" | cut -d'=' -f2)
        
        if [[ -n "$GHCR_USERNAME" && -n "$GHCR_TOKEN" ]]; then
            log "Logging into GitHub Container Registry..."
            echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin
        else
            warn "GHCR credentials not found - skipping login"
        fi
    fi
}

# Deploy the stack
deploy_stack() {
    log "Deploying stack: $STACK_NAME"
    
    # Remove existing stack if it exists
    if docker stack ls | grep -q "$STACK_NAME"; then
        warn "Stack already exists: $STACK_NAME"
        #  / command: docker stack rm $STACK_NAME
    fi
    
    # Deploy new stack
    log "Deploying new stack..."
    docker stack deploy --with-registry-auth -c "$COMPOSE_FILE" "$STACK_NAME"
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 10
    
    # Check service status
    check_services
}

# Check service status
check_services() {
    log "Checking service status..."
    
    # Wait for all services to be ready
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        local ready_services=$(docker stack services "$STACK_NAME" --format "table {{.Name}}\t{{.Replicas}}" | tail -n +2 | grep -c ".*/.*")
        local total_services=$(docker stack services "$STACK_NAME" --format "table {{.Name}}\t{{.Replicas}}" | tail -n +2 | wc -l)
        
        if [[ $ready_services -eq $total_services ]]; then
            log "All services are ready!"
            break
        fi
        
        log "Waiting for services to be ready... (attempt $attempt/$max_attempts)"
        log "Ready: $ready_services/$total_services services"
        sleep 10
        ((attempt++))
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        error "Timeout waiting for services to be ready"
    fi
    
    # Display service status
    log "Service status:"
    docker stack services "$STACK_NAME"
    
    log "Service details:"
    docker stack ps "$STACK_NAME"
}

# Main deployment function
main() {
    log "Starting nasa.ie deployment..."
    
    check_permissions
    check_docker
    check_swarm
    create_directories
    check_env_file
    read_env_file
    login_ghcr
    deploy_stack
    
    log "Deployment completed successfully!"
    log "Your application should be available at: http://$(curl -s ifconfig.me)"
    log "To check service logs: docker service logs ${STACK_NAME}_backend"
    log "To scale services: docker service scale ${STACK_NAME}_backend=3"
}

# Run main function
main "$@" 