@echo off
echo 🚀 FRA Atlas Windows Deployment Script
echo.

echo Installing Railway CLI...
npm install -g @railway/cli

echo.
echo Please follow these steps:
echo.
echo 1. Login to Railway:
echo    railway login
echo.
echo 2. Link to your project:
echo    railway link -p ac655604-ac55-4f56-95e1-feafeaf00aed
echo.
echo 3. Deploy backend:
echo    cd backend
echo    railway up
echo.
echo 4. Set environment variables in Railway dashboard:
echo    - NODE_ENV=production
echo    - JWT_SECRET=your-secure-secret
echo    - FRONTEND_URL=https://your-netlify-app.netlify.app
echo    - CORS_ORIGIN=https://your-netlify-app.netlify.app
echo.
echo 5. Add PostgreSQL database in Railway dashboard
echo.
echo Press any key to continue...
pause