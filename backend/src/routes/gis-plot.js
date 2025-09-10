const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth-mock');
const { logger } = require('../utils/logger');

// In-memory storage for demo (in production, use database)
let pattaRecords = [
  {
    id: 'PATTA-2024-001',
    district: 'Pune',
    taluka: 'Ambegaon',
    village: 'Ambegaon',
    surveyNumber: '45/2',
    khasraNumber: '123',
    compartmentNumber: 'A',
    area: 2.5,
    areaUnit: 'hectares',
    boundaryDescription: 'North: Main Road, East: Nira River, South: Forest Boundary, West: Agricultural Field',
    northMarker: 'Main Road',
    eastMarker: 'Nira River',
    southMarker: 'Forest Boundary',
    westMarker: 'Agricultural Field',
    polygon: {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[73.8, 19.0], [73.9, 19.0], [73.9, 19.1], [73.8, 19.1], [73.8, 19.0]]]
      }
    },
    status: 'digitized',
    createdDate: '2024-01-15T10:30:00Z',
    lastModified: '2024-01-15T10:30:00Z',
    documents: ['Revenue Records', 'Gram Sabha Resolution'],
    notes: 'Sample Patta record for demonstration',
    createdBy: 'admin'
  },
  {
    id: 'PATTA-2024-002',
    district: 'Pune',
    taluka: 'Junnar',
    village: 'Junnar',
    surveyNumber: '67/3',
    khasraNumber: '456',
    compartmentNumber: 'B',
    area: 1.8,
    areaUnit: 'hectares',
    boundaryDescription: 'North: Stream, East: Hill, South: Road, West: Field',
    northMarker: 'Stream',
    eastMarker: 'Hill',
    southMarker: 'Road',
    westMarker: 'Field',
    polygon: {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[73.7, 19.1], [73.8, 19.1], [73.8, 19.2], [73.7, 19.2], [73.7, 19.1]]]
      }
    },
    status: 'draft',
    createdDate: '2024-01-16T14:20:00Z',
    lastModified: '2024-01-16T14:20:00Z',
    documents: ['Survey Records'],
    notes: 'Draft Patta record pending verification',
    createdBy: 'admin'
  },
  {
    id: 'PATTA-2024-003',
    district: 'Pune',
    taluka: 'Khed',
    village: 'Khed',
    surveyNumber: '89/1',
    khasraNumber: '789',
    compartmentNumber: 'C',
    area: 3.2,
    areaUnit: 'hectares',
    boundaryDescription: 'North: Forest, East: River, South: Village, West: Road',
    northMarker: 'Forest',
    eastMarker: 'River',
    southMarker: 'Village',
    westMarker: 'Road',
    polygon: {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[73.6, 19.2], [73.7, 19.2], [73.7, 19.3], [73.6, 19.3], [73.6, 19.2]]]
      }
    },
    status: 'verified',
    createdDate: '2024-01-17T09:15:00Z',
    lastModified: '2024-01-17T09:15:00Z',
    documents: ['Revenue Records', 'Forest Department Records', 'Gram Sabha Resolution'],
    notes: 'Verified Patta record with complete documentation',
    createdBy: 'admin'
  }
];

let cadastralLayers = [
  {
    id: 'survey-maharashtra',
    name: 'Survey Numbers - Maharashtra',
    type: 'survey',
    description: 'Official survey numbers from Maharashtra Revenue Department',
    url: 'https://example.com/survey-maharashtra.geojson',
    visible: false,
    opacity: 0.7,
    color: '#ff5722',
    metadata: {
      source: 'Maharashtra Revenue Department',
      lastUpdated: '2024-01-15',
      coverage: 'Maharashtra State',
      scale: '1:10000'
    }
  },
  {
    id: 'khasra-pune',
    name: 'Khasra Numbers - Pune District',
    type: 'khasra',
    description: 'Khasra numbers for Pune district',
    url: 'https://example.com/khasra-pune.geojson',
    visible: false,
    opacity: 0.7,
    color: '#2196f3',
    metadata: {
      source: 'Pune District Revenue Office',
      lastUpdated: '2024-01-10',
      coverage: 'Pune District',
      scale: '1:5000'
    }
  },
  {
    id: 'forest-boundaries',
    name: 'Forest Boundaries',
    type: 'forest',
    description: 'Official forest department boundaries',
    url: 'https://example.com/forest-boundaries.geojson',
    visible: false,
    opacity: 0.6,
    color: '#4caf50',
    metadata: {
      source: 'Maharashtra Forest Department',
      lastUpdated: '2024-01-20',
      coverage: 'Maharashtra State',
      scale: '1:25000'
    }
  }
];

