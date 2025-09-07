# FRA Atlas - Geospatial Features Guide

## 🗺️ Overview

The FRA Atlas now includes comprehensive geospatial visualization and analysis capabilities for Forest Rights Act (FRA) data. This professional system allows you to:

- **Process multilingual documents** (Hindi, English, Marathi) using OCR and NER
- **Extract FRA-specific information** from documents
- **Visualize claims on interactive maps** with real-time plotting
- **Analyze geospatial data** with statistics and insights
- **Export data** in multiple formats (JSON, CSV, GeoJSON)

## 🚀 Key Features

### 1. **Interactive Map Visualization**
- **Real-time mapping** of FRA claims with Mapbox integration
- **Multiple map styles**: Satellite, Streets, Terrain
- **Interactive markers** with claim details
- **Filtering capabilities** by status, type, and district
- **Zoom and navigation controls**
- **Fullscreen mode** for detailed analysis

### 2. **Multilingual OCR & NER Processing**
- **Hindi, English, and Marathi** text processing
- **FRA-specific entity recognition**:
  - Person names (with titles)
  - Locations (villages, districts, states)
  - Land measurements (acres, hectares)
  - Financial information (compensation amounts)
  - FRA terminology (IFR, CFR, Gram Sabha, etc.)
  - Identification numbers (Aadhaar, phone, email)

### 3. **Professional Data Management**
- **Tabbed interface** for organized workflow
- **Real-time statistics** and analytics
- **Data export** in multiple formats
- **Interactive claim selection** and details
- **Progress indicators** and status updates

## 📋 Sample Data

The system comes pre-loaded with comprehensive sample data including:

### **English Content:**
```
FOREST RIGHTS ACT - CLAIM APPLICATION
Application No: FRA/2024/001234
Date: 15/03/2024

Applicant Details:
Name: Shri Ramdas Kisan Patil
Father's Name: Shri Kisan Patil
Address: Village - Ambegaon, Taluka - Junnar, District - Pune, State - Maharashtra
Caste: Scheduled Tribe (ST)
Aadhaar No: 1234-5678-9012

Land Details:
Survey No: 45/2
Area: 2.5 acres
Village: Ambegaon
District: Pune
State: Maharashtra

Claim Type: Individual Forest Rights (IFR)
Status: Granted
Patta No: PATTA/MAH/2024/001234
```

### **Hindi Content:**
```
वन अधिकार अधिनियम - दावा आवेदन
आवेदन संख्या: FRA/2024/001234
तारीख: 15/03/2024

आवेदक विवरण:
नाम: श्री रामदास किसान पाटिल
पिता का नाम: श्री किसान पाटिल
पता: गाँव - अंबेगांव, तालुका - जुन्नर, जिला - पुणे, राज्य - महाराष्ट्र
जाति: अनुसूचित जनजाति (ST)
आधार संख्या: 1234-5678-9012
```

### **Marathi Content:**
```
वन अधिकार कायदा - दावा अर्ज
अर्ज क्रमांक: FRA/2024/001234
दिनांक: 15/03/2024

अर्जदाराची माहिती:
नाव: श्री रामदास किसान पाटील
वडिलांचे नाव: श्री किसान पाटील
पत्ता: गाव - अंबेगांव, तालुका - जुन्नर, जिल्हा - पुणे, राज्य - महाराष्ट्र
जात: अनुसूचित जमाती (ST)
आधार क्रमांक: 1234-5678-9012
```

## 🎯 How to Use

### **Step 1: Document Processing**
1. Navigate to the **"Document Processing"** tab
2. Use the **OCR & NER** section with the pre-loaded sample text
3. Click **"Run OCR"** to process the text and extract FRA information
4. Click **"Run NER"** to identify entities (names, locations, dates, etc.)
5. View extracted information in organized cards

