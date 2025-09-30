# 🛰️ Google Earth Engine DSS Setup Guide

## 🎯 Google Earth Engine Setup Steps

### 1. **Create GEE Account**
```bash
# Visit: https://earthengine.google.com/
# Sign up with Google account
# Request access (usually approved within 24-48 hours)
```

### 2. **Install GEE Python API**
```bash
pip install earthengine-api
```

### 3. **Authenticate GEE**
```bash
earthengine authenticate
# Follow browser authentication flow
# Copy token back to terminal
```

### 4. **Test GEE Connection**
```python
import ee
ee.Initialize()
print("GEE initialized successfully!")
```

### 5. **Create Service Account (Production)**
```bash
# Go to: https://console.cloud.google.com/
# Create new project: "fra-atlas-gee"
# Enable Earth Engine API
# Create Service Account
# Download JSON key file
```

### 6. **Environment Setup**
```env
# Add to .env file
GEE_SERVICE_ACCOUNT_EMAIL=your-service-account@fra-atlas-gee.iam.gserviceaccount.com
GEE_PRIVATE_KEY_PATH=./gee-service-account-key.json
GEE_PROJECT_ID=fra-atlas-gee
```

## 🚀 Quick Start Commands

```bash
# Install dependencies
cd data-processor
pip install earthengine-api scikit-learn pandas numpy

# Authenticate (development)
earthengine authenticate

# Test GEE connection
python test_gee_connection.py

# Start DSS engine
python -m uvicorn dss_engine:app --host 0.0.0.0 --port 8001
```

## 📊 DSS Engine Architecture

```
FRA Data → GEE Satellite Analysis → AI/ML Processing → Priority Scores → WebGIS Dashboard
```

**Ready for implementation!**