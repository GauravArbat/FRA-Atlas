@echo off
REM FRA Atlas Application Starter
REM This script starts both frontend and backend servers

echo 🌳 Starting FRA Atlas Application
echo =================================

echo [INFO] Starting backend server...
start "FRA Atlas Backend" cmd /k "cd /d %~dp0backend && npm start"

echo [INFO] Starting frontend server...
start "FRA Atlas Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo [SUCCESS] Both servers are starting...
echo.
echo [INFO] Application URLs:
echo - Frontend: http://localhost:3000
echo - Backend: http://localhost:8000
echo - Health Check: http://localhost:8000/health
echo.
echo [INFO] Default Login Credentials:
echo - Admin: admin@fraatlas.gov.in / admin123
echo - User: test@example.com / testpass123
echo.
echo [INFO] Press any key to exit...
pause >nul
