# 🚀 FRA Atlas Deployment Guide - Render & Vercel

## 📋 Overview

This guide provides step-by-step instructions for deploying the FRA Atlas application:
- **Backend**: Deploy to Render (Node.js API)
- **Frontend**: Deploy to Vercel (React App)

## 🎯 Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Render        │
│   Frontend      │◄──►│   Backend       │
│   React App     │    │   Node.js API   │
└─────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Static Files  │    │   PostgreSQL    │
│   CDN           │    │   Redis Cache   │
└─────────────────┘    └─────────────────┘
```

## 🛠️ Prerequisites

### Required Accounts
- **Render Account**: Sign up at [render.com](https://render.com)
- **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
- **GitHub Account**: For repository hosting

### Repository Setup
- Push your code to a GitHub repository
- Ensure all files are committed and pushed

## 🚀 Step 1: Deploy Backend to Render

### 1.1 Create Render Service

1. **Login to Render Dashboard**
   - Go to [render.com](https://render.com)
   - Sign in with your GitHub account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository containing your FRA Atlas code

3. **Configure Service Settings**
   ```
   Name: fra-atlas-backend
   Environment: Node
   Region: Choose closest to your users
   Branch: main
   Root Directory: backend
   Build Command: npm install
   Start Command: npm start
   ```

### 1.2 Environment Variables

Add these environment variables in Render dashboard:

```env
NODE_ENV=production
PORT=10000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024
CORS_ORIGIN=https://fra-atlas-frontend.vercel.app
DATABASE_URL=postgresql://fra_user:fra_password@localhost:5432/fra_atlas
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
DEBUG=false
```

### 1.3 Create Database

1. **Create PostgreSQL Database**
   - In Render dashboard, click "New +" → "PostgreSQL"
   - Name: `fra-atlas-db`
   - Plan: Free tier
   - Copy the connection string to `DATABASE_URL`

2. **Create Redis Cache**
   - In Render dashboard, click "New +" → "Redis"
   - Name: `fra-atlas-redis`
   - Plan: Free tier
   - Copy the connection string to `REDIS_URL`

### 1.4 Deploy Backend

1. **Deploy Service**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note the service URL (e.g., `https://fra-atlas-backend.onrender.com`)

2. **Test Backend**
   ```bash
   curl https://fra-atlas-backend.onrender.com/health
   ```

## 🚀 Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Project

1. **Login to Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository containing your FRA Atlas code

3. **Configure Project Settings**
   ```
   Framework Preset: Create React App
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

### 2.2 Environment Variables

Add these environment variables in Vercel dashboard:

```env
REACT_APP_API_URL=https://fra-atlas-backend.onrender.com/api
REACT_APP_MAPBOX_TOKEN=your-mapbox-token-here (optional)
NODE_ENV=production
```

### 2.3 Deploy Frontend

1. **Deploy Project**
   - Click "Deploy"
   - Wait for deployment to complete
   - Note the deployment URL (e.g., `https://fra-atlas-frontend.vercel.app`)

2. **Test Frontend**
   - Open the deployment URL in your browser
   - Verify the application loads correctly

## 🔧 Step 3: Update CORS Configuration

### 3.1 Update Backend CORS

1. **Update Render Environment Variables**
   - Go to your Render service dashboard
   - Update `CORS_ORIGIN` to your Vercel URL:
   ```
   CORS_ORIGIN=https://fra-atlas-frontend.vercel.app
   ```

2. **Redeploy Backend**
   - Trigger a new deployment in Render
   - Wait for deployment to complete

### 3.2 Update Frontend API URL

1. **Update Vercel Environment Variables**
   - Go to your Vercel project dashboard
   - Update `REACT_APP_API_URL` to your Render URL:
   ```
   REACT_APP_API_URL=https://fra-atlas-backend.onrender.com/api
   ```

2. **Redeploy Frontend**
   - Trigger a new deployment in Vercel
   - Wait for deployment to complete

## 🌐 Step 4: Configure Custom Domains (Optional)

