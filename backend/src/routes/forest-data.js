const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Forest data endpoint - serve actual GeoJSON file
router.get('/fra-states-forest-data.geojson', (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../frontend/public/data/fra-states-forest-data.geojson');
    
    if (fs.existsSync(filePath)) {
      const forestData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      res.json(forestData);
    } else {
      // Fallback if file doesn't exist
      res.status(404).json({ error: 'Forest data file not found' });
    }
  } catch (error) {
    console.error('Error serving forest data:', error);
    res.status(500).json({ error: 'Failed to load forest data' });
  }
});

module.exports = router;