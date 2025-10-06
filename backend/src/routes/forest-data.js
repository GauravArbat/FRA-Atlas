const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Serve forest data from the actual GeoJSON file
router.get('/fra-states-forest-data.geojson', (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../data/fra-states-forest-data.geojson');
    
    console.log('🌲 Loading forest data from:', filePath);
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      const forestData = JSON.parse(data);
      
      console.log('✅ Forest data loaded successfully:', forestData.features?.length || 0, 'features');
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.json(forestData);
    } else {
      console.warn('⚠️ Forest data file not found, using fallback');
      // Fallback mock data
      res.json({
        "type": "FeatureCollection",
        "features": [
          {
            "type": "Feature",
            "properties": {
              "name": "Madhya Pradesh Forest Area",
              "state": "Madhya Pradesh",
              "forest_type": "Tropical Deciduous",
              "area_hectares": 77414
            },
            "geometry": {
              "type": "Polygon",
              "coordinates": [[
                [74.0, 21.0],
                [82.0, 21.0], 
                [82.0, 26.0],
                [74.0, 26.0],
                [74.0, 21.0]
              ]]
            }
          }
        ]
      });
    }
  } catch (error) {
    console.error('❌ Error serving forest data:', error);
    res.status(500).json({ error: 'Failed to load forest data' });
  }
});

module.exports = router;