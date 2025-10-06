const express = require('express');
const router = express.Router();

// Forest data endpoint - return empty GeoJSON for now
router.get('/fra-states-forest-data.geojson', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({
    "type": "FeatureCollection",
    "features": []
  });
});

module.exports = router;