// Get all Patta records
router.get('/patta', authenticateToken, async (req, res) => {
  try {
    logger.info('Fetching all Patta records');
    res.json({
      success: true,
      data: pattaRecords,
      count: pattaRecords.length
    });
  } catch (error) {
    logger.error('Error fetching Patta records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Patta records',
      error: error.message
    });
  }
});

// Create new Patta record
router.post('/patta', authenticateToken, async (req, res) => {
  try {
    const {
      district,
      taluka,
      village,
      surveyNumber,
      khasraNumber,
      compartmentNumber,
      area,
      areaUnit,
      boundaryDescription,
      northMarker,
      eastMarker,
      southMarker,
      westMarker,
      polygon,
      notes
    } = req.body;

    // Validate required fields
    if (!district || !taluka || !village || !surveyNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: district, taluka, village, surveyNumber'
      });
    }

    const newPatta = {
      id: `PATTA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      district,
      taluka,
      village,
      surveyNumber,
      khasraNumber: khasraNumber || '',
      compartmentNumber: compartmentNumber || '',
      area: parseFloat(area) || 0,
      areaUnit: areaUnit || 'hectares',
      boundaryDescription: boundaryDescription || '',
      northMarker: northMarker || '',
      eastMarker: eastMarker || '',
      southMarker: southMarker || '',
      westMarker: westMarker || '',
      polygon: polygon || null,
      status: polygon ? 'digitized' : 'draft',
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      documents: [],
      notes: notes || '',
      createdBy: req.user.id
    };

    pattaRecords.push(newPatta);
    
    logger.info(`Created new Patta record: ${newPatta.id}`);
    
    res.status(201).json({
      success: true,
      data: newPatta,
      message: 'Patta record created successfully'
    });
  } catch (error) {
    logger.error('Error creating Patta record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Patta record',
      error: error.message
    });
  }
});

// Update Patta record
router.put('/patta/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const pattaIndex = pattaRecords.findIndex(p => p.id === id);
    if (pattaIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Patta record not found'
      });
    }

    // Update the record
    pattaRecords[pattaIndex] = {
      ...pattaRecords[pattaIndex],
      ...updateData,
      lastModified: new Date().toISOString(),
      status: updateData.polygon ? 'digitized' : 'draft'
    };

    logger.info(`Updated Patta record: ${id}`);
    
    res.json({
      success: true,
      data: pattaRecords[pattaIndex],
      message: 'Patta record updated successfully'
    });
  } catch (error) {
    logger.error('Error updating Patta record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update Patta record',
      error: error.message
    });
  }
});

// Delete Patta record
router.delete('/patta/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const pattaIndex = pattaRecords.findIndex(p => p.id === id);
    if (pattaIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Patta record not found'
      });
    }

    pattaRecords.splice(pattaIndex, 1);
    
    logger.info(`Deleted Patta record: ${id}`);
    
    res.json({
      success: true,
      message: 'Patta record deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting Patta record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete Patta record',
      error: error.message
    });
  }
});

// Get cadastral layers
router.get('/cadastral-layers', authenticateToken, async (req, res) => {
  try {
    logger.info('Fetching cadastral layers');
    res.json({
      success: true,
      data: cadastralLayers,
      count: cadastralLayers.length
    });
  } catch (error) {
    logger.error('Error fetching cadastral layers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cadastral layers',
      error: error.message
    });
  }
});

// Add new cadastral layer
router.post('/cadastral-layers', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      url,
      color,
      opacity,
      metadata
    } = req.body;

    // Validate required fields
    if (!name || !type || !url) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, type, url'
      });
    }

    const newLayer = {
      id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      description: description || '',
      url,
      visible: false,
      opacity: opacity || 0.7,
      color: color || '#2196f3',
      metadata: metadata || {},
      createdDate: new Date().toISOString(),
      createdBy: req.user.id
    };

    cadastralLayers.push(newLayer);
    
    logger.info(`Added new cadastral layer: ${newLayer.id}`);
    
    res.status(201).json({
      success: true,
      data: newLayer,
      message: 'Cadastral layer added successfully'
    });
  } catch (error) {
    logger.error('Error adding cadastral layer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add cadastral layer',
      error: error.message
    });
  }
});

// Update cadastral layer visibility
router.put('/cadastral-layers/:id/visibility', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { visible, opacity } = req.body;

    const layerIndex = cadastralLayers.findIndex(l => l.id === id);
    if (layerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Cadastral layer not found'
      });
    }

    cadastralLayers[layerIndex].visible = visible;
    if (opacity !== undefined) {
      cadastralLayers[layerIndex].opacity = opacity;
    }

    logger.info(`Updated cadastral layer visibility: ${id}`);
    
    res.json({
      success: true,
      data: cadastralLayers[layerIndex],
      message: 'Cadastral layer visibility updated successfully'
    });
  } catch (error) {
    logger.error('Error updating cadastral layer visibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cadastral layer visibility',
      error: error.message
    });
  }
});

// Export Patta data in various formats
router.get('/export/:format', authenticateToken, async (req, res) => {
  try {
    const { format } = req.params;
    const { ids } = req.query;

    let exportData = pattaRecords;
    if (ids) {
      const idList = ids.split(',');
      exportData = pattaRecords.filter(p => idList.includes(p.id));
    }

    switch (format.toLowerCase()) {
      case 'geojson':
        const geojson = {
          type: 'FeatureCollection',
          features: exportData.map(patta => ({
            type: 'Feature',
            properties: {
              id: patta.id,
              district: patta.district,
              taluka: patta.taluka,
              village: patta.village,
              surveyNumber: patta.surveyNumber,
              khasraNumber: patta.khasraNumber,
              compartmentNumber: patta.compartmentNumber,
              area: patta.area,
              areaUnit: patta.areaUnit,
              status: patta.status,
              boundaryDescription: patta.boundaryDescription,
              northMarker: patta.northMarker,
              eastMarker: patta.eastMarker,
              southMarker: patta.southMarker,
              westMarker: patta.westMarker,
              createdDate: patta.createdDate,
              lastModified: patta.lastModified,
              notes: patta.notes
            },
            geometry: patta.polygon?.geometry || { type: 'Point', coordinates: [0, 0] }
          }))
        };
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="patta-data-${Date.now()}.geojson"`);
        res.json(geojson);
        break;

      case 'csv':
        const csvHeaders = [
          'ID', 'District', 'Taluka', 'Village', 'Survey Number', 'Khasra Number',
          'Compartment Number', 'Area', 'Area Unit', 'Status', 'Boundary Description',
          'North Marker', 'East Marker', 'South Marker', 'West Marker',
          'Created Date', 'Last Modified', 'Notes'
        ];
        const csvRows = exportData.map(patta => [
          patta.id,
          patta.district,
          patta.taluka,
          patta.village,
          patta.surveyNumber,
          patta.khasraNumber,
          patta.compartmentNumber,
          patta.area,
          patta.areaUnit,
          patta.status,
          patta.boundaryDescription,
          patta.northMarker,
          patta.eastMarker,
          patta.southMarker,
          patta.westMarker,
          patta.createdDate,
          patta.lastModified,
          patta.notes
        ]);
        const csvContent = [csvHeaders, ...csvRows].map(row => 
          row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="patta-data-${Date.now()}.csv"`);
        res.send(csvContent);
        break;

      case 'kml':
        // Generate KML format
        const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Patta Data Export</name>
    <description>Exported Patta records from Digital GIS Plot</description>
    ${exportData.map(patta => `
    <Placemark>
      <name>${patta.village} - ${patta.surveyNumber}</name>
      <description>
        District: ${patta.district}
        Taluka: ${patta.taluka}
        Village: ${patta.village}
        Survey Number: ${patta.surveyNumber}
        Area: ${patta.area} ${patta.areaUnit}
        Status: ${patta.status}
      </description>
      ${patta.polygon ? `
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              ${patta.polygon.geometry.coordinates[0].map(coord => `${coord[0]},${coord[1]},0`).join(' ')}
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
      ` : `
      <Point>
        <coordinates>0,0,0</coordinates>
      </Point>
      `}
    </Placemark>
    `).join('')}
  </Document>
</kml>`;
        
        res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
        res.setHeader('Content-Disposition', `attachment; filename="patta-data-${Date.now()}.kml"`);
        res.send(kmlContent);
        break;

      default:
        res.status(400).json({
          success: false,
          message: 'Unsupported export format. Supported formats: geojson, csv, kml'
        });
    }

    logger.info(`Exported Patta data in ${format} format`);
  } catch (error) {
    logger.error('Error exporting Patta data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export Patta data',
      error: error.message
    });
  }
});

