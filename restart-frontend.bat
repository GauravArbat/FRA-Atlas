@echo off
echo Restarting frontend application with error fixes...
cd frontend
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul
npm start
