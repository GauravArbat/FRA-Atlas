# Netlify Deployment Guide for FRA Atlas Frontend

## 🚀 Deploy Frontend to Netlify

This guide will help you deploy the FRA Atlas frontend to Netlify and connect it to your Render backend.

### Prerequisites
- ✅ Backend deployed on Render: `https://fra-atlas-backend-ig8n.onrender.com`
- ✅ Frontend code ready in the `frontend/` directory
- ✅ Netlify account (free)

### Step 1: Prepare Frontend for Deployment

The frontend is already configured with:
- ✅ `netlify.toml` configuration file
- ✅ Environment variable `REACT_APP_API_URL` set to your Render backend
- ✅ Build command: `npm run build`
- ✅ Publish directory: `build`

### Step 2: Deploy to Netlify

#### Option A: Deploy via Netlify Dashboard (Recommended)

1. **Go to [netlify.com](https://netlify.com)**
2. **Sign in** to your account
3. **Click "New site from Git"**
4. **Connect to GitHub:**
   - Click "GitHub" 
   - Authorize Netlify to access your repositories
   - Select your repository: `YashMehenge2005/FRA`

5. **Configure Build Settings:**
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
   - **Node version**: `18`

6. **Add Environment Variables:**
   - Go to Site settings → Environment variables
   - Add: `REACT_APP_API_URL` = `https://fra-atlas-backend-ig8n.onrender.com`

7. **Deploy:**
   - Click "Deploy site"
   - Wait for build to complete (2-3 minutes)

#### Option B: Deploy via Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

4. **Build the project:**
   ```bash
   npm run build
   ```

5. **Deploy to Netlify:**
   ```bash
   netlify deploy --prod --dir=build
   ```

### Step 3: Configure Custom Domain (Optional)

1. **Go to Site settings → Domain management**
2. **Add custom domain** (if you have one)
3. **Configure DNS** as instructed by Netlify

### Step 4: Test the Deployment

1. **Visit your Netlify URL** (e.g., `https://your-site-name.netlify.app`)
2. **Test the connection** to your backend
3. **Verify all features** are working

### Step 5: Enable Continuous Deployment

1. **Go to Site settings → Build & deploy**
2. **Enable "Deploy previews"** for pull requests
3. **Configure build hooks** if needed

## 🔧 Configuration Details

### Environment Variables
- `REACT_APP_API_URL`: Backend API URL (`https://fra-atlas-backend-ig8n.onrender.com`)

### Build Configuration
- **Build command**: `npm run build`
- **Publish directory**: `build`
- **Node version**: `18`

### Redirects
- All routes redirect to `index.html` for React Router

### Headers
- Security headers for XSS protection
- Cache headers for static assets

## 🐛 Troubleshooting

### Common Issues:

1. **Build fails:**
   - Check Node version (should be 18)
   - Verify all dependencies are installed
   - Check build logs in Netlify dashboard

2. **API connection fails:**
   - Verify `REACT_APP_API_URL` environment variable
   - Check CORS settings in backend
   - Test backend URL directly

3. **Routing issues:**
   - Ensure redirects are configured in `netlify.toml`
   - Check React Router configuration

### Support:
- Check Netlify build logs
- Verify backend is running on Render
- Test API endpoints directly

## 📋 Deployment Checklist

- [ ] Frontend code pushed to GitHub
- [ ] Netlify account created
- [ ] Site connected to GitHub repository
- [ ] Build settings configured
- [ ] Environment variables set
- [ ] Site deployed successfully
- [ ] Frontend connects to backend
- [ ] All features working
- [ ] Custom domain configured (optional)

## 🎉 Success!

Your FRA Atlas frontend should now be live on Netlify and connected to your Render backend!

**Frontend URL**: `https://your-site-name.netlify.app`
**Backend URL**: `https://fra-atlas-backend-ig8n.onrender.com`