// Validate polygon geometry
router.post('/validate-geometry', authenticateToken, async (req, res) => {
  try {
    const { geometry } = req.body;

    if (!geometry) {
      return res.status(400).json({
        success: false,
        message: 'Geometry data is required'
      });
    }

    // Basic geometry validation
    let isValid = true;
    let confidence = 0.8; // Default confidence
    let issues = [];

    if (geometry.type === 'Polygon') {
      const coordinates = geometry.coordinates[0];
      
      // Check if polygon is closed
      const first = coordinates[0];
      const last = coordinates[coordinates.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        isValid = false;
        issues.push('Polygon is not closed');
        confidence -= 0.2;
      }

      // Check minimum number of points
      if (coordinates.length < 4) {
        isValid = false;
        issues.push('Polygon must have at least 4 points');
        confidence -= 0.3;
      }

      // Check for self-intersections (simplified check)
      // In a real implementation, you would use a proper geometry library
      for (let i = 0; i < coordinates.length - 1; i++) {
        for (let j = i + 2; j < coordinates.length - 1; j++) {
          // Simple intersection check (this is a simplified version)
          const p1 = coordinates[i];
          const p2 = coordinates[i + 1];
          const p3 = coordinates[j];
          const p4 = coordinates[j + 1];
          
          // Basic line intersection check
          const denom = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0]);
          if (Math.abs(denom) > 1e-10) {
            const t = ((p1[0] - p3[0]) * (p3[1] - p4[1]) - (p1[1] - p3[1]) * (p3[0] - p4[0])) / denom;
            const u = -((p1[0] - p2[0]) * (p1[1] - p3[1]) - (p1[1] - p2[1]) * (p1[0] - p3[0])) / denom;
            
            if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
              isValid = false;
              issues.push('Polygon has self-intersections');
              confidence -= 0.4;
              break;
            }
          }
        }
        if (!isValid) break;
      }
    }

    logger.info(`Geometry validation completed. Valid: ${isValid}, Confidence: ${confidence}`);

    res.json({
      success: true,
      data: {
        isValid,
        confidence: Math.max(0, Math.min(1, confidence)),
        issues,
        geometryType: geometry.type,
        area: calculatePolygonArea(geometry)
      }
    });
  } catch (error) {
    logger.error('Error validating geometry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate geometry',
      error: error.message
    });
  }
});

