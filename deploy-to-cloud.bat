@echo off
echo 🌐 FRA Atlas Cloud Deployment
echo ============================

echo Step 1: Push to GitHub
echo ======================
git add .
git commit -m "Deploy to Render + Vercel"
git push origin main

echo Step 2: Deploy Backend to Render
echo ================================
echo 1. Go to https://render.com/dashboard
echo 2. Click "New +" → "Blueprint"
echo 3. Connect GitHub repository
echo 4. Select backend/render.yaml
echo 5. Click "Apply"

echo Step 3: Deploy Frontend to Vercel
echo =================================
echo 1. Go to https://vercel.com/dashboard
echo 2. Click "Add New..." → "Project"
echo 3. Import GitHub repository
echo 4. Framework: Create React App
echo 5. Root Directory: frontend
echo 6. Build Command: npm run build
echo 7. Output Directory: build
echo 8. Deploy

echo Step 4: Update Environment Variables
echo ===================================
echo In Render Dashboard:
echo - Add MAPBOX_TOKEN (optional)
echo - Add other environment variables as needed

echo In Vercel Dashboard:
echo - Add REACT_APP_MAPBOX_TOKEN (optional)
echo - Update REACT_APP_API_URL with your Render backend URL

echo 🎉 Deployment URLs will be:
echo Frontend: https://fra-atlas.vercel.app
echo Backend:  https://fra-atlas-backend.onrender.com

pause