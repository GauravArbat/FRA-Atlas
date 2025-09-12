# 🌳 Forest Rights Act (FRA) Atlas & Data Digitization Platform

## 📋 Project Overview

The Forest Rights Act (FRA) Atlas is a comprehensive digital platform designed to address critical bottlenecks in FRA governance and development planning for **Madhya Pradesh, Tripura, Odisha, and Telangana**. This AI-powered system digitizes, integrates, and visualizes FRA data while providing decision support for policy implementation.

### 🎯 **Current Status: FULLY OPERATIONAL**
- ✅ **Complete Authentication System** with JWT security and role-based access control
- ✅ **Professional WebGIS Interface** with interactive mapping and real-time visualization
- ✅ **Bhunaksha-style Land Records** with plot-wise search and visualization
- ✅ **Digital GIS Plot System** - QGIS-like interface for land record digitization
- ✅ **Multilingual OCR & NER Processing** (Hindi, English, Marathi)
- ✅ **Advanced Decision Support System** with eligibility evaluation and prioritization
- ✅ **Comprehensive Data Management** with export capabilities
- ✅ **Real-time Analytics Dashboard** with interactive charts and statistics

## 🎯 Key Objectives

### 1. **Data Digitization & Standardization**
- Digitize legacy IFR, CR, and CFR claims/pattas using AI-powered OCR
- Standardize data formats and create centralized archives
- Named Entity Recognition (NER) for extracting village names, patta holders, coordinates

### 2. **AI-based Asset Mapping**
- Computer Vision on satellite imagery to detect agricultural land, forest cover, water bodies
- Land-use classification using supervised ML models
- Integration with forest data, groundwater data, and infrastructure data

### 3. **WebGIS Integration & Visualization**
- Interactive layers (IFR/CR, village boundaries, land-use, assets)
- Filters by state/district/village/tribal group
- FRA progress tracking at village/block/district/state level

### 4. **Decision Support System (DSS)**
- Cross-link FRA holders with CSS schemes (PM-KISAN, Jal Jeevan Mission, MGNREGA, DAJGUA)
- AI-enhanced prioritization for interventions (borewells, infrastructure)
- Rule-based eligibility evaluation

## 🏗️ Technical Architecture

### Frontend Stack
- **React.js 18.2** with TypeScript for robust UI development
- **Material-UI 5.14** for professional design system
- **Leaflet 1.9.4** with MapLibre GL JS 5.7 for advanced GIS visualization
- **Redux Toolkit 1.9** for state management
- **Recharts 2.8** for interactive data visualization
- **Axios 1.6** for API communication

### Backend Stack
- **Node.js 18+** with Express.js 4.19 for API development
- **PostgreSQL 14+** with PostGIS extension for spatial data
- **JWT Authentication** with bcryptjs password hashing
- **Winston** for comprehensive logging
- **Multer** for file uploads
- **Tesseract.js 5.0** for OCR processing

### Data Processing Stack
- **Python 3.9+** with FastAPI for data processing pipelines
- **GeoPandas** for spatial data manipulation
- **OpenCV** for computer vision tasks
- **Pandas** for data analysis and transformation

### Security & Infrastructure
- **JWT Tokens** with 24-hour expiration
- **Role-based Access Control** (admin, state_admin, district_admin, block_admin, user)
- **Docker** containerization with docker-compose
- **Nginx** reverse proxy
- **Rate Limiting** and **CORS** protection

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **Python 3.9+**
- **PostgreSQL 14+** with PostGIS
- **Docker & Docker Compose** (recommended)

### Installation

#### Option 1: Docker Setup (Recommended)
```bash
# Clone repository
git clone <repository-url>
cd fra-atlas

# Copy environment configuration
cp env.example .env

# Start all services
docker-compose up -d

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

#### Option 2: Local Development
```bash
# Setup environment
cp env.example .env
# Edit .env with your database credentials

# Setup database
node setup-database.js

# Start backend
cd backend && npm install && npm run dev

