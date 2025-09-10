@echo off
echo Fixing ResizeObserver errors and restarting frontend...
cd frontend
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul
npm start
