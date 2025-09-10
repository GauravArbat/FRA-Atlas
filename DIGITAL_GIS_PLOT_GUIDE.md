# Digital GIS Plot - Professional QGIS-like Interface

## Overview

The Digital GIS Plot system is a professional, fully working QGIS-like interface for Patta/FRA title management and land record digitization. It provides comprehensive tools for creating, editing, and managing land records with advanced mapping capabilities.

## Features

### 🗺️ **Professional Mapping Interface**
- **Multiple Base Maps**: Satellite, Terrain, and OpenStreetMap layers
- **3D Visualization**: Tilted perspective with professional styling
- **Interactive Controls**: Zoom, pan, rotate, and fullscreen modes
- **Coordinate Display**: Real-time lat/lng coordinates and zoom level

### 📐 **Advanced Digitization Tools**
- **Polygon Drawing**: Create precise land boundaries
- **Point Markers**: Mark specific locations
- **Line Drawing**: Draw linear features
- **Geometry Validation**: Automatic polygon validation with confidence scoring
- **Step-by-Step Workflow**: Guided digitization process

### 📋 **Patta/FRA Title Management**
- **Complete Data Entry**: All required fields for land records
- **District/Taluka/Village**: Hierarchical administrative data
- **Survey Numbers**: Khasra, compartment, and survey number tracking
- **Area Management**: Hectares and acres with automatic calculation
- **Boundary Descriptions**: North, East, South, West markers
- **Status Tracking**: Draft, Digitized, Verified, Approved states

### 🗂️ **Cadastral Layer Integration**
- **Survey Number Overlays**: Maharashtra state survey data
- **Khasra Number Layers**: District-level cadastral information
- **Forest Boundaries**: Official forest department boundaries
- **Custom Layers**: Add and manage additional cadastral data
- **Layer Visibility**: Toggle and opacity controls

### 📤 **Export Capabilities**
- **PDF Maps**: High-quality map exports with data
- **GeoJSON**: Standard geospatial data format
- **KML**: Google Earth compatible format
- **CSV**: Tabular data export
- **Shapefile**: Professional GIS format (planned)

### 🔍 **Search and Navigation**
- **Location Search**: Find places using OpenStreetMap Nominatim
- **My Location**: GPS-based location services
- **Measure Tools**: Distance and area measurement
- **Bookmark System**: Save and navigate to specific locations

## Technical Architecture

### Frontend Components
- **React + TypeScript**: Modern, type-safe development
- **Material-UI**: Professional, responsive interface
- **Mapbox GL JS**: Advanced mapping capabilities
- **MapLibre GL**: Open-source mapping fallback
- **Mapbox Draw**: Interactive drawing tools

### Backend API
- **Node.js + Express**: RESTful API server
- **JWT Authentication**: Secure user authentication
- **File Upload Support**: Document and image processing
- **Data Validation**: Comprehensive input validation
- **Export Services**: Multiple format generation

### Data Management
- **In-Memory Storage**: Fast, responsive data handling
- **Real-time Updates**: Live data synchronization
- **Backup Systems**: Data persistence and recovery
- **Version Control**: Track changes and modifications

## Usage Guide

### 1. **Getting Started**
1. Navigate to the Digital GIS Plot page from the sidebar
2. Choose your preferred base map (Satellite recommended)
3. Familiarize yourself with the control panel on the left

### 2. **Creating a New Patta Record**
1. **Step 1 - Draw Boundary**:
   - Click "Draw Polygon" button
   - Click on the map to create polygon vertices
   - Double-click to complete the polygon
   - System will automatically validate the geometry

2. **Step 2 - Enter Patta Details**:
   - Click "Add Patta Data" button
   - Fill in all required fields:
     - District, Taluka, Village
     - Survey Number, Khasra Number
     - Area and unit (hectares/acres)
     - Boundary markers (North, East, South, West)
     - Additional notes
   - Click "Save Patta"

3. **Step 3 - Verify & Export**:
   - Review the created record
   - Use export tools to generate reports
   - Export in PDF, GeoJSON, KML, or CSV formats

### 3. **Working with Cadastral Layers**
1. **Enable Layers**: Toggle cadastral layers in the control panel
2. **Adjust Opacity**: Use sliders to control layer transparency
3. **Layer Information**: View metadata and source information
4. **Custom Layers**: Add new cadastral data sources

### 4. **Advanced Features**
- **Search Locations**: Use the search bar to find specific places
- **My Location**: Click the GPS button to center on your location
- **Measure Tools**: Use distance and area measurement tools
- **Fullscreen Mode**: Toggle fullscreen for detailed work
- **Export Options**: Choose from multiple export formats

## API Endpoints

### Patta Records
- `GET /api/gis-plot/patta` - Get all Patta records
- `POST /api/gis-plot/patta` - Create new Patta record
- `PUT /api/gis-plot/patta/:id` - Update Patta record
- `DELETE /api/gis-plot/patta/:id` - Delete Patta record

