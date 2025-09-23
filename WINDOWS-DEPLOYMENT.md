# 🪟 Windows Deployment Guide for FRA Atlas

## Railway CLI Setup (Windows)

### Step 1: Install Railway CLI
```powershell
# You already have Railway CLI installed via npm
railway --version
```

### Step 2: Login to Railway
```powershell
# This will open your browser for authentication
railway login
```

### Step 3: Link to Your Project
```powershell
# Navigate to backend directory
cd backend

# Link to your specific Railway project
railway link -p ac655604-ac55-4f56-95e1-feafeaf00aed
```

### Step 4: Deploy Backend
```powershell
# Deploy your backend to Railway
railway up
```

## Environment Variables Setup

After deployment, set these environment variables in Railway dashboard:

```bash
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-key-here
FRONTEND_URL=https://your-netlify-app.netlify.app
CORS_ORIGIN=https://your-netlify-app.netlify.app
```

## Database Setup

1. In Railway dashboard, click "New" → "Database" → "PostgreSQL"
2. Railway will automatically set DATABASE_URL
3. Connect to database and run:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

## Frontend Deployment (Netlify)

### Step 1: Prepare Frontend
```powershell
# Navigate to frontend directory
cd ..\frontend

# Install dependencies
npm install

# Build for production
npm run build
```

### Step 2: Deploy to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Connect GitHub and select your repository
4. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/build`

### Step 3: Set Environment Variables in Netlify
```bash
REACT_APP_API_URL=https://your-railway-app.railway.app/api
CI=false
GENERATE_SOURCEMAP=false
```

## Quick Commands Reference

```powershell
# Check Railway CLI version
railway --version

# Login to Railway
railway login

# Link project
railway link -p ac655604-ac55-4f56-95e1-feafeaf00aed

# Deploy backend
cd backend
railway up

# Check deployment status
railway status

# View logs
railway logs

# Open Railway dashboard
railway open
```

## Troubleshooting

### Common Windows Issues

1. **PowerShell Execution Policy**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Railway CLI Not Found**
   ```powershell
   npm install -g @railway/cli
   ```

3. **Login Issues**
   - Ensure your browser allows popups
   - Try incognito/private mode
   - Manually visit: https://railway.app/login

### Testing Your Deployment

1. **Backend Health Check**
   ```
   https://your-railway-app.railway.app/health
   ```

2. **Frontend Access**
   ```
   https://your-netlify-app.netlify.app
   ```

## Next Steps

1. ✅ Railway CLI installed
2. ⏳ Login to Railway (`railway login`)
3. ⏳ Link project (`railway link -p ac655604-ac55-4f56-95e1-feafeaf00aed`)
4. ⏳ Deploy backend (`railway up`)
5. ⏳ Configure environment variables
6. ⏳ Add PostgreSQL database
7. ⏳ Deploy frontend to Netlify
8. ⏳ Test complete application

---

**🎉 Your FRA Atlas will be live on Railway + Netlify!**