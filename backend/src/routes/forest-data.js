const express = require('express');
const router = express.Router();

// Forest data endpoint
router.get('/fra-states-forest-data.geojson', (req, res) => {
  const forestData = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {
          "name": "Madhya Pradesh Forest Area",
          "state": "Madhya Pradesh",
          "forest_type": "Reserve Forest",
          "area_hectares": 77414
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [77.5, 22.5], [78.5, 22.5], [78.5, 23.5], [77.5, 23.5], [77.5, 22.5]
          ]]
        }
      },
      {
        "type": "Feature", 
        "properties": {
          "name": "Odisha Forest Area",
          "state": "Odisha",
          "forest_type": "Protected Forest",
          "area_hectares": 48838
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [84.5, 19.5], [85.5, 19.5], [85.5, 20.5], [84.5, 20.5], [84.5, 19.5]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": {
          "name": "Telangana Forest Area", 
          "state": "Telangana",
          "forest_type": "Reserve Forest",
          "area_hectares": 26904
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [78.5, 17.5], [79.5, 17.5], [79.5, 18.5], [78.5, 18.5], [78.5, 17.5]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": {
          "name": "Tripura Forest Area",
          "state": "Tripura", 
          "forest_type": "Protected Forest",
          "area_hectares": 8073
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [91.5, 23.5], [92.5, 23.5], [92.5, 24.5], [91.5, 24.5], [91.5, 23.5]
          ]]
        }
      }
    ]
  };

  res.json(forestData);
});

module.exports = router;