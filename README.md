# 🌳 Forest Rights Act (FRA) Atlas & Data Digitization Platform

## 📋 Project Overview

The Forest Rights Act (FRA) Atlas is a comprehensive digital platform designed to address the critical bottlenecks in FRA governance and development planning. This project aims to digitize, integrate, and visualize FRA data while providing decision support for policy implementation.

### 🎯 **Current Status: FULLY OPERATIONAL**
- ✅ **Complete Authentication System** with JWT security and role-based access control
- ✅ **Professional WebGIS Interface** with interactive mapping and real-time visualization
- ✅ **Digital GIS Plot System** - QGIS-like interface for land record digitization
- ✅ **Multilingual OCR & NER Processing** (Hindi, English, Marathi)
- ✅ **Advanced Decision Support System** with eligibility evaluation and prioritization
- ✅ **Comprehensive Data Management** with export capabilities
- ✅ **Real-time Analytics Dashboard** with interactive charts and statistics

## 🎯 Key Objectives

### 1. **Data Digitization & Standardization**
- Digitize legacy IFR, CR, and CFR claims/pattas
- Standardize data formats and create centralized archives
- Implement OCR and AI-based document processing

### 2. **Spatial Integration & Verification**
- Link claims with spatial data (GPS coordinates, boundaries)
- Implement verification workflows with GIS integration
- Create audit trails for claim validation

### 3. **Integrated Visualization & Monitoring**
- Develop national/state-level FRA Atlas with real-time dashboards
- Implement WebGIS for spatial data visualization
- Create interactive maps and analytics

### 4. **Decision Support System (DSS)**
- Integrate FRA data with Central Sector Schemes (CSS)
- PM-KISAN integration for beneficiary mapping
- Jal Jeevan Mission coordination
- MGNREGA work allocation optimization
- DAJGUA scheme integration

## 🏗️ Technical Architecture

### Frontend
- **React.js 18.2** with TypeScript for robust UI development
- **Mapbox GL JS 2.15** & **MapLibre GL JS 5.7** for advanced GIS visualization
- **Material-UI 5.14** for consistent design system
- **Redux Toolkit 1.9** for state management
- **Recharts 2.8** for interactive data visualization
- **Axios 1.6** for API communication

### Backend
- **Node.js 18+** with Express.js 4.19 for API development
- **PostgreSQL 14+** with PostGIS extension for spatial data
- **JWT Authentication** with bcryptjs for password hashing
- **Express Validator** for input validation
- **Winston** for comprehensive logging
- **Helmet** for security headers
- **CORS** for cross-origin resource sharing

### Data Processing
- **Python 3.9+** with FastAPI for data processing pipelines
- **Tesseract.js 5.0** for multilingual OCR processing
- **OpenCV** for computer vision tasks
- **GeoPandas** for spatial data manipulation
- **Pandas** for data analysis and transformation

### Authentication & Security
- **JWT Tokens** with 24-hour expiration
- **Role-based Access Control** (admin, state_admin, district_admin, block_admin, user)
- **Password Hashing** with bcryptjs (12 salt rounds)
- **Protected Routes** with middleware authentication
- **Input Validation** with express-validator

### Infrastructure
- **Docker** for containerization
- **Nginx** for reverse proxy
- **Environment Configuration** with dotenv
- **Rate Limiting** with express-rate-limit
- **Compression** for response optimization

## 📁 Project Structure

```
fra-atlas/
├── frontend/                 # React.js frontend application
├── backend/                  # Node.js API server
├── data-processor/           # Python data processing services
├── database/                 # Database schemas and migrations
├── docs/                     # Documentation
├── docker/                   # Docker configurations
└── scripts/                  # Utility scripts
```

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** (for frontend and backend)
- **Python 3.9+** (for data processing services)
- **PostgreSQL 14+** with PostGIS extension (for spatial data)
- **Docker & Docker Compose** (recommended for easy setup)

### 🏃‍♂️ Quick Start (Recommended)

#### Option 1: Docker Setup (Easiest)
```bash
# 1. Clone the repository
git clone <repository-url>
cd fra-atlas

# 2. Copy environment configuration
cp env.example .env

# 3. Start all services with Docker
docker-compose up -d

# 4. Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

#### Option 2: Local Development Setup
```bash
# 1. Clone and setup
git clone <repository-url>
cd fra-atlas

