Write-Host "🚀 FRA Atlas Windows Deployment Script" -ForegroundColor Green
Write-Host ""

# Check if Railway CLI is installed
try {
    railway --version | Out-Null
    Write-Host "✅ Railway CLI is already installed" -ForegroundColor Green
} catch {
    Write-Host "📦 Installing Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
}

Write-Host ""
Write-Host "🔧 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Login to Railway:" -ForegroundColor White
Write-Host "   railway login" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Link to your project:" -ForegroundColor White
Write-Host "   railway link -p ac655604-ac55-4f56-95e1-feafeaf00aed" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Deploy backend:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   railway up" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Configure environment variables in Railway dashboard:" -ForegroundColor White
Write-Host "   - NODE_ENV=production" -ForegroundColor Gray
Write-Host "   - JWT_SECRET=your-secure-secret-key" -ForegroundColor Gray
Write-Host "   - FRONTEND_URL=https://your-netlify-app.netlify.app" -ForegroundColor Gray
Write-Host "   - CORS_ORIGIN=https://your-netlify-app.netlify.app" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Add PostgreSQL database in Railway dashboard" -ForegroundColor White
Write-Host ""
Write-Host "📖 See DEPLOYMENT.md for detailed instructions" -ForegroundColor Yellow

# Prompt to continue
Write-Host ""
Write-Host "Press Enter to open Railway login in browser..." -ForegroundColor Green
Read-Host

# Try to open Railway login
try {
    Start-Process "https://railway.app/login"
} catch {
    Write-Host "Please manually visit: https://railway.app/login" -ForegroundColor Yellow
}