### Cadastral Layers
- `GET /api/gis-plot/cadastral-layers` - Get all cadastral layers
- `POST /api/gis-plot/cadastral-layers` - Add new cadastral layer
- `PUT /api/gis-plot/cadastral-layers/:id/visibility` - Update layer visibility

### Export & Validation
- `GET /api/gis-plot/export/:format` - Export data in specified format
- `POST /api/gis-plot/validate-geometry` - Validate polygon geometry
- `GET /api/gis-plot/statistics` - Get system statistics

## Data Formats

### Patta Data Structure
```json
{
  "id": "PATTA-1234567890-abc123def",
  "district": "Pune",
  "taluka": "Ambegaon",
  "village": "Ambegaon",
  "surveyNumber": "45/2",
  "khasraNumber": "123",
  "compartmentNumber": "A",
  "area": 2.5,
  "areaUnit": "hectares",
  "boundaryDescription": "North: Road, East: Stream, South: Forest, West: Field",
  "northMarker": "Main Road",
  "eastMarker": "Nira River",
  "southMarker": "Forest Boundary",
  "westMarker": "Agricultural Field",
  "polygon": {
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[[lng, lat], ...]]
    }
  },
  "status": "digitized",
  "createdDate": "2024-01-15T10:30:00Z",
  "lastModified": "2024-01-15T10:30:00Z",
  "documents": [],
  "notes": "Additional information"
}
```

### Cadastral Layer Structure
```json
{
  "id": "survey-maharashtra",
  "name": "Survey Numbers - Maharashtra",
  "type": "survey",
  "description": "Official survey numbers from Maharashtra Revenue Department",
  "url": "https://example.com/survey-maharashtra.geojson",
  "visible": false,
  "opacity": 0.7,
  "color": "#ff5722",
  "metadata": {
    "source": "Maharashtra Revenue Department",
    "lastUpdated": "2024-01-15",
    "coverage": "Maharashtra State",
    "scale": "1:10000"
  }
}
```

## Configuration

### Environment Variables
```bash
# Mapbox Configuration
REACT_APP_MAPBOX_TOKEN=your_mapbox_token_here

# API Configuration
REACT_APP_API_URL=http://localhost:8000/api

# Backend Configuration
PORT=8000
NODE_ENV=development
```

### Map Styles
The system supports three professional map styles:
1. **Satellite**: High-resolution satellite imagery with labels
2. **Terrain**: Topographic maps with elevation data
3. **OpenStreetMap**: Open-source street maps

## Best Practices

### 1. **Data Entry**
- Always validate polygon geometry before saving
- Use consistent naming conventions for villages and districts
- Include detailed boundary descriptions
- Add relevant notes and documentation

### 2. **Drawing**
- Create polygons with sufficient detail for accuracy
- Avoid self-intersecting polygons
- Use appropriate zoom levels for precision
- Validate geometry after drawing

### 3. **Layer Management**
- Enable only necessary cadastral layers
- Adjust opacity for better visibility
- Use consistent color schemes
- Document layer sources and dates

### 4. **Export**
- Choose appropriate format for intended use
- Include all relevant metadata
- Verify exported data accuracy
- Maintain backup copies

## Troubleshooting

### Common Issues

1. **Map Not Loading**
   - Check Mapbox token configuration
   - Verify internet connection
   - Clear browser cache

2. **Drawing Tools Not Working**
   - Ensure Mapbox token is valid
   - Check browser compatibility
   - Try refreshing the page

3. **Export Failures**
   - Verify data integrity
   - Check file permissions
   - Ensure sufficient disk space

4. **API Errors**
   - Check authentication status
   - Verify API endpoint availability
   - Review error logs

### Performance Optimization
- Use appropriate zoom levels
- Limit number of active layers
- Clear browser cache regularly
- Close unused browser tabs

## Future Enhancements

### Planned Features
- **Shapefile Support**: Full shapefile import/export
- **Advanced Analysis**: Spatial analysis tools
- **Collaboration**: Multi-user editing capabilities
- **Mobile Support**: Responsive mobile interface
- **Offline Mode**: Work without internet connection
- **AI Integration**: Automated boundary detection
- **3D Visualization**: Enhanced 3D mapping features

### Integration Opportunities
- **Government Databases**: Direct integration with land records
- **Satellite Imagery**: Real-time satellite data updates
- **Survey Integration**: Connect with survey equipment
- **Document Management**: OCR and document processing
- **Reporting**: Advanced reporting and analytics

## Support and Maintenance

### Regular Maintenance
- Update map tiles and base layers
- Refresh cadastral data sources
- Monitor system performance
- Backup data regularly

### User Training
- Provide comprehensive user documentation
- Conduct training sessions
- Create video tutorials
- Establish support channels

## Conclusion

The Digital GIS Plot system provides a professional, comprehensive solution for land record digitization and management. With its QGIS-like interface, advanced mapping capabilities, and robust data management features, it serves as a powerful tool for government agencies, surveyors, and land management professionals.

The system is designed to be user-friendly while maintaining professional standards, making it suitable for both technical and non-technical users. Its modular architecture allows for easy customization and extension based on specific requirements.

For technical support or feature requests, please contact the development team or refer to the project documentation.

