const express = require('express');
const { body, validationResult } = require('express-validator');
const { logger } = require('../utils/logger');
const { listLayers, addLayer, updateLayerStyle: storeUpdateStyle, deleteLayer: storeDelete } = require('../utils/layersStore');
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../config/database');

const router = express.Router();

// Use existing database connection - no need to create additional tables

// Sample CFR data for demonstration
const sampleCFRData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        Name: 'Dharam Tekri Forest CFR',
        Khasra: 'Forest Compartment 12 & 13',
        Area: '25.5 hectares',
        Status: 'Active',
        Created: '2024-01-15',
        LastModified: '2024-01-15'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [78.1000, 23.1000],
          [78.1500, 23.1000],
          [78.1500, 23.0500],
          [78.1000, 23.0500],
          [78.1000, 23.1000]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        Name: 'Sample Forest Area 2',
        Khasra: 'Forest Compartment 14 & 15',
        Area: '18.2 hectares',
        Status: 'Pending',
        Created: '2024-01-20',
        LastModified: '2024-01-20'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [78.2000, 23.2000],
          [78.2500, 23.2000],
          [78.2500, 23.1500],
          [78.2000, 23.1500],
          [78.2000, 23.2000]
        ]]
      }
    }
  ]
};

// Get sample GeoJSON data
router.get('/sample', async (req, res) => {
  try {
    logger.info('Sample GeoJSON data requested');
    res.json({ success: true, data: sampleCFRData, message: 'Sample CFR data loaded successfully' });
  } catch (error) {
    logger.error('Error fetching sample GeoJSON data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sample data' });
  }
});

// Validate GeoJSON data
router.post('/validate', [
  body('data').isObject().withMessage('GeoJSON data is required'),
  body('data.type').equals('FeatureCollection').withMessage('Invalid GeoJSON type'),
  body('data.features').isArray().withMessage('Features array is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { data } = req.body;

    const validationResults = {
      isValid: true,
      errors: [],
      warnings: [],
      statistics: { featureCount: data.features.length, geometryTypes: {}, hasProperties: false }
    };

    data.features.forEach((feature, index) => {
      if (!feature.type || feature.type !== 'Feature') {
        validationResults.errors.push(`Feature ${index}: Invalid type`);
        validationResults.isValid = false;
      }
      if (!feature.geometry) {
        validationResults.errors.push(`Feature ${index}: Missing geometry`);
        validationResults.isValid = false;
      } else {
        const geomType = feature.geometry.type;
        validationResults.statistics.geometryTypes[geomType] = (validationResults.statistics.geometryTypes[geomType] || 0) + 1;
      }
      if (feature.properties && Object.keys(feature.properties).length > 0) {
        validationResults.statistics.hasProperties = true;
      } else {
        validationResults.warnings.push(`Feature ${index}: No properties defined`);
      }
    });

    logger.info('GeoJSON validation completed', { isValid: validationResults.isValid, featureCount: validationResults.statistics.featureCount });
    res.json({ success: true, data: validationResults, message: validationResults.isValid ? 'GeoJSON data is valid' : 'GeoJSON data has errors' });
  } catch (error) {
    logger.error('Error validating GeoJSON data:', error);
    res.status(500).json({ success: false, error: 'Failed to validate GeoJSON data' });
  }
});

// Save GeoJSON data
router.post('/save', [
  body('name').notEmpty().withMessage('Layer name is required'),
  body('data').isObject().withMessage('GeoJSON data is required'),
  body('style').optional().isObject().withMessage('Style must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, data, style = {} } = req.body;
    const userId = req.user?.userId || 'demo-user';

    const layerId = `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const layerData = {
      id: layerId,
      name,
      data,
      style: {
        fillColor: style.fillColor || '#2196f3',
        strokeColor: style.strokeColor || '#1976d2',
        strokeWidth: style.strokeWidth || 2,
        fillOpacity: style.fillOpacity || 0.6,
        strokeOpacity: style.strokeOpacity || 1.0,
        visible: style.visible !== false
      },
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to memory store for now
    addLayer(layerData);
    logger.info('GeoJSON layer saved to memory', { layerId });

    res.json({ success: true, data: layerData, message: 'GeoJSON layer saved successfully' });
  } catch (error) {
    logger.error('Error saving GeoJSON data:', error);
    res.status(500).json({ success: false, error: 'Failed to save GeoJSON data' });
  }
});

// Get user's GeoJSON layers
router.get('/layers', async (req, res) => {
  try {
    // Get layers from memory store
    const rows = listLayers();

    // Prepend a demo sample (optional)
    const userLayers = [
      {
        id: 'layer-1',
        name: 'Dharam Tekri Forest CFR',
        data: sampleCFRData,
        style: {
          fillColor: '#2e7d32',
          strokeColor: '#1b5e20',
          strokeWidth: 2,
          fillOpacity: 0.6,
          strokeOpacity: 1.0,
          visible: true
        },
        userId: 'demo-user',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      ...rows
    ];

    logger.info('User GeoJSON layers requested', { count: userLayers.length });
    res.json({ success: true, data: userLayers, message: 'Layers retrieved successfully' });
  } catch (error) {
    logger.error('Error fetching user layers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch layers' });
  }
});

// Update layer style
router.put('/layers/:id/style', [ body('style').isObject().withMessage('Style object is required') ], async (req, res) => {
  try {
    const { id } = req.params;
    const { style } = req.body;
    const userId = req.user?.userId || 'demo-user';

    // Update in memory store
    const updated = storeUpdateStyle(id, style) || { id, style };

    res.json({ success: true, data: updated, message: 'Layer style updated successfully' });
  } catch (error) {
    logger.error('Error updating layer style:', error);
    res.status(500).json({ success: false, error: 'Failed to update layer style' });
  }
});

// Delete layer
router.delete('/layers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || 'demo-user';

    // Delete from memory store
    storeDelete(id);

    res.json({ success: true, message: 'Layer deleted successfully' });
  } catch (error) {
    logger.error('Error deleting layer:', error);
    res.status(500).json({ success: false, error: 'Failed to delete layer' });
  }
});

// Export layer data (demo)
router.get('/layers/:id/export/:format', async (req, res) => {
  try {
    const { id, format } = req.params;
    const userId = req.user?.userId || 'demo-user';

    const layerData = { id, name: 'Dharam Tekri Forest CFR', data: sampleCFRData, format };
    logger.info('Layer export requested', { layerId: id, format, userId });
    res.json({ success: true, data: layerData, message: `Layer exported as ${format.toUpperCase()}` });
  } catch (error) {
    logger.error('Error exporting layer:', error);
    res.status(500).json({ success: false, error: 'Failed to export layer' });
  }
});

// Internal function to save layer (used by other modules)
const saveLayerInternal = async (name, data, style = {}) => {
  try {
    const layerId = `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const layerData = {
      id: layerId,
      name,
      data,
      style: {
        fillColor: style.fillColor || '#2196f3',
        strokeColor: style.strokeColor || '#1976d2',
        strokeWidth: style.strokeWidth || 2,
        fillOpacity: style.fillOpacity || 0.6,
        strokeOpacity: style.strokeOpacity || 1.0,
        visible: style.visible !== false
      },
      userId: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addLayer(layerData);
    logger.info('Layer saved internally', { layerId, name });
    return layerData;
  } catch (error) {
    logger.error('Error saving layer internally:', error);
    throw error;
  }
};

module.exports = router;
module.exports.saveLayerInternal = saveLayerInternal;
