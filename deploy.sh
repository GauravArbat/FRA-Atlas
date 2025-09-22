#!/bin/bash

# FRA Atlas Deployment Script
# This script deploys the complete FRA Atlas application stack

set -e

echo "🌳 FRA Atlas Deployment Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if .env file exists
check_env() {
    print_status "Checking environment configuration..."
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from env.example..."
        if [ -f env.example ]; then
            cp env.example .env
            print_success "Created .env file from env.example"
            print_warning "Please update .env file with your actual configuration values"
        else
            print_error "env.example file not found. Please create .env file manually."
            exit 1
        fi
    else
        print_success "Environment configuration found"
    fi
}

# Stop existing containers
stop_containers() {
    print_status "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down --remove-orphans || true
    print_success "Existing containers stopped"
}

# Build and start services
deploy_services() {
    print_status "Building and starting services..."
    
    # Build images
    print_status "Building Docker images..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # Start services
    print_status "Starting services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    print_success "Services started successfully"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for database
    print_status "Waiting for database..."
    timeout 60s bash -c 'until docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U fra_user -d fra_atlas; do sleep 2; done'
    
    # Wait for backend
    print_status "Waiting for backend..."
    timeout 60s bash -c 'until curl -f http://localhost:8000/health; do sleep 2; done'
    
    # Wait for frontend
    print_status "Waiting for frontend..."
    timeout 60s bash -c 'until curl -f http://localhost:3000; do sleep 2; done'
    
    print_success "All services are ready"
}

# Show deployment status
show_status() {
    print_status "Deployment Status:"
    echo "=================="
    
    # Show running containers
    docker-compose -f docker-compose.prod.yml ps
    
    echo ""
    print_status "Application URLs:"
    echo "Frontend: http://localhost:3000"
    echo "Backend API: http://localhost:8000"
    echo "Nginx Proxy: http://localhost:80"
    echo "Health Check: http://localhost:8000/health"
    
    echo ""
    print_status "Default Login Credentials:"
    echo "Admin: admin@fraatlas.gov.in / admin123"
    echo "User: test@example.com / testpass123"
}

# Show logs
show_logs() {
    print_status "Showing recent logs..."
    docker-compose -f docker-compose.prod.yml logs --tail=50
}

# Main deployment function
main() {
    echo "Starting FRA Atlas deployment..."
    echo ""
    
    check_docker
    check_env
    stop_containers
    deploy_services
    wait_for_services
    show_status
    
    echo ""
    print_success "🎉 FRA Atlas deployment completed successfully!"
    echo ""
    print_status "To view logs: ./deploy.sh logs"
    print_status "To stop services: docker-compose -f docker-compose.prod.yml down"
    print_status "To restart services: docker-compose -f docker-compose.prod.yml restart"
}

# Handle command line arguments
case "${1:-}" in
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "stop")
        stop_containers
        ;;
    "restart")
        stop_containers
        deploy_services
        wait_for_services
        show_status
        ;;
    *)
        main
        ;;
esac
