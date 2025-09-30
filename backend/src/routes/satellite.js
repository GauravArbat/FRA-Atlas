/**
 * Satellite Asset Mapping API Routes
 */
const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const SATELLITE_ENGINE_URL = process.env.SATELLITE_ENGINE_URL || 'http://localhost:8002';
const ADVANCED_SATELLITE_ENGINE_URL = process.env.ADVANCED_SATELLITE_ENGINE_URL || 'http://localhost:8003';

// Asset mapping endpoint
router.post('/asset-mapping', authenticateToken, async (req, res) => {
  try {
    const { state, district, village } = req.body;
    
    // Validate input
    if (!state || !district || !village) {
      return res.status(400).json({ error: 'State, district, and village are required' });
    }
    
    // Call Satellite Asset Mapping Engine
    const response = await axios.post(`${SATELLITE_ENGINE_URL}/api/satellite/asset-mapping`, {
      state,
      district,
      village
    }, {
      timeout: 60000 // 60 second timeout for satellite processing
    });
    
    res.json(response.data);
    
  } catch (error) {
    console.error('Satellite Asset Mapping Error:', error.message);
    res.status(500).json({ 
      error: 'Asset mapping failed',
      details: error.response?.data || error.message 
    });
  }
});

// Get available locations
router.get('/locations', authenticateToken, async (req, res) => {
  try {
    const locations = {
      states: [
        'Madhya Pradesh',
        'Odisha', 
        'Tripura',
        'Telangana'
      ],
      districts: {
        'Madhya Pradesh': ['Khargone', 'Dhar', 'Jhabua', 'Alirajpur'],
        'Odisha': ['Mayurbhanj', 'Keonjhar', 'Sundargarh', 'Kandhamal'],
        'Tripura': ['West Tripura', 'South Tripura', 'North Tripura'],
        'Telangana': ['Hyderabad', 'Adilabad', 'Warangal', 'Khammam']
      },
      villages: {
        'Khargone': ['Khargone Village', 'Tribal Settlement A', 'Forest Village B'],
        'Mayurbhanj': ['Tribal Settlement', 'Forest Village C', 'Adivasi Gram'],
        'West Tripura': ['Forest Village', 'Tribal Colony', 'Hill Village'],
        'Hyderabad': ['Suburban Village', 'Tribal Area', 'Forest Settlement']
      }
    };
    
    res.json(locations);
  } catch (error) {
    console.error('Locations fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// Health check for satellite engine
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${SATELLITE_ENGINE_URL}/health`, { timeout: 5000 });
    res.json({
      satellite_engine_status: 'healthy',
      gee_status: response.data.gee_available ? 'connected' : 'disconnected',
      last_check: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      satellite_engine_status: 'unhealthy',
      error: error.message,
      last_check: new Date().toISOString()
    });
  }
});

// Real-time satellite classification endpoint
router.post('/realtime-classification', authenticateToken, async (req, res) => {
  try {
    const { state, district, village, analysis_type, confidence_threshold } = req.body;
    
    if (!state || !district || !village) {
      return res.status(400).json({ error: 'State, district, and village are required' });
    }
    
    const response = await axios.post('http://localhost:8004/api/satellite/realtime-classification', {
      state,
      district,
      village,
      analysis_type: analysis_type || 'comprehensive',
      confidence_threshold: confidence_threshold || 0.7
    }, {
      timeout: 60000 // 60 second timeout for satellite processing
    });
    
    res.json(response.data);
    
  } catch (error) {
    console.error('Real-time Satellite Classification Error:', error.message);
    res.status(500).json({ 
      error: 'Real-time classification failed',
      details: error.response?.data || error.message 
    });
  }
});

// Enhanced AI-based asset mapping endpoint
router.post('/advanced-mapping', authenticateToken, async (req, res) => {
  try {
    const { 
      state, 
      district, 
      village, 
      analysis_type, 
      confidence_threshold, 
      ml_model,
      include_infrastructure,
      include_pm_gati_shakti,
      include_groundwater_data,
      include_forest_data
    } = req.body;
    
    if (!state || !district || !village) {
      return res.status(400).json({ error: 'State, district, and village are required' });
    }
    
    // Simulate processing delay based on model complexity
    const processingTime = ml_model === 'ensemble' ? 4000 : ml_model === 'cnn' ? 3500 : 2500;
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    const coords = getVillageCoordinates(village);
    
    // Enhanced mock results with comprehensive AI analysis
    const mockAdvancedResult = {
      village_id: `${state.substring(0,2).toUpperCase()}${district.substring(0,3).toUpperCase()}${village.substring(0,3).toUpperCase()}`,
      village_name: village,
      coordinates: coords,
      assets: {
        water_bodies: [
          {
            type: 'pond',
            area: 2.5,
            coordinates: [coords[0] + Math.random() * 0.01, coords[1] + Math.random() * 0.01],
            confidence: 0.89,
            seasonal: 'perennial',
            water_quality: 'good',
            depth_estimate: 3.2
          },
          {
            type: 'stream',
            area: 1.2,
            coordinates: [coords[0] - Math.random() * 0.01, coords[1] + Math.random() * 0.02],
            confidence: 0.76,
            seasonal: 'seasonal',
            water_quality: 'moderate',
            depth_estimate: 1.8
          }
        ],
        agricultural_land: [
          {
            type: 'crop_field',
            area: 15.3,
            coordinates: [coords[0] + Math.random() * 0.005, coords[1] + Math.random() * 0.005],
            confidence: 0.92,
            ndvi_avg: 0.65,
            crop_intensity: 'high',
            soil_health: 'good',
            irrigation_access: true
          },
          {
            type: 'fallow_land',
            area: 8.7,
            coordinates: [coords[0] - Math.random() * 0.005, coords[1] + Math.random() * 0.008],
            confidence: 0.84,
            ndvi_avg: 0.32,
            crop_intensity: 'low',
            soil_health: 'moderate',
            irrigation_access: false
          }
        ],
        forest_cover: [
          {
            type: 'dense_forest',
            area: 25.6,
            coordinates: [coords[0] + Math.random() * 0.015, coords[1] + Math.random() * 0.015],
            confidence: 0.95,
            ndvi_avg: 0.78,
            canopy_density: 'dense',
            forest_type: 'tropical_deciduous',
            biodiversity_index: 0.82
          }
        ],
        built_up: [
          {
            type: 'residential',
            coordinates: [coords[0] + Math.random() * 0.003, coords[1] + Math.random() * 0.003],
            confidence: 0.87,
            night_intensity: 45.2,
            development_level: 'moderate',
            infrastructure_type: 'rural_settlement'
          }
        ],
        homesteads: [
          {
            type: 'tribal_homestead',
            coordinates: [coords[0] - Math.random() * 0.003, coords[1] - Math.random() * 0.003],
            confidence: 0.91,
            household_count: 12,
            electrification: true,
            road_access: false
          }
        ]
      },
      confidence_maps: {
        water_bodies: 0.825,
        agricultural_land: 0.88,
        forest_cover: 0.95,
        built_up: 0.87,
        homesteads: 0.91
      },
      spectral_indices: {
        ndvi_mean: 0.65,
        ndwi_mean: 0.12,
        mndwi_mean: -0.05,
        ndbi_mean: 0.08,
        savi_mean: 0.52,
        vegetation_health: 'good',
        water_stress: 'moderate',
        groundwater_potential: 'high'
      },
      ml_models: {
        random_forest_accuracy: 0.89,
        cnn_accuracy: 0.92,
        ensemble_confidence: 0.94,
        model_versions: ['RF-v3.2', 'CNN-ResNet50', 'UNet-v2.1']
      },
      infrastructure_data: {
        pm_gati_shakti: {
          road_connectivity: 'moderate',
          digital_connectivity: 'good',
          logistics_score: 72
        },
        groundwater: {
          depth_to_water: 15.5,
          quality_index: 78,
          recharge_potential: 'high'
        },
        forest_data: {
          forest_type: 'tropical_deciduous',
          canopy_cover_percent: 68,
          biodiversity_score: 82,
          conservation_status: 'protected'
        }
      },
      processing_time: processingTime / 1000,
      model_version: `${ml_model ? ml_model.toUpperCase() : 'ENSEMBLE'}-Enhanced-v3.0`
    };
    
    res.json(mockAdvancedResult);
    
  } catch (error) {
    console.error('Advanced Satellite Mapping Error:', error.message);
    res.status(500).json({ 
      error: 'Advanced mapping failed',
      details: error.message
    });
  }
});

// Helper function for village coordinates
function getVillageCoordinates(village) {
  const coordinates = {
    'Khargone Village': [21.8245, 75.6102],
    'Tribal Settlement': [21.9270, 86.7470],
    'Forest Village': [23.8315, 91.2868],
    'Suburban Village': [17.3850, 78.4867],
    'Tribal Settlement A': [21.7245, 75.5102],
    'Forest Village B': [21.9245, 75.7102],
    'Forest Village C': [22.0270, 86.8470],
    'Adivasi Gram': [21.8270, 86.6470],
    'Tribal Colony': [23.7315, 91.1868],
    'Hill Village': [23.9315, 91.3868],
    'Tribal Area': [17.2850, 78.3867],
    'Forest Settlement': [17.4850, 78.5867]
  };
  return coordinates[village] || [22.0, 78.0];
}

module.exports = router;