@echo off
echo ========================================
echo   FRA Atlas - Netlify Deployment
echo ========================================
echo.

echo [1/4] Building frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo [2/4] Build completed successfully!
echo.

echo [3/4] Ready for Netlify deployment...
echo.
echo Next steps:
echo 1. Go to https://netlify.com
echo 2. Sign in to your account
echo 3. Click "New site from Git"
echo 4. Connect to GitHub repository: YashMehenge2005/FRA
echo 5. Set base directory to: frontend
echo 6. Add environment variable: REACT_APP_API_URL = https://fra-atlas-backend-ig8n.onrender.com
echo 7. Click "Deploy site"
echo.

echo [4/4] Deployment guide created: NETLIFY_DEPLOYMENT_GUIDE.md
echo.

echo ========================================
echo   Deployment preparation complete!
echo ========================================
pause
