@echo off
REM FRA Atlas Cloud Deployment Script
REM This script helps prepare the application for deployment to Render and Vercel

echo 🌳 FRA Atlas Cloud Deployment Preparation
echo =========================================

echo [INFO] Preparing application for cloud deployment...

REM Check if Git is available
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed. Please install Git first.
    pause
    exit /b 1
)

echo [SUCCESS] Git is available

REM Check if we're in a Git repository
git status >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Not in a Git repository. Please initialize Git first.
    echo [INFO] Run: git init
    echo [INFO] Run: git add .
    echo [INFO] Run: git commit -m "Initial commit"
    pause
    exit /b 1
)

echo [SUCCESS] Git repository found

REM Check if all files are committed
git diff --quiet
if %errorlevel% neq 0 (
    echo [WARNING] There are uncommitted changes.
    echo [INFO] Please commit your changes before deploying:
    echo [INFO] git add .
    echo [INFO] git commit -m "Prepare for deployment"
    pause
)

REM Check if we have a remote repository
git remote -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] No remote repository found.
    echo [INFO] Please add a remote repository:
    echo [INFO] git remote add origin https://github.com/yourusername/your-repo.git
    echo [INFO] git push -u origin main
    pause
)

echo [INFO] Checking application structure...

REM Check if backend package.json exists
if not exist "backend\package.json" (
    echo [ERROR] Backend package.json not found.
    pause
    exit /b 1
)

REM Check if frontend package.json exists
if not exist "frontend\package.json" (
    echo [ERROR] Frontend package.json not found.
    pause
    exit /b 1
)

echo [SUCCESS] Application structure looks good

echo [INFO] Creating deployment configurations...

REM Create .gitignore if it doesn't exist
if not exist ".gitignore" (
    echo [INFO] Creating .gitignore file...
    echo node_modules/ > .gitignore
    echo .env >> .gitignore
    echo .env.local >> .gitignore
    echo .env.production >> .gitignore
    echo build/ >> .gitignore
    echo dist/ >> .gitignore
    echo logs/ >> .gitignore
    echo uploads/ >> .gitignore
    echo .DS_Store >> .gitignore
    echo Thumbs.db >> .gitignore
)

echo [SUCCESS] Deployment configurations ready

echo.
echo [INFO] Next Steps for Deployment:
echo ================================
echo.
echo 1. BACKEND DEPLOYMENT (Render):
echo    - Go to https://render.com
echo    - Sign in with GitHub
echo    - Create new Web Service
echo    - Connect your repository
echo    - Set Root Directory to: backend
echo    - Set Build Command to: npm install
echo    - Set Start Command to: npm start
echo    - Add environment variables (see DEPLOYMENT_RENDER_VERCEL.md)
echo.
echo 2. FRONTEND DEPLOYMENT (Vercel):
echo    - Go to https://vercel.com
echo    - Sign in with GitHub
echo    - Import your repository
echo    - Set Root Directory to: frontend
echo    - Set Build Command to: npm run build
echo    - Set Output Directory to: build
echo    - Add environment variables (see DEPLOYMENT_RENDER_VERCEL.md)
echo.
echo 3. UPDATE CORS:
echo    - Update CORS_ORIGIN in Render to your Vercel URL
echo    - Update REACT_APP_API_URL in Vercel to your Render URL
echo.
echo [INFO] For detailed instructions, see DEPLOYMENT_RENDER_VERCEL.md

echo.
echo [SUCCESS] 🎉 Application is ready for cloud deployment!
echo.
echo [INFO] Your application will be accessible at:
echo - Frontend: https://your-app.vercel.app
echo - Backend: https://your-app.onrender.com

pause
