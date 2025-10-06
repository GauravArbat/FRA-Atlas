@echo off
echo 🌳 FRA Atlas Quick Deployment
echo =============================

echo [INFO] Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker not found. Please install Docker Desktop first.
    pause
    exit /b 1
)

echo [SUCCESS] Docker found

echo [INFO] Setting up environment...
if not exist .env (
    if exist env.example (
        copy env.example .env
        echo [SUCCESS] Created .env from env.example
    ) else (
        echo [ERROR] No env.example found
        pause
        exit /b 1
    )
)

echo [INFO] Stopping existing containers...
docker-compose -f docker-compose.prod.yml down --remove-orphans 2>nul

echo [INFO] Building and starting services...
docker-compose -f docker-compose.prod.yml up -d --build

echo [INFO] Waiting for services to start...
timeout /t 30 /nobreak >nul

echo [INFO] Checking service status...
docker-compose -f docker-compose.prod.yml ps

echo.
echo 🎉 Deployment Complete!
echo =====================
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo Health:   http://localhost:8000/health
echo.
echo Default Login:
echo Admin: admin@fraatlas.gov.in / admin123
echo User:  test@example.com / testpass123
echo.
echo Press any key to view logs...
pause >nul
docker-compose -f docker-compose.prod.yml logs --tail=50