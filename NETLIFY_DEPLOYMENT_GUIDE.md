# Complete Netlify Deployment Guide for FRA Atlas Frontend

## 🚀 Deployment Methods

### Method 1: Deploy from Git Repository (Recommended)

#### Step 1: Prepare Your Repository
1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

#### Step 2: Connect to Netlify
1. **Go to [netlify.com](https://netlify.com)** and sign up/login
2. **Click "New site from Git"**
3. **Choose your Git provider** (GitHub, GitLab, or Bitbucket)
4. **Authorize Netlify** to access your repositories
5. **Select your repository** containing the FRA Atlas project

#### Step 3: Configure Build Settings
Netlify should automatically detect your `netlify.toml` file, but verify these settings:

- **Base directory**: `frontend`
- **Build command**: `npm run build:prod`
- **Publish directory**: `build`
- **Node version**: `18`

#### Step 4: Environment Variables
Your environment variables are already configured in `netlify.toml`:
- `REACT_APP_API_URL`: `https://fra-atlas-backend-ig8n.onrender.com`
- `GENERATE_SOURCEMAP`: `false`
- `CI`: `false`

#### Step 5: Deploy
1. **Click "Deploy site"**
2. **Wait for build to complete** (usually 2-5 minutes)
3. **Your site will be live** at a random URL like `https://amazing-name-123456.netlify.app`

---

### Method 2: Deploy from Local Build (Manual)

#### Step 1: Build Locally
```bash
cd frontend
npm install
npm run build:prod
```

#### Step 2: Deploy to Netlify
1. **Go to [netlify.com](https://netlify.com)**
2. **Drag and drop** your `frontend/build` folder to the deploy area
3. **Your site will be live** immediately

---

### Method 3: Using Netlify CLI

#### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

#### Step 2: Login to Netlify
```bash
netlify login
```

#### Step 3: Deploy
```bash
cd frontend
netlify deploy --prod --dir=build
```

---

## 🔧 Configuration Details

### Your Current netlify.toml Configuration
```toml
[build]
  base = "frontend"                    # Build from frontend directory
  publish = "build"                    # Publish the build folder
  command = "npm run build:prod"       # Use optimized build command

[build.environment]
  NODE_VERSION = "18"                  # Use Node.js 18
  REACT_APP_API_URL = "https://fra-atlas-backend-ig8n.onrender.com"
  GENERATE_SOURCEMAP = "false"         # Disable source maps for smaller builds
  CI = "false"                         # Disable CI mode

# Build optimizations
[build.processing]
  skip_processing = false

[build.processing.css]
  bundle = true
  minify = true

[build.processing.js]
  bundle = true
  minify = true

[build.processing.html]
  pretty_urls = true

# SPA routing support
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

# Static asset caching
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

---

## 🌐 Custom Domain Setup

### Step 1: Add Custom Domain
1. **Go to Site Settings** → **Domain Management**
2. **Click "Add custom domain"**
3. **Enter your domain** (e.g., `yourdomain.com`)
4. **Follow DNS configuration instructions**

### Step 2: Configure DNS
Add these DNS records to your domain provider:

**For apex domain (yourdomain.com):**
```
Type: A
Name: @
Value: 75.2.60.5
```

**For www subdomain (www.yourdomain.com):**
```
Type: CNAME
Name: www
Value: your-site-name.netlify.app
```

### Step 3: SSL Certificate
- **Netlify automatically provides SSL certificates**
- **HTTPS will be enabled** once DNS propagates (usually 24-48 hours)

---

## 🔄 Continuous Deployment

### Automatic Deployments
- **Every push to main branch** triggers automatic deployment
- **Pull requests** can be deployed as previews
- **Branch deploys** for testing different versions

### Manual Deployments
- **Trigger deploys** from Netlify dashboard
- **Redeploy** specific commits
- **Rollback** to previous deployments

---

## 🐛 Troubleshooting Common Issues

### Build Failures

#### Issue: "Build command failed"
**Solution:**
```bash
# Test build locally first
cd frontend
npm install
npm run build:prod
```

#### Issue: "Module not found"
**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Issue: "Environment variables not found"
**Solution:**
- Check `netlify.toml` environment variables
- Verify variable names match your code
- Ensure no typos in variable names

### Runtime Issues

#### Issue: "API calls failing"
**Solution:**
- Verify `REACT_APP_API_URL` is correct
- Check CORS settings on your backend
- Ensure backend is running and accessible

#### Issue: "Routing not working"
**Solution:**
- Verify `[[redirects]]` section in `netlify.toml`
- Ensure all routes redirect to `/index.html`

#### Issue: "Static assets not loading"
**Solution:**
- Check `public` folder structure
- Verify asset paths in your code
- Ensure proper build output

---

## 📊 Performance Optimization

### Build Optimizations (Already Configured)
- ✅ Source maps disabled for production
- ✅ CSS minification enabled
- ✅ JavaScript minification enabled
- ✅ HTML optimization enabled
- ✅ Static asset caching configured

### Additional Optimizations
1. **Image optimization**: Use WebP format
2. **Code splitting**: Already handled by React
3. **Lazy loading**: Implement for heavy components
4. **CDN**: Netlify provides global CDN automatically

---

## 🔐 Security Features

### Headers (Already Configured)
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection: 1; mode=block
- ✅ X-Content-Type-Options: nosniff
- ✅ Referrer-Policy: strict-origin-when-cross-origin

### Additional Security
- **HTTPS**: Automatically enabled
- **DDoS Protection**: Built-in
- **Bot Protection**: Available in paid plans

---

## 📈 Monitoring and Analytics

### Netlify Analytics
- **Page views and unique visitors**
- **Top pages and referrers**
- **Build times and success rates**
- **Form submissions** (if using Netlify Forms)

### Performance Monitoring
- **Core Web Vitals**
- **Lighthouse scores**
- **Build performance metrics**

---

## 🚀 Quick Start Commands

### Deploy Now
```bash
# 1. Build locally
cd frontend
npm run build:prod

# 2. Deploy to Netlify (choose one method)
# Method A: Drag & drop build folder to netlify.com
# Method B: Use CLI
netlify deploy --prod --dir=build
```

### Update Deployment
```bash
# Push changes to trigger automatic deployment
git add .
git commit -m "Update frontend"
git push origin main
```

---

## 📞 Support Resources

- **Netlify Documentation**: [docs.netlify.com](https://docs.netlify.com)
- **Community Forum**: [community.netlify.com](https://community.netlify.com)
- **Status Page**: [netlifystatus.com](https://netlifystatus.com)

---

## ✅ Pre-Deployment Checklist

- [ ] Code pushed to Git repository
- [ ] `netlify.toml` properly configured
- [ ] Environment variables set
- [ ] Build command tested locally
- [ ] No TypeScript/linting errors
- [ ] API endpoints accessible
- [ ] Custom domain configured (if needed)
- [ ] SSL certificate ready (automatic)

---

**Your FRA Atlas frontend is now ready for deployment! 🎉**

Choose the deployment method that works best for you and follow the steps above. The configuration is already optimized for production deployment.