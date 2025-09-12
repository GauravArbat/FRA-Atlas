# 🚀 FRA Atlas Deployment Guide

## Backend Deployment on Railway

### 1. Prepare Railway Account
- Sign up at [railway.app](https://railway.app)
- Connect your GitHub account

### 2. Deploy Backend
1. **Create New Project**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your FRA repository
   - Choose the `backend` folder as root directory

2. **Add PostgreSQL Database**
   - In your Railway project, click "New" → "Database" → "PostgreSQL"
   - Railway will automatically set environment variables

3. **Configure Environment Variables**
   ```bash
   NODE_ENV=production
   JWT_SECRET=your-super-secure-jwt-secret-key-here
   FRONTEND_URL=https://your-netlify-app.netlify.app
   CORS_ORIGIN=https://your-netlify-app.netlify.app
   ```

4. **Deploy**
   - Railway will automatically deploy from your GitHub repo
   - Your backend URL will be: `https://your-app-name.railway.app`

### 3. Database Setup
After deployment, run database initialization:
```sql
-- Connect to your Railway PostgreSQL and run:
CREATE EXTENSION IF NOT EXISTS postgis;
-- Then run the schema from database/init/01_schema.sql
```

## Frontend Deployment on Netlify

### 1. Prepare Netlify Account
- Sign up at [netlify.com](https://netlify.com)
- Connect your GitHub account

### 2. Deploy Frontend
1. **Create New Site**
   - Click "New site from Git"
   - Choose GitHub and select your FRA repository
   - Set build settings:
     - **Base directory**: `frontend`
     - **Build command**: `npm run build`
     - **Publish directory**: `frontend/build`

2. **Configure Environment Variables**
   Go to Site settings → Environment variables:
   ```bash
   REACT_APP_API_URL=https://your-railway-app.railway.app/api
   REACT_APP_MAPBOX_TOKEN=your-mapbox-token (optional)
   CI=false
   GENERATE_SOURCEMAP=false
   ```

3. **Update URLs**
   - Update `netlify.toml` with your Railway backend URL
   - Update Railway environment with your Netlify frontend URL

### 3. Custom Domain (Optional)
- In Netlify: Site settings → Domain management → Add custom domain
- Update DNS records as instructed

## Post-Deployment Configuration

### 1. Update API Configuration
Update the frontend API configuration with your Railway URL:

```typescript
// frontend/src/services/api.ts
const api = axios.create({
  baseURL: 'https://your-railway-app.railway.app/api',
  // ... rest of config
});
```

### 2. Update CORS Settings
Ensure your Railway backend allows your Netlify domain:

```javascript
// backend/src/server.js
app.use(cors({
  origin: 'https://your-netlify-app.netlify.app',
  credentials: true,
}));
```

### 3. Test Deployment
1. Visit your Netlify URL
2. Test login functionality
3. Verify API connectivity
4. Check all features work correctly

## Environment Variables Reference

### Railway (Backend)
```bash
NODE_ENV=production
PORT=$PORT
DATABASE_URL=$DATABASE_URL
JWT_SECRET=your-jwt-secret
FRONTEND_URL=https://your-netlify-app.netlify.app
CORS_ORIGIN=https://your-netlify-app.netlify.app
```

### Netlify (Frontend)
```bash
REACT_APP_API_URL=https://your-railway-app.railway.app/api
REACT_APP_MAPBOX_TOKEN=your-mapbox-token
CI=false
GENERATE_SOURCEMAP=false
```

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure CORS_ORIGIN matches your Netlify URL exactly
2. **Database Connection**: Verify DATABASE_URL is set correctly in Railway
3. **Build Failures**: Check Node.js version compatibility (use Node 18)
4. **API Not Found**: Verify REACT_APP_API_URL includes `/api` suffix

### Health Checks
- Backend health: `https://your-railway-app.railway.app/health`
- Frontend: Check browser console for errors

## Monitoring & Maintenance

### Railway
- Monitor logs in Railway dashboard
- Set up alerts for downtime
- Regular database backups

### Netlify
- Monitor build logs
- Set up form notifications
- Configure branch deploys for staging

## Security Checklist
- [ ] JWT_SECRET is secure and unique
- [ ] CORS is configured correctly
- [ ] HTTPS is enabled on both platforms
- [ ] Environment variables are not exposed
- [ ] Database credentials are secure
- [ ] Rate limiting is enabled
- [ ] Security headers are configured

## Cost Optimization
- **Railway**: Use Hobby plan ($5/month) for production
- **Netlify**: Free tier sufficient for most use cases
- **Database**: Monitor usage to avoid overages

---

**🎉 Your FRA Atlas is now deployed and ready for production use!**