@echo off
echo 🔄 Restarting FRA Atlas services...

echo Stopping services...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Starting backend...
cd backend
start "FRA Backend" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo Starting frontend...
cd ../frontend  
start "FRA Frontend" cmd /k "npm start"

echo ✅ Services restarted!
echo Open http://localhost:3000 in your browser
pause