// Helper function to calculate polygon area (simplified)
function calculatePolygonArea(geometry) {
  if (geometry.type !== 'Polygon') return 0;
  
  const coordinates = geometry.coordinates[0];
  let area = 0;
  
  for (let i = 0; i < coordinates.length - 1; i++) {
    const j = (i + 1) % (coordinates.length - 1);
    area += coordinates[i][0] * coordinates[j][1];
    area -= coordinates[j][0] * coordinates[i][1];
  }
  
  area = Math.abs(area) / 2;
  
  // Convert from square degrees to square meters (approximate)
  // This is a very rough approximation
  const lat = coordinates[0][1];
  const metersPerDegree = 111320 * Math.cos(lat * Math.PI / 180);
  return area * metersPerDegree * metersPerDegree;
}

// Get statistics for dashboard
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const totalPattas = pattaRecords.length;
    const digitizedPattas = pattaRecords.filter(p => p.status === 'digitized').length;
    const draftPattas = pattaRecords.filter(p => p.status === 'draft').length;
    const totalArea = pattaRecords.reduce((sum, p) => sum + (p.area || 0), 0);
    
    const districtStats = pattaRecords.reduce((acc, patta) => {
      acc[patta.district] = (acc[patta.district] || 0) + 1;
      return acc;
    }, {});

    const typeStats = pattaRecords.reduce((acc, patta) => {
      acc[patta.areaUnit] = (acc[patta.areaUnit] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalPattas,
        digitizedPattas,
        draftPattas,
        totalArea,
        districtStats,
        typeStats,
        cadastralLayersCount: cadastralLayers.length,
        activeLayersCount: cadastralLayers.filter(l => l.visible).length
      }
    });
  } catch (error) {
    logger.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

module.exports = router;
