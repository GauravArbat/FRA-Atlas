@echo off
echo 🌐 FRA Atlas Cloud Deployment Setup
echo ==================================

echo This script will help you deploy to Render + Vercel
echo.
echo Prerequisites:
echo 1. GitHub repository with your code
echo 2. Render account (render.com)
echo 3. Vercel account (vercel.com)
echo.

echo Step 1: Push to GitHub
echo =====================
echo Make sure your code is pushed to GitHub:
echo   git add .
echo   git commit -m "Ready for deployment"
echo   git push origin main
echo.

echo Step 2: Deploy Backend to Render
echo ===============================
echo 1. Go to https://render.com
echo 2. Connect your GitHub repository
echo 3. Use the render.yaml configuration
echo 4. Set environment variables in Render dashboard
echo.

echo Step 3: Deploy Frontend to Vercel
echo ================================
echo 1. Go to https://vercel.com
echo 2. Import your GitHub repository
echo 3. Set build command: cd frontend && npm run build
echo 4. Set output directory: frontend/build
echo 5. Add environment variable: REACT_APP_API_URL=your-render-backend-url
echo.

echo Step 4: Update CORS Settings
echo ===========================
echo Update your backend .env with:
echo CORS_ORIGIN=https://your-vercel-app.vercel.app
echo.

echo Press any key to open deployment guides...
pause >nul
start https://render.com/docs
start https://vercel.com/docs