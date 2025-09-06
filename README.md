# 🌳 Forest Rights Act (FRA) Atlas & Data Digitization Platform

## 📋 Project Overview

The Forest Rights Act (FRA) Atlas is a comprehensive digital platform designed to address the critical bottlenecks in FRA governance and development planning. This project aims to digitize, integrate, and visualize FRA data while providing decision support for policy implementation.

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
- **React.js** with TypeScript for robust UI development
- **Mapbox GL JS** for advanced GIS visualization
- **Material-UI** for consistent design system
- **Redux Toolkit** for state management

### Backend
- **Node.js** with Express.js for API development
- **PostgreSQL** with PostGIS extension for spatial data
- **Redis** for caching and session management
- **JWT** for authentication and authorization

### Data Processing
- **Python** with FastAPI for data processing pipelines
- **OpenCV** and **Tesseract** for OCR processing
- **GeoPandas** for spatial data manipulation
- **Pandas** for data analysis and transformation

### Infrastructure
- **Docker** for containerization
- **Nginx** for reverse proxy
- **AWS/GCP** for cloud deployment
- **GitHub Actions** for CI/CD

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
- Node.js 18+
- Python 3.9+
- PostgreSQL 14+ with PostGIS
- Redis 6+
- Docker & Docker Compose

### Quick Start
1. Clone the repository
2. Copy `env.example` to `.env` at the repository root and adjust values as needed
3. Optional: set a Mapbox token in `frontend/.env` as `REACT_APP_MAPBOX_TOKEN=pk.xxxxx` to enable drawing/validation (the app works without a token using OpenStreetMap)
4. Start services
   - With Docker (recommended): `docker-compose up`
   - Or locally:
     - Backend: `cd backend && npm install && npm run dev`
     - Frontend: `cd frontend && npm install && npm start`
5. Access the application at `http://localhost:3000`

### Configuration hints
- Free map mode (default): uses OpenStreetMap via MapLibre, no token required
- Mapbox mode: add `REACT_APP_MAPBOX_TOKEN` in `frontend/.env` to unlock polygon drawing & validation
- External raster overlays (ESA WorldCover, JRC Surface Water) are fetched via a backend tile proxy at `/api/proxy/tiles/...` to avoid CORS issues

## 📊 Key Features

### Data Management
- [x] Document upload (UI) and OCR pipeline (backend mock; swappable to Tesseract/Google Vision/IndicOCR)
- [x] NER extraction for village, claimant, claim status, khasra/khatauni (backend)
- [ ] Data validation and standardization (review UI/workflow)
- [ ] Version control and audit trails

### Visualization
- [x] Interactive FRA Atlas with multiple layers (Granted/Potential + AI/ML assets)
- [x] Real-time dashboards and analytics (Dashboard, Reports pages)
- [x] Remote-sensing overlays (ESA WorldCover, JRC Water) via backend proxy
- [ ] Export capabilities (CSV/PDF, Shapefile)

### Decision Support
- [x] Eligibility evaluation API & UI (mock rules; pluggable)
- [x] Prioritization API & UI (e.g., borewells by groundwater index)
- [x] Policy dashboard metrics (national/state cards)
- [ ] Full CSS integrations (PM‑KISAN, JJM, MGNREGA, DAJGUA) with production rules

### User Management
- [ ] Role-based access control
- [ ] Multi-level administrative hierarchy
- [ ] Audit logging and compliance
- [ ] Mobile-responsive design

## ✅ Implemented in this release
- WebGIS Atlas with filters (state/district/block/village/tribal group), auto fit-to-bounds, and Mapbox/OSM support
- AI/ML assets toggles (agriculture/forest/water/homestead/infrastructure) and a path to plug real detections
- Remote-sensing overlays (WorldCover, JRC Water) fetched via `/api/proxy` (CORS-safe)
- Dashboard & Reports with time-series and top-districts charts
- DSS module (eligibility + prioritization + KPIs) with expandable rules
- OCR/NER endpoints, and a UI card to preview OCR text and extracted entities

## 🔌 Notable API Endpoints (development)
```
GET  /api/fra/atlas/geojson           # FRA features (filters supported)
GET  /api/fra/atlas/filters           # Filter options (states, districts, ...)
POST /api/fra/atlas/validate          # Validate drawn polygon (Mapbox mode)

POST /api/digitization/ocr            # OCR (mock; swappable to Tesseract/Vision)
POST /api/digitization/ner            # Named Entity Recognition
POST /api/digitization/cv/detect      # CV detections (mock)

GET  /api/fra/dss/eligibility         # DSS eligibility output
GET  /api/fra/dss/prioritize          # DSS prioritization output
GET  /api/fra/dss/metrics             # KPI dashboard

GET  /api/fra/reports/summary         # Reports & analytics summary (timeseries, breakdowns)

GET  /api/proxy/tiles/:source/:z/:x/:y.png
     # External tiles (worldcover|gsw)
```

## 🧭 Roadmap (next)
- PostGIS schema + importer for legacy FRA claims/pattas and shapefiles
- GeoServer/WMTS integration and large raster tiling
- Human-in-loop review workflow for OCR/NER/CV with audit trail
- Full CSS rules engine (PM‑KISAN, JJM, MGNREGA, DAJGUA) and export features

## 🤝 Contributing

Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

