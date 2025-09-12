# 📋 FRA Atlas Deployment Checklist

## Pre-Deployment
- [ ] Code is committed to GitHub
- [ ] All tests pass locally
- [ ] Environment files are configured
- [ ] Database schema is ready

## Railway Backend Deployment
- [ ] Railway account created and connected to GitHub
- [ ] New project created from GitHub repo
- [ ] PostgreSQL database added to project
- [ ] Environment variables configured:
  - [ ] `NODE_ENV=production`
  - [ ] `JWT_SECRET` (secure random string)
  - [ ] `FRONTEND_URL` (your Netlify URL)
  - [ ] `CORS_ORIGIN` (your Netlify URL)
- [ ] Database schema deployed
- [ ] Health check endpoint working: `/health`
- [ ] Backend URL noted for frontend config

## Netlify Frontend Deployment
- [ ] Netlify account created and connected to GitHub
- [ ] New site created from GitHub repo
- [ ] Build settings configured:
  - [ ] Base directory: `frontend`
  - [ ] Build command: `npm run build`
  - [ ] Publish directory: `frontend/build`
- [ ] Environment variables configured:
  - [ ] `REACT_APP_API_URL` (your Railway URL + `/api`)
  - [ ] `CI=false`
  - [ ] `GENERATE_SOURCEMAP=false`
- [ ] Custom domain configured (optional)
- [ ] HTTPS enabled

## Post-Deployment Testing
- [ ] Frontend loads without errors
- [ ] Login functionality works
- [ ] API calls successful (check Network tab)
- [ ] All major features functional:
  - [ ] Authentication
  - [ ] Bhunaksha land records
  - [ ] WebGIS mapping
  - [ ] Document processing
  - [ ] Analytics dashboard
- [ ] Mobile responsiveness verified
- [ ] Performance acceptable (< 3s load time)

## Security Verification
- [ ] HTTPS enabled on both platforms
- [ ] CORS configured correctly
- [ ] JWT tokens working
- [ ] No sensitive data in client-side code
- [ ] Security headers configured
- [ ] Rate limiting active

## Monitoring Setup
- [ ] Railway logs monitored
- [ ] Netlify build logs checked
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Database backup scheduled

## Documentation
- [ ] Deployment URLs documented
- [ ] Environment variables documented
- [ ] Access credentials secured
- [ ] Team members notified
- [ ] User guide updated

## Rollback Plan
- [ ] Previous version tagged in Git
- [ ] Database backup available
- [ ] Rollback procedure documented
- [ ] Emergency contacts identified

---

**✅ Deployment Complete!**

**URLs:**
- Frontend: https://your-app.netlify.app
- Backend: https://your-app.railway.app
- Health Check: https://your-app.railway.app/health

**Next Steps:**
1. Monitor for 24 hours
2. Gather user feedback
3. Plan next iteration