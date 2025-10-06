# 🌐 FRA Atlas Cloud Deployment Guide

## 🚀 Quick Deploy (5 Minutes)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Deploy to cloud"
git push origin main
```

### Step 2: Deploy Backend (Render)
1. Go to [render.com](https://render.com/dashboard)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Select `backend/render.yaml`
5. Click **"Apply"**
6. Wait 5-10 minutes for deployment

### Step 3: Deploy Frontend (Vercel)
1. Go to [vercel.com](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. **Framework**: Create React App
5. **Root Directory**: `frontend`
6. **Build Command**: `npm run build`
7. **Output Directory**: `build`
8. Click **"Deploy"**

## 🔧 Configuration

### Backend Environment Variables (Render)
```env
NODE_ENV=production
PORT=10000
JWT_SECRET=auto-generated
CORS_ORIGIN=https://fra-atlas.vercel.app
DATABASE_URL=auto-configured
REDIS_URL=auto-configured
```

### Frontend Environment Variables (Vercel)
```env
REACT_APP_API_URL=https://fra-atlas-backend.onrender.com
REACT_APP_MAPBOX_TOKEN=your-token-here
```

## 🎯 Expected URLs
- **Frontend**: https://fra-atlas.vercel.app
- **Backend**: https://fra-atlas-backend.onrender.com
- **Health Check**: https://fra-atlas-backend.onrender.com/health

## ✅ Verification Steps
1. Visit frontend URL
2. Check backend health endpoint
3. Test login with: admin@fraatlas.gov.in / admin123
4. Verify map functionality

## 🔄 Updates
```bash
git add .
git commit -m "Update"
git push origin main
# Auto-deploys to both platforms
```