# Start frontend (new terminal)
cd frontend && npm install && npm start
```

### 🔑 Default Credentials
- **Admin**: `admin@fraatlas.gov.in` / `admin123`
- **Test User**: `test@example.com` / `testpass123`

## 📊 Core Features

### 🔐 Authentication & User Management
- **JWT-based Authentication** with secure token management
- **5-tier Role System**: admin → state_admin → district_admin → block_admin → user
- **Geographic Access Control** based on administrative boundaries
- **Password Security** with bcrypt hashing (12 salt rounds)

### 🗺️ Bhunaksha-style Land Records System
- **Plot-wise Search**: Khasra number, owner name, village records
- **Interactive Map Visualization** with plot boundaries
- **Detailed Land Information**: Owner details, survey numbers, FRA status
- **Official Certificates** generation and printing
- **Mutation History** tracking for audit trails
- **All Plots Layer** showing complete land records across target states

### 📄 AI-Powered Document Processing
- **Multilingual OCR** (Hindi, English, Marathi) using Tesseract.js
- **Named Entity Recognition** for FRA-specific data extraction
- **PDF Processing** with automatic coordinate extraction
- **Batch Processing** for multiple documents
- **Confidence Scoring** for OCR accuracy assessment

### 🎯 Digital GIS Plot System
- **QGIS-like Interface** for professional land record digitization
- **Cadastral Layer Integration** with survey number overlays
- **Geometry Validation** with automatic polygon validation
- **Multi-format Export** (PDF, GeoJSON, KML, CSV)
- **Step-by-step Workflow** for guided digitization

### 📊 Advanced Analytics & Decision Support
- **Real-time Dashboards** with interactive charts
- **Eligibility Evaluation** for CSS schemes integration
- **Prioritization Engine** for resource allocation
- **Time-series Analytics** with trend analysis
- **Policy Metrics** at national/state/district levels

### 🌍 Professional WebGIS Interface
- **Multiple Base Maps**: Satellite, Streets, Terrain, OpenStreetMap
- **Advanced Drawing Tools** with polygon, point, line support
- **Remote-sensing Overlays**: ESA WorldCover, JRC Water
- **Layer Management** with visibility controls
- **Fullscreen Mode** for detailed mapping work

## 🔌 API Endpoints

### Authentication
```http
POST /api/auth/login              # User login
POST /api/auth/register           # User registration
GET  /api/auth/me                 # Get user profile
POST /api/auth/change-password    # Change password
```

### Bhunaksha Land Records
```http
GET  /api/bhunaksha/search/khasra     # Search by Khasra number
GET  /api/bhunaksha/search/owner      # Search by owner name
GET  /api/bhunaksha/village/:district/:village  # Village records
GET  /api/bhunaksha/summary/:district # District summary
POST /api/bhunaksha/certificate       # Generate certificate
GET  /api/bhunaksha/all-records       # All land records
```

### FRA Atlas & Mapping
```http
GET  /api/fra/atlas/geojson       # FRA features with filtering
GET  /api/fra/atlas/filters       # Available filter options
POST /api/fra/atlas/validate      # Validate polygon geometry
GET  /api/fra/atlas/assets        # AI/ML asset mapping
```

### Document Processing
```http
POST /api/digitization/ocr        # OCR processing
POST /api/digitization/batch-process  # Batch OCR
POST /api/pdf-processor/process-pdf   # PDF processing
GET  /api/pdf-processor/processed-data # Get processed data
```

### Decision Support System
```http
GET  /api/fra/dss/eligibility     # Eligibility evaluation
GET  /api/fra/dss/prioritize      # Prioritization engine
GET  /api/fra/dss/metrics         # KPI dashboard metrics
```

### GIS Plot Management
```http
GET  /api/gis-plot/patta          # Patta records
POST /api/gis-plot/patta          # Create Patta record
GET  /api/gis-plot/export/:format # Export data
POST /api/gis-plot/validate-geometry # Validate geometry
```

## 🎯 Target States & Coverage

### Madhya Pradesh
- **Districts**: Balaghat, Mandla, Dindori, Seoni, Chhindwara, Betul
- **Tribal Groups**: Gond, Bhil
- **Sample Villages**: Khairlanji, Mandla

### Tripura
- **Districts**: West Tripura, South Tripura, Dhalai, North Tripura
- **Tribal Groups**: Tripuri, Kokborok
- **Sample Villages**: Gandacherra, Ambassa

### Odisha
- **Districts**: Mayurbhanj, Keonjhar, Sundargarh, Kandhamal, Rayagada, Koraput
- **Tribal Groups**: Santal, Kondh
- **Sample Villages**: Baripada, Phulbani

### Telangana
- **Districts**: Adilabad, Komaram Bheem, Mancherial, Bhadradri, Khammam, Mulugu
- **Tribal Groups**: Lambada, Gond
- **Sample Villages**: Utnoor, Mancherial

## 🗄️ Database Schema

### Core Tables
- **users**: User management with role-based access control
- **fra_claims**: FRA claims with spatial data (PostGIS geometry)
- **documents**: Document management with file metadata
- **css_integration**: Central Sector Schemes integration
- **audit_trail**: Complete audit logging with JSONB storage

### Spatial Features
- **PostGIS Extension** enabled for spatial operations
- **Spatial Indexes** on coordinates and boundary geometry
- **SRID 4326** support for global coordinate system

## 🚀 Deployment

### Docker Production Setup
```bash
# Production environment
cp env.example .env
# Configure production values in .env

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Setup SSL certificates
# Configure Nginx reverse proxy
```

### Environment Configuration
```env
# Database
DATABASE_URL=postgresql://fra_user:fra_password@postgres:5432/fra_atlas

