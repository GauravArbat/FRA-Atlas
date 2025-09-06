#!/bin/bash

# FRA Atlas Setup Script
# This script sets up the complete FRA Atlas development environment

set -e

echo "🌳 Setting up FRA Atlas Development Environment"
echo "================================================"

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

# Check if required ports are available
check_ports() {
    print_status "Checking port availability..."
    
    local ports=("3000" "8000" "8001" "5432" "6379" "80" "443")
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_warning "Port $port is already in use. Please stop the service using this port."
        else
            print_success "Port $port is available"
        fi
    done
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p uploads
    mkdir -p processed
    mkdir -p logs
    mkdir -p backups
    mkdir -p nginx/ssl
    
    print_success "Directories created"
}

# Setup environment file
setup_env() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        cp env.example .env
        print_warning "Please update the .env file with your actual configuration values"
        print_warning "Especially update:"
        print_warning "  - MAPBOX_TOKEN"
        print_warning "  - JWT_SECRET"
        print_warning "  - Email settings"
    else
        print_success "Environment file already exists"
    fi
}

# Build and start services
start_services() {
    print_status "Building and starting Docker services..."
    
    # Build images
    docker-compose build
    
    # Start services
    docker-compose up -d
    
    print_success "Services started successfully"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for PostgreSQL
    print_status "Waiting for PostgreSQL..."
    until docker-compose exec -T postgres pg_isready -U fra_user -d fra_atlas; do
        sleep 2
    done
    print_success "PostgreSQL is ready"
    
    # Wait for Redis
    print_status "Waiting for Redis..."
    until docker-compose exec -T redis redis-cli ping; do
        sleep 2
    done
    print_success "Redis is ready"
    
    # Wait for Backend API
    print_status "Waiting for Backend API..."
    until curl -f http://localhost:8000/health > /dev/null 2>&1; do
        sleep 5
    done
    print_success "Backend API is ready"
    
    # Wait for Data Processor
    print_status "Waiting for Data Processor..."
    until curl -f http://localhost:8001/health > /dev/null 2>&1; do
        sleep 5
    done
    print_success "Data Processor is ready"
    
    # Wait for Frontend
    print_status "Waiting for Frontend..."
    until curl -f http://localhost:3000 > /dev/null 2>&1; do
        sleep 5
    done
    print_success "Frontend is ready"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # The database schema is automatically created by the init script
    print_success "Database schema initialized"
}

# Show service status
show_status() {
    print_status "Checking service status..."
    
    docker-compose ps
    
    echo ""
    print_success "FRA Atlas is now running!"
    echo ""
    echo "🌐 Access URLs:"
    echo "  Frontend:     http://localhost:3000"
    echo "  Backend API:  http://localhost:8000"
    echo "  Data Processor: http://localhost:8001"
    echo "  API Docs:     http://localhost:8000/api-docs"
    echo ""
    echo "🔐 Default Login Credentials:"
    echo "  Email: admin@fraatlas.gov.in"
    echo "  Password: admin123"
    echo ""
    echo "📊 Database:"
    echo "  Host: localhost:5432"
    echo "  Database: fra_atlas"
    echo "  Username: fra_user"
    echo "  Password: fra_password"
    echo ""
    echo "📝 Useful Commands:"
    echo "  View logs: docker-compose logs -f"
    echo "  Stop services: docker-compose down"
    echo "  Restart services: docker-compose restart"
    echo "  Rebuild: docker-compose up --build"
}

# Main setup function
main() {
    echo ""
    print_status "Starting FRA Atlas setup..."
    echo ""
    
    check_docker
    check_ports
    create_directories
    setup_env
    start_services
    wait_for_services
    run_migrations
    show_status
    
    echo ""
    print_success "FRA Atlas setup completed successfully!"
    echo ""
    print_warning "Next steps:"
    print_warning "1. Update the .env file with your actual configuration"
    print_warning "2. Access the application at http://localhost:3000"
    print_warning "3. Review the documentation in the docs/ folder"
    echo ""
}

# Run main function
main "$@"



