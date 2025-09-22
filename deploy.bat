@echo off
REM FRA Atlas Deployment Script for Windows
REM This script deploys the complete FRA Atlas application stack

echo 🌳 FRA Atlas Deployment Script
echo ================================

REM Check if Docker is installed
echo [INFO] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo [SUCCESS] Docker and Docker Compose are installed

REM Check if .env file exists
echo [INFO] Checking environment configuration...
if not exist .env (
    echo [WARNING] .env file not found. Creating from env.example...
    if exist env.example (
        copy env.example .env
        echo [SUCCESS] Created .env file from env.example
        echo [WARNING] Please update .env file with your actual configuration values
    ) else (
        echo [ERROR] env.example file not found. Please create .env file manually.
        pause
        exit /b 1
    )
) else (
    echo [SUCCESS] Environment configuration found
)

REM Stop existing containers
echo [INFO] Stopping existing containers...
docker-compose -f docker-compose.prod.yml down --remove-orphans
echo [SUCCESS] Existing containers stopped

REM Build and start services
echo [INFO] Building and starting services...

REM Build images
echo [INFO] Building Docker images...
docker-compose -f docker-compose.prod.yml build --no-cache

REM Start services
echo [INFO] Starting services...
docker-compose -f docker-compose.prod.yml up -d

echo [SUCCESS] Services started successfully

REM Wait for services to be ready
echo [INFO] Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Show deployment status
echo [INFO] Deployment Status:
echo ==================
docker-compose -f docker-compose.prod.yml ps

echo.
echo [INFO] Application URLs:
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo Nginx Proxy: http://localhost:80
echo Health Check: http://localhost:8000/health

echo.
echo [INFO] Default Login Credentials:
echo Admin: admin@fraatlas.gov.in / admin123
echo User: test@example.com / testpass123

echo.
echo [SUCCESS] 🎉 FRA Atlas deployment completed successfully!
echo.
echo [INFO] To view logs: docker-compose -f docker-compose.prod.yml logs
echo [INFO] To stop services: docker-compose -f docker-compose.prod.yml down
echo [INFO] To restart services: docker-compose -f docker-compose.prod.yml restart

pause