# 2. Setup environment
cp env.example .env
# Edit .env with your database credentials

# 3. Setup database
node setup-database.js

# 4. Start backend (Terminal 1)
cd backend
npm install
npm run dev

# 5. Start frontend (Terminal 2)
cd frontend
npm install
npm start

# 6. Access the application at http://localhost:3000
```

### 🔧 Configuration

#### Environment Variables (.env)
```env
# Database Configuration
DATABASE_URL=postgresql://fra_user:fra_password@localhost:5432/fra_atlas

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Application Settings
NODE_ENV=development
PORT=8000
FRONTEND_URL=http://localhost:3000

# Mapbox Token (Optional)
REACT_APP_MAPBOX_TOKEN=pk.your-mapbox-token-here
```

#### Map Configuration
- **Free Mode (Default)**: Uses OpenStreetMap via MapLibre - no token required
- **Mapbox Mode**: Add `REACT_APP_MAPBOX_TOKEN` in `frontend/.env` to unlock:
  - Advanced polygon drawing tools
  - Geometry validation
  - Enhanced styling options
- **External Overlays**: ESA WorldCover and JRC Water tiles fetched via `/api/proxy/tiles/...` (CORS-safe)

### 🔑 Default Login Credentials

#### Admin Account
- **Email**: `admin@fraatlas.gov.in`
- **Password**: `admin123`
- **Role**: `admin` (full system access)

#### Test User Account
- **Email**: `test@example.com`
- **Password**: `testpass123`
- **Role**: `user` (basic access)

### 🧪 Testing the Setup
```bash
# Test authentication system
node test-auth.js

# Test login functionality
node test-login.js

