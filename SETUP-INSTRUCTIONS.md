# 🌳 FRA Atlas - Complete Setup Instructions

## 🚀 Quick Start (Recommended)

### Option 1: Automatic Setup (Easiest)
```bash
# Simply run this batch file on Windows:
MAKE-ALL-WORK.bat

# Or run the Node.js script directly:
node make-all-functions-work.js
```

This will automatically:
- ✅ Fix all missing dependencies
- ✅ Create required directories
- ✅ Setup environment configuration
- ✅ Start all services
- ✅ Verify all functions are working

### Option 2: Manual Setup
```bash
# 1. Fix all issues first
node fix-all-functions.js

# 2. Start all services
node start-all-services.js

# 3. Verify everything works
node verify-functions.js
```

## 📋 Prerequisites

### Required Software
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** (optional) - For cloning the repository
- **Modern web browser** - Chrome, Firefox, Safari, or Edge

### System Requirements
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **Network**: Internet connection for external map tiles
- **Ports**: 3000 (frontend) and 8000 (backend) must be available

## 🎯 What Gets Installed & Started

### Frontend (React.js)
- **Port**: 3000
- **URL**: http://localhost:3000
- **Features**: 
  - Interactive FRA Atlas mapping
  - Digital GIS Plot system
  - Document management interface
  - Analytics dashboard
  - Multi-language support

### Backend (Node.js API)
- **Port**: 8000
- **URL**: http://localhost:8000
- **Features**:
  - Authentication system
  - FRA data management
  - Document processing & OCR
  - Decision support system
  - Translation services
  - Proxy for external map tiles

## 🔐 Default Login Credentials

```
Email: admin@fraatlas.gov.in
Password: admin123
```

**Note**: Change these credentials in production!

## 🧪 Testing & Verification

### Health Check
```bash
# Check if all services are running
node health-check.js

# Or visit: http://localhost:8000/health
```

### Function Verification
```bash
# Test all major functions
node verify-functions.js
```

### Manual Testing
1. **Authentication**: Try logging in with default credentials
2. **FRA Atlas**: Navigate to Atlas page and check map loading
3. **GIS Plot**: Test the Digital GIS Plot functionality
4. **Data Management**: Upload a test document
5. **Reports**: Check the analytics dashboard

## 📁 Project Structure

```
FRA/
├── frontend/                 # React.js application
├── backend/                  # Node.js API server
├── uploads/                  # File upload storage
├── logs/                     # Application logs
├── MAKE-ALL-WORK.bat        # Quick start script
├── make-all-functions-work.js # Master setup script
├── fix-all-functions.js     # Fix issues script
├── health-check.js          # Health verification
└── verify-functions.js      # Function testing
```

## 🔧 Available Scripts

### Setup & Fix Scripts
- `MAKE-ALL-WORK.bat` - Complete automatic setup (Windows)
- `make-all-functions-work.js` - Master setup script
- `fix-all-functions.js` - Fix all system issues
- `start-all-services.js` - Start frontend and backend

### Testing Scripts
- `health-check.js` - Check service health
- `verify-functions.js` - Test all functions
- `setup-database.js` - Initialize database (optional)

### Legacy Scripts
- `start-fra-atlas.bat` - Alternative startup script
- `start-app.bat` - Simple startup script

## 🌐 Key Features Available

### 🗺️ FRA Atlas
- Interactive mapping with multiple base layers
- Real-time FRA claim visualization
- Advanced filtering by state/district/block
- Asset mapping (agriculture, forest, water, etc.)
- Boundary validation and geometry tools

### 🎯 Digital GIS Plot System
- QGIS-like interface for land digitization
- Patta/title management
- Cadastral layer integration
- Export capabilities (PDF, GeoJSON, KML)

### 📄 Document Processing
- Multilingual OCR (Hindi, English, Marathi)
- Named Entity Recognition for FRA data
- Batch document processing
- Archive creation and management

### 🎯 Decision Support System
- Eligibility evaluation for CSS schemes
- Prioritization algorithms
- Policy dashboard metrics
- Integration with PM-KISAN, JJM, MGNREGA

### 📊 Analytics & Reports
- Real-time dashboards
- Time-series analysis
- Interactive charts and visualizations
- Export capabilities

### 🌐 Translation System
- 25+ Indian languages support
- Real-time UI translation
- Persistent language preferences

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using the ports
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# Kill the process if needed
taskkill /PID <process_id> /F
```

#### Node.js Not Found
- Install Node.js 18+ from https://nodejs.org/
- Restart your terminal/command prompt
- Verify with: `node --version`

#### Permission Errors
- Run command prompt as Administrator
- Or use: `npm config set prefix %APPDATA%\npm`

#### Services Not Starting
```bash
# Try manual installation
cd backend && npm install
cd ../frontend && npm install

# Check for errors in logs
type backend\logs\error.log
```

#### Frontend Build Issues
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

### Getting Help

1. **Check the logs**: Look in `backend/logs/` for error details
2. **Run health check**: `node health-check.js`
3. **Verify functions**: `node verify-functions.js`
4. **Check ports**: Make sure 3000 and 8000 are available
5. **Restart services**: Stop and run `MAKE-ALL-WORK.bat` again

## 🎉 Success Indicators

When everything is working correctly, you should see:

✅ **Backend Health Check**: http://localhost:8000/health returns OK
✅ **Frontend Loading**: http://localhost:3000 shows the login page
✅ **Authentication**: Can login with admin credentials
✅ **Atlas Loading**: Map displays with FRA data
✅ **All Functions**: Verification script shows all tests passing

## 📞 Support

If you encounter issues:

1. Check this troubleshooting guide
2. Run the health check and verification scripts
3. Check the application logs
4. Ensure all prerequisites are met
5. Try the automatic setup script again

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Fully Operational