# JWT Security
JWT_SECRET=your-production-secret-key
JWT_EXPIRES_IN=24h

# Application
NODE_ENV=production
PORT=8000
FRONTEND_URL=https://your-domain.com

# Optional: Mapbox Token
REACT_APP_MAPBOX_TOKEN=pk.your-mapbox-token
```

## 🧪 Testing

```bash
# Test authentication system
node test-auth.js

# Test login functionality
node test-login.js

# Test profile and logout
node test-profile-logout.js
```

## 📈 Future Roadmap

### Phase 1: Enhanced AI/ML
- **Real-time Satellite Feeds** for CFR forest monitoring
- **Advanced Computer Vision** for land-use classification
- **IoT Integration** for soil health and water quality monitoring

### Phase 2: Mobile & Field Operations
- **Mobile Application** for field data collection
- **Offline Capabilities** for remote area operations
- **GPS Integration** for real-time location tracking

### Phase 3: Advanced Integration
- **Blockchain Integration** for immutable audit trails
- **Real CSS API Integration** (PM-KISAN, JJM, MGNREGA, DAJGUA)
- **Advanced Analytics** with predictive modeling

## 🎯 Target Users

- **Ministry of Tribal Affairs (MoTA)**
- **District-level Tribal Welfare Departments**
- **Forest and Revenue Departments**
- **Planning & Development Authorities**
- **NGOs working with tribal communities**

## 📞 Support & Documentation

### Key Features Documentation
- **Authentication System**: JWT-based with role hierarchy
- **Bhunaksha Integration**: Land records search and visualization
- **WebGIS Interface**: Professional mapping with multiple layers
- **Digital Plot System**: QGIS-like digitization workflow
- **OCR/NER Processing**: AI-powered document digitization
- **Decision Support**: CSS integration and prioritization

### Technical Support
- **System Health**: `/health` endpoint for monitoring
- **Logging**: Winston-based comprehensive logging
- **Error Handling**: User-friendly error messages
- **Rate Limiting**: API protection and throttling

---

## 🏆 **Project Status: PRODUCTION READY**

The FRA Atlas platform is fully operational with comprehensive features including authentication, Bhunaksha-style land records, WebGIS mapping, document processing, decision support, and analytics. All core modules are implemented and tested, providing a professional-grade solution for Forest Rights Act governance and development planning across Madhya Pradesh, Tripura, Odisha, and Telangana.

**Built with ❤️ for Forest Rights Act Implementation**