@echo off
echo 🚀 Deploying FRA Atlas to Cloud
echo ===============================

echo [1/4] Pushing to GitHub...
git add .
git commit -m "Deploy FRA Atlas to Render + Vercel"
git push origin main

echo [2/4] Backend Deployment (Render)
echo Go to: https://render.com/dashboard
echo 1. Click "New +" → "Blueprint"
echo 2. Connect GitHub repository
echo 3. Select render.yaml file
echo 4. Click "Apply"

echo [3/4] Frontend Deployment (Vercel)
echo Go to: https://vercel.com/dashboard
echo 1. Click "Add New..." → "Project"
echo 2. Import GitHub repository
echo 3. Framework: Create React App
echo 4. Root Directory: frontend
echo 5. Build Command: npm run build
echo 6. Output Directory: build
echo 7. Click "Deploy"

echo [4/4] Expected URLs:
echo Frontend: https://fra-atlas.vercel.app
echo Backend:  https://fra-atlas-backend.onrender.com
echo Health:   https://fra-atlas-backend.onrender.com/health

echo ✅ Deployment files ready!
pause