### 4.1 Backend Custom Domain

1. **In Render Dashboard**
   - Go to your service settings
   - Click "Custom Domains"
   - Add your domain (e.g., `api.fraatlas.com`)
   - Configure DNS records as instructed

### 4.2 Frontend Custom Domain

1. **In Vercel Dashboard**
   - Go to your project settings
   - Click "Domains"
   - Add your domain (e.g., `fraatlas.com`)
   - Configure DNS records as instructed

## 🔍 Step 5: Testing and Verification

### 5.1 Test Backend API

```bash
# Health check
curl https://fra-atlas-backend.onrender.com/health

# Test authentication
curl -X POST https://fra-atlas-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fraatlas.gov.in","password":"admin123"}'
```

### 5.2 Test Frontend

1. **Open Frontend URL**
   - Navigate to your Vercel deployment URL
   - Verify the application loads

2. **Test Login**
   - Use admin credentials: `admin@fraatlas.gov.in` / `admin123`
   - Verify login works

3. **Test Features**
   - Navigate through different pages
   - Test mapping functionality
   - Test data management features

## 📊 Step 6: Monitoring and Maintenance

### 6.1 Render Monitoring

1. **View Logs**
   - Go to your service dashboard
   - Click "Logs" tab
   - Monitor application logs

2. **View Metrics**
   - Check CPU and memory usage
   - Monitor response times

### 6.2 Vercel Monitoring

1. **View Analytics**
   - Go to your project dashboard
   - Check "Analytics" tab
   - Monitor page views and performance

2. **View Functions**
   - Check "Functions" tab
   - Monitor serverless function performance

## 🔧 Troubleshooting

### Common Issues

#### 1. CORS Errors
```bash
# Check CORS configuration
curl -H "Origin: https://fra-atlas-frontend.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: X-Requested-With" \
  -X OPTIONS \
  https://fra-atlas-backend.onrender.com/api/auth/me
```

#### 2. Database Connection Issues
- Check `DATABASE_URL` environment variable
- Verify database is running in Render
- Check database logs

#### 3. Frontend Build Issues
- Check build logs in Vercel
- Verify all dependencies are installed
- Check for TypeScript errors

#### 4. Environment Variable Issues
- Verify all required environment variables are set
- Check variable names and values
- Restart services after updating variables

### Debug Commands

```bash
# Check backend health
curl https://fra-atlas-backend.onrender.com/health

# Check frontend build
curl https://fra-atlas-frontend.vercel.app

# Test API endpoints
curl https://fra-atlas-backend.onrender.com/api/fra/atlas/geojson
```

## 🎯 Production Checklist

### Backend (Render)
- [ ] Service deployed and running
- [ ] Database connected and accessible
- [ ] Redis cache connected
- [ ] Environment variables configured
- [ ] CORS origin set to frontend URL
- [ ] Health check endpoint responding
- [ ] Logs accessible and monitored

### Frontend (Vercel)
- [ ] Application deployed and accessible
- [ ] API URL configured correctly
- [ ] Build successful without errors
- [ ] All pages loading correctly
- [ ] Authentication working
- [ ] Mapping features functional

### Integration
- [ ] Frontend can communicate with backend
- [ ] CORS configured correctly
- [ ] All API endpoints accessible
- [ ] User authentication working
- [ ] Data persistence working

## 📞 Support

### Getting Help
- **Render Support**: [render.com/docs](https://render.com/docs)
- **Vercel Support**: [vercel.com/docs](https://vercel.com/docs)
- **Project Issues**: Create an issue in your GitHub repository

### Useful Links
- **Render Dashboard**: [dashboard.render.com](https://dashboard.render.com)
- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **GitHub Repository**: Your repository URL

---

## 🎉 Success!

Your FRA Atlas application should now be deployed and accessible at:
- **Frontend**: https://fra-atlas-frontend.vercel.app
- **Backend**: https://fra-atlas-backend.onrender.com

Both services are connected and ready for production use! 🌳
