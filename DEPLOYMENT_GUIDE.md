# 🚀 FRA Atlas Deployment Guide

## 📋 Overview

This guide provides step-by-step instructions for deploying the FRA Atlas application with both frontend and backend connected using Docker.

## 🎯 Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │   Frontend      │    │   Backend       │
│   Port: 80      │◄──►│   Port: 3000    │◄──►│   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   Redis Cache   │    │ Data Processor  │
│   Port: 5432    │    │   Port: 6379    │    │   Port: 8001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Prerequisites

### Required Software
- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
- **Docker Compose** (included with Docker Desktop)
- **Git** (for cloning the repository)

### System Requirements
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 10GB free space
- **CPU**: 2+ cores recommended
- **OS**: Windows 10+, macOS 10.14+, or Linux

## 🚀 Quick Deployment

### Option 1: Automated Deployment (Recommended)

#### Windows
```bash
# Run the deployment script
deploy.bat
```

#### Linux/macOS
```bash
# Make script executable and run
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Deployment

#### Step 1: Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd fra-atlas

# Copy environment configuration
cp env.example .env
# Edit .env with your configuration values
```

#### Step 2: Deploy with Docker Compose
```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# Check service status
docker-compose -f docker-compose.prod.yml ps
```

## 🔧 Configuration

### Environment Variables (.env)

Create a `.env` file with the following configuration:

```env
# Application Settings
NODE_ENV=production
PORT=8000
FRONTEND_URL=http://localhost:3000

# Database Configuration
DATABASE_URL=postgresql://fra_user:fra_password@postgres:5432/fra_atlas
DB_HOST=postgres
DB_PORT=5432
DB_NAME=fra_atlas
DB_USER=fra_user
DB_PASSWORD=fra_password

# Redis Configuration
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024
JWT_EXPIRES_IN=24h

# Mapbox Configuration (Optional)
MAPBOX_TOKEN=your-mapbox-access-token-here
REACT_APP_MAPBOX_TOKEN=pk.your-mapbox-token-here

# Security Settings
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Mapbox Configuration (Optional)

To enable advanced mapping features:

1. Sign up at [Mapbox](https://www.mapbox.com/)
2. Get your access token from the dashboard
3. Add it to your `.env` file:
   ```env
   MAPBOX_TOKEN=your-mapbox-access-token-here
   REACT_APP_MAPBOX_TOKEN=pk.your-mapbox-token-here
   ```

## 🌐 Accessing the Application

### URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Nginx Proxy**: http://localhost:80
- **Health Check**: http://localhost:8000/health

### Default Login Credentials
- **Admin Account**:
  - Email: `admin@fraatlas.gov.in`
  - Password: `admin123`
  - Role: Full system access

- **Test User Account**:
  - Email: `test@example.com`
  - Password: `testpass123`
  - Role: Basic user access

## 🔍 Monitoring and Management

### View Logs
```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs

# View specific service logs
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs postgres
```

### Service Management
```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend

# View service status
docker-compose -f docker-compose.prod.yml ps
```

### Health Checks
```bash
# Check if services are healthy
docker-compose -f docker-compose.prod.yml ps

# Test API health
curl http://localhost:8000/health

# Test frontend
curl http://localhost:3000
```

## 🗄️ Database Management

### Access Database
```bash
# Connect to PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres psql -U fra_user -d fra_atlas

# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migrate
```

### Backup Database
```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U fra_user fra_atlas > backup.sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U fra_user fra_atlas < backup.sql
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
netstat -tulpn | grep :3000
netstat -tulpn | grep :8000

# Kill the process or change ports in docker-compose.prod.yml
```

#### 2. Database Connection Issues
```bash
# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Restart database
docker-compose -f docker-compose.prod.yml restart postgres
```

#### 3. Frontend Build Issues
```bash
# Rebuild frontend
docker-compose -f docker-compose.prod.yml build --no-cache frontend
docker-compose -f docker-compose.prod.yml up -d frontend
```

#### 4. Memory Issues
```bash
# Check Docker memory usage
docker stats

# Increase Docker memory limit in Docker Desktop settings
```

### Log Analysis
```bash
# View error logs
docker-compose -f docker-compose.prod.yml logs --tail=100 | grep ERROR

# View access logs
docker-compose -f docker-compose.prod.yml logs nginx | grep "GET\|POST"
```

## 🔒 Security Considerations

### Production Security Checklist
- [ ] Change default JWT secret
- [ ] Use strong database passwords
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure firewall rules
- [ ] Regular security updates
- [ ] Monitor access logs
- [ ] Backup data regularly

### SSL/HTTPS Setup
1. Obtain SSL certificates
2. Place certificates in `nginx/ssl/` directory
3. Update `nginx/nginx.conf` for HTTPS
4. Restart nginx service

## 📊 Performance Optimization

### Resource Allocation
```yaml
# In docker-compose.prod.yml
services:
  postgres:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

### Caching
- Redis is configured for session caching
- Static files are cached by Nginx
- Database query caching is enabled

## 🔄 Updates and Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### Regular Maintenance
- Monitor disk space usage
- Clean up old Docker images: `docker system prune`
- Update dependencies regularly
- Monitor application logs

## 📞 Support

### Getting Help
- Check the logs for error messages
- Review this deployment guide
- Check the main README.md for application features
- Create an issue in the repository

### Useful Commands
```bash
# Full system status
docker-compose -f docker-compose.prod.yml ps
docker system df
docker system info

# Clean up
docker-compose -f docker-compose.prod.yml down --volumes
docker system prune -a
```

---

## 🎉 Success!

Your FRA Atlas application should now be running successfully with:
- ✅ Frontend accessible at http://localhost:3000
- ✅ Backend API running on http://localhost:8000
- ✅ Database and Redis services running
- ✅ Nginx reverse proxy configured
- ✅ All services connected and communicating

Enjoy using the FRA Atlas platform! 🌳