# Test profile and logout
node test-profile-logout.js
```

## 📊 Key Features

### 🔐 Authentication & User Management
- [x] **Complete JWT Authentication System** with secure token management
- [x] **Role-based Access Control** (admin, state_admin, district_admin, block_admin, user)
- [x] **User Registration & Login** with form validation
- [x] **Password Security** with bcrypt hashing (12 salt rounds)
- [x] **Protected Routes** with middleware authentication
- [x] **User Profile Management** with role-specific permissions
- [x] **Multi-level Administrative Hierarchy** based on geographic scope

### 📄 Data Management & Digitization
- [x] **Document Upload Interface** with drag-and-drop support
- [x] **Multilingual OCR Processing** (Hindi, English, Marathi) using Tesseract.js
- [x] **Advanced NER Extraction** for FRA-specific entities (villages, claimants, land details)
- [x] **Real-time Text Processing** with confidence scoring
- [x] **Document Preview** with extracted text and entities
- [x] **Data Export** in multiple formats (JSON, CSV, GeoJSON)

### 🗺️ Interactive Mapping & Visualization
- [x] **Professional WebGIS Interface** with Mapbox/MapLibre integration
- [x] **Multiple Base Maps** (Satellite, Streets, Terrain, OpenStreetMap)
- [x] **Interactive FRA Atlas** with real-time filtering and visualization
- [x] **Advanced Drawing Tools** (polygon, point, line drawing)
- [x] **Remote-sensing Overlays** (ESA WorldCover, JRC Water) via backend proxy
- [x] **Real-time Statistics** and area analysis
- [x] **Fullscreen Mode** for detailed mapping work

### 🎯 Digital GIS Plot System
- [x] **QGIS-like Professional Interface** for land record digitization
- [x] **Patta/FRA Title Management** with complete data entry forms
- [x] **Cadastral Layer Integration** with survey number overlays
- [x] **Geometry Validation** with automatic polygon validation
- [x] **Step-by-Step Workflow** for guided digitization
- [x] **Export Capabilities** (PDF, GeoJSON, KML, CSV)
- [x] **3D Visualization** with tilted perspective

### 📊 Analytics & Decision Support
- [x] **Real-time Dashboards** with interactive charts and statistics
- [x] **Eligibility Evaluation System** with configurable rules
- [x] **Prioritization Engine** for resource allocation
- [x] **Policy Dashboard Metrics** (national/state level KPIs)
- [x] **Time-series Analytics** with trend analysis
- [x] **Interactive Reports** with drill-down capabilities

### 🔧 System Features
- [x] **Mobile-responsive Design** with adaptive UI
- [x] **Comprehensive Logging** with Winston logger
- [x] **Error Handling** with user-friendly error messages
- [x] **Rate Limiting** for API protection
- [x] **Security Headers** with Helmet middleware
- [x] **CORS Configuration** for cross-origin requests

## ✅ Fully Implemented Features

### 🎯 **Core System Components**
- ✅ **Complete Authentication System** with JWT security and role-based access
- ✅ **Professional WebGIS Interface** with interactive mapping and real-time visualization
- ✅ **Digital GIS Plot System** - QGIS-like interface for land record digitization
- ✅ **Multilingual OCR & NER Processing** (Hindi, English, Marathi)
- ✅ **Advanced Decision Support System** with eligibility evaluation and prioritization
- ✅ **Real-time Analytics Dashboard** with interactive charts and statistics
- ✅ **Comprehensive Data Management** with export capabilities

### 🗺️ **Mapping & Visualization**
- ✅ **Interactive FRA Atlas** with filters (state/district/block/village/tribal group)
- ✅ **Auto fit-to-bounds** and Mapbox/OSM support
- ✅ **AI/ML assets toggles** (agriculture/forest/water/homestead/infrastructure)
- ✅ **Remote-sensing overlays** (WorldCover, JRC Water) via backend proxy
- ✅ **Advanced drawing tools** with polygon validation

### 📊 **Analytics & Reports**
- ✅ **Dashboard & Reports** with time-series and top-districts charts
- ✅ **DSS module** (eligibility + prioritization + KPIs) with expandable rules
- ✅ **Interactive data visualization** with drill-down capabilities

## 🔌 Complete API Endpoints

### 🔐 Authentication Endpoints
```http
POST /api/auth/register              # Register new user with role assignment
POST /api/auth/login                 # User login with JWT token
GET  /api/auth/me                    # Get current user profile
POST /api/auth/change-password       # Change user password
```

### 🗺️ FRA Atlas & Mapping
```http
GET  /api/fra/atlas/geojson          # FRA features with advanced filtering
GET  /api/fra/atlas/filters          # Filter options (states, districts, blocks, villages)
POST /api/fra/atlas/validate         # Validate drawn polygon (Mapbox mode)
GET  /api/fra/atlas/statistics       # Real-time statistics and analytics
```

### 📄 Document Processing & Digitization
```http
POST /api/digitization/ocr           # Multilingual OCR processing (Hindi/English/Marathi)
POST /api/digitization/ner           # Named Entity Recognition for FRA entities
POST /api/digitization/cv/detect     # Computer vision detections
GET  /api/digitization/status/:id    # Processing status and results
```

### 🎯 Digital GIS Plot System
```http
GET  /api/gis-plot/patta            # Get all Patta records
POST /api/gis-plot/patta            # Create new Patta record
PUT  /api/gis-plot/patta/:id        # Update Patta record
DELETE /api/gis-plot/patta/:id      # Delete Patta record
GET  /api/gis-plot/cadastral-layers # Get cadastral layers
POST /api/gis-plot/validate-geometry # Validate polygon geometry
GET  /api/gis-plot/export/:format   # Export data (PDF/GeoJSON/KML/CSV)
```

### 📊 Decision Support System
```http
GET  /api/fra/dss/eligibility       # DSS eligibility evaluation
GET  /api/fra/dss/prioritize        # DSS prioritization engine
GET  /api/fra/dss/metrics           # KPI dashboard metrics
POST /api/fra/dss/evaluate          # Custom evaluation rules
```

### 📈 Reports & Analytics
```http
GET  /api/fra/reports/summary       # Reports & analytics summary
GET  /api/fra/reports/timeseries    # Time-series data
GET  /api/fra/reports/breakdowns    # Detailed breakdowns by region/type
GET  /api/fra/reports/export        # Export reports in multiple formats
```

### 🔧 System & Proxy Endpoints
```http
GET  /health                        # System health check
GET  /api/proxy/tiles/:source/:z/:x/:y.png  # External tiles (worldcover|gsw)
GET  /api/data/upload               # File upload endpoint
GET  /api/data/download/:id         # File download endpoint
```

## 🎯 Key System Modules

### 🔐 Authentication & Security Module
- **JWT-based Authentication** with secure token management
- **Role-based Access Control** with 5 user roles (admin, state_admin, district_admin, block_admin, user)
- **Password Security** with bcrypt hashing and salt rounds
- **Protected Routes** with middleware authentication
- **User Profile Management** with role-specific permissions

### 🗺️ FRA Atlas Module
- **Interactive WebGIS Interface** with professional mapping tools
- **Real-time Data Visualization** with filtering and analytics
- **Multiple Base Maps** (Satellite, Streets, Terrain, OpenStreetMap)
- **Advanced Drawing Tools** with polygon validation
- **Remote-sensing Integration** with ESA WorldCover and JRC Water overlays

### 🎯 Digital GIS Plot Module
- **QGIS-like Professional Interface** for land record digitization
- **Patta/FRA Title Management** with comprehensive data entry
- **Cadastral Layer Integration** with survey number overlays
- **Geometry Validation** with automatic polygon validation
- **Export Capabilities** (PDF, GeoJSON, KML, CSV)

### 📄 Document Processing Module
- **Multilingual OCR Processing** (Hindi, English, Marathi)
- **Advanced NER Extraction** for FRA-specific entities
- **Document Upload Interface** with drag-and-drop support
- **Real-time Text Processing** with confidence scoring
- **Entity Recognition** for names, locations, dates, and financial data

### 📊 Decision Support Module
- **Eligibility Evaluation System** with configurable rules
- **Prioritization Engine** for resource allocation
- **Policy Dashboard Metrics** with national/state level KPIs
- **Interactive Analytics** with drill-down capabilities
- **Custom Evaluation Rules** for different schemes

### 📈 Analytics & Reporting Module
- **Real-time Dashboards** with interactive charts
- **Time-series Analytics** with trend analysis
- **Comprehensive Reports** with multiple export formats
- **Statistical Analysis** with regional breakdowns
- **Data Visualization** with Recharts integration

## 🧭 Future Roadmap
- **PostGIS Schema Enhancement** with legacy FRA claims/pattas importer
- **GeoServer/WMTS Integration** for large raster tiling
- **Human-in-loop Review Workflow** for OCR/NER/CV with audit trail
- **Full CSS Rules Engine** (PM‑KISAN, JJM, MGNREGA, DAJGUA) integration
- **Mobile Application** for field data collection
- **Advanced AI/ML Models** for automated claim processing
- **Blockchain Integration** for immutable audit trails

## 📚 Documentation

### 📖 Available Guides
- **[Authentication Setup Guide](AUTHENTICATION_SETUP.md)** - Complete authentication system setup
- **[Digital GIS Plot Guide](DIGITAL_GIS_PLOT_GUIDE.md)** - QGIS-like interface documentation
- **[Geospatial Features Guide](GEOSPATIAL_FEATURES_GUIDE.md)** - Mapping and visualization features
- **[Complete Setup Guide](COMPLETE_SETUP_GUIDE.md)** - Professional system setup instructions
- **[Profile & Logout Guide](PROFILE_LOGOUT_GUIDE.md)** - User management features
- **[Mapbox Setup Guide](MAPBOX_SETUP.md)** - Mapbox integration instructions

### 🔧 System Status
- **[System Operational Status](SYSTEM_OPERATIONAL_STATUS.md)** - Current system status
- **[Final Resolution Status](FINAL_RESOLUTION_STATUS.md)** - Issue resolution summary
- **[Final System Status](FINAL_SYSTEM_STATUS.md)** - Complete system overview

## 🧪 Testing & Quality Assurance

### Automated Testing
```bash
# Run authentication tests
node test-auth.js

# Test login functionality
node test-login.js

# Test profile and logout
node test-profile-logout.js

# Clear authentication data
node clear-auth.js
```

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Role-based access control
- [ ] FRA Atlas mapping functionality
- [ ] Digital GIS Plot digitization
- [ ] Document upload and OCR processing
- [ ] Decision support system
- [ ] Reports and analytics
- [ ] Export functionality

## 🤝 Contributing

Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

### Contact Information
- **Project Repository**: [GitHub Repository URL]
- **Documentation**: [Documentation URL]
- **Issue Tracker**: [Issues URL]
- **Development Team**: [Team Contact Information]

---

## 🎉 **System Status: FULLY OPERATIONAL**

The FRA Atlas platform is now fully operational with comprehensive features including authentication, WebGIS mapping, document processing, decision support, and analytics. All core modules are implemented and tested, providing a professional-grade solution for Forest Rights Act governance and development planning.

