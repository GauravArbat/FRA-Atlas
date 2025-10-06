@echo off
echo 🔍 FRA Atlas Deployment Status Checker
echo =====================================

echo [INFO] Checking Docker containers...
docker-compose -f docker-compose.prod.yml ps

echo.
echo [INFO] Testing service endpoints...

echo Testing Backend Health...
curl -s http://localhost:8000/health && echo [SUCCESS] Backend is healthy || echo [ERROR] Backend not responding

echo Testing Frontend...
curl -s -o nul -w "%%{http_code}" http://localhost:3000 | findstr "200" >nul && echo [SUCCESS] Frontend is accessible || echo [ERROR] Frontend not responding

echo Testing Database Connection...
docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U fra_user -d fra_atlas && echo [SUCCESS] Database is ready || echo [ERROR] Database not ready

echo Testing Redis...
docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping | findstr "PONG" >nul && echo [SUCCESS] Redis is responding || echo [ERROR] Redis not responding

echo.
echo [INFO] Service URLs:
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo Health:   http://localhost:8000/health

echo.
echo [INFO] Default Login Credentials:
echo Admin: admin@fraatlas.gov.in / admin123
echo User:  test@example.com / testpass123

echo.
echo [INFO] Useful Commands:
echo View logs:     docker-compose -f docker-compose.prod.yml logs
echo Stop services: docker-compose -f docker-compose.prod.yml down
echo Restart:       docker-compose -f docker-compose.prod.yml restart

pause