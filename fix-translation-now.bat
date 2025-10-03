@echo off
echo 🔧 Fixing translation system...

echo Stopping backend...
taskkill /f /im node.exe 2>nul

echo Starting backend with simple translation...
cd backend
start "FRA Backend" cmd /k "npm run dev"

echo ✅ Translation system updated!
echo Test at: http://localhost:8000/api/translate/translate
echo Restart frontend if needed: cd frontend && npm start

pause