### **Step 2: Geospatial Analysis**
1. Switch to the **"Geospatial Analysis"** tab
2. View the interactive map with all FRA claims
3. Use map controls to:
   - Change map style (Satellite/Streets/Terrain)
   - Zoom in/out and navigate
   - Filter by status, type, or district
   - Click on markers to view claim details
4. View real-time statistics in the sidebar

### **Step 3: Data Visualization**
1. Go to the **"Data Visualization"** tab
2. View claims distribution by district
3. Export data in your preferred format:
   - **JSON**: For API integration
   - **CSV**: For spreadsheet analysis
   - **GeoJSON**: For GIS applications

## 🗺️ Map Features

### **Interactive Controls:**
- **Style Toggle**: Switch between Satellite, Streets, and Terrain views
- **Zoom Controls**: Zoom in/out with mouse wheel or buttons
- **Location Button**: Return to default view
- **Filter Panel**: Filter claims by status, type, and district
- **Fullscreen Mode**: Expand map for detailed analysis

### **Visual Elements:**
- **Color-coded markers**:
  - 🟢 Green: Granted claims
  - 🟠 Orange: Pending claims
  - 🔴 Red: Rejected claims
- **Interactive popups** with claim details
- **Real-time statistics** panel
- **Recent claims** list with quick access

## 📊 Data Export Options

### **JSON Format:**
```json
{
  "id": "FRA/2024/001234",
  "applicantName": "Shri Ramdas Kisan Patil",
  "village": "Ambegaon",
  "district": "Pune",
  "state": "Maharashtra",
  "area": 2.5,
  "status": "granted",
  "coordinates": [73.8567, 18.5204],
  "pattaNumber": "PATTA/MAH/2024/001234",
  "claimType": "IFR"
}
```

### **CSV Format:**
```csv
ID,Applicant Name,Village,District,State,Area,Status,Longitude,Latitude
FRA/2024/001234,Shri Ramdas Kisan Patil,Ambegaon,Pune,Maharashtra,2.5,granted,73.8567,18.5204
```

### **GeoJSON Format:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "FRA/2024/001234",
        "applicantName": "Shri Ramdas Kisan Patil",
        "status": "granted"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [73.8567, 18.5204]
      }
    }
  ]
}
```

## 🔧 Technical Implementation

### **Components:**
- **FRAInteractiveMap**: Professional map component with Mapbox integration
- **GeospatialService**: Data processing and analysis utilities
- **Enhanced DataManagement**: Tabbed interface with full functionality

### **Key Technologies:**
- **Mapbox GL JS**: Interactive mapping
- **Material-UI**: Professional UI components
- **TypeScript**: Type-safe development
- **React**: Component-based architecture

### **Data Processing:**
- **Multilingual NER**: Hindi, English, Marathi entity recognition
- **FRA-specific extraction**: Custom patterns for forest rights terminology
- **Geospatial analysis**: Statistical analysis and visualization
- **Real-time updates**: Dynamic data processing and display

## 🎨 Professional UI Features

### **Design Elements:**
- **Modern tabbed interface** for organized workflow
- **Responsive design** that works on all devices
- **Professional color scheme** with status indicators
- **Interactive elements** with hover effects and animations
- **Loading states** and progress indicators

### **User Experience:**
- **Intuitive navigation** between different views
- **Real-time feedback** for all operations
- **Comprehensive error handling** with helpful messages
- **Accessibility features** for inclusive design

## 🚀 Getting Started

1. **Set up Mapbox token** in your `.env` file:
   ```
   REACT_APP_MAPBOX_TOKEN=your_mapbox_token_here
   ```

2. **Start the application**:
   ```bash
   npm start
   ```

3. **Navigate to Data Management** and explore the features!

## 📈 Future Enhancements

- **Advanced analytics** with charts and graphs
- **Batch processing** for multiple documents
- **Real-time collaboration** features
- **Mobile app** integration
- **API endpoints** for external integrations

---

**The FRA Atlas now provides a complete, professional solution for Forest Rights Act data management with advanced geospatial visualization capabilities!** 🎉
