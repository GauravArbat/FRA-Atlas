const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth-mock');
const { logger } = require('../utils/logger');

// In-memory storage for legacy digitized records
let legacyRecords = [];

// Indian names for dummy data generation
const indianNames = [
  'Ramesh Kumar', 'Priya Sharma', 'Arjun Singh', 'Kavita Patel', 'Suresh Gupta',
  'Meera Joshi', 'Vikram Yadav', 'Sunita Verma', 'Rajesh Tiwari', 'Pooja Agarwal',
  'Amit Mishra', 'Ritu Saxena', 'Manoj Pandey', 'Neha Srivastava', 'Deepak Shukla',
  'Anita Dubey', 'Sanjay Tripathi', 'Rekha Chaturvedi', 'Ashok Dwivedi', 'Seema Pathak',
  'Minz Tripuri', 'Kokborok Debbarma', 'Arjun Santal', 'Bhil Singh', 'Gond Ramesh',
  'Kondh Priya', 'Lambada Vikram', 'Munda Sunita', 'Oraon Rajesh', 'Khasi Meera'
];

const indianStates = [
  'Madhya Pradesh', 'Odisha', 'Telangana', 'Tripura', 'Maharashtra', 'Jharkhand',
  'Chhattisgarh', 'Andhra Pradesh', 'Gujarat', 'Rajasthan'
];

const districtsByState = {
  'Madhya Pradesh': ['Balaghat', 'Mandla', 'Dindori', 'Seoni'],
  'Odisha': ['Mayurbhanj', 'Kandhamal', 'Rayagada', 'Koraput'],
  'Telangana': ['Adilabad', 'Khammam', 'Warangal', 'Nizamabad'],
  'Tripura': ['Dhalai', 'West Tripura', 'South Tripura', 'North Tripura'],
  'Maharashtra': ['Pune', 'Nashik', 'Aurangabad', 'Nagpur'],
  'Jharkhand': ['Ranchi', 'Gumla', 'Simdega', 'Khunti']
};

const blocksByDistrict = {
  'Balaghat': ['Balaghat', 'Birsa', 'Katangi', 'Khairlanji'],
  'Mayurbhanj': ['Baripada', 'Rairangpur', 'Karanjia', 'Udala'],
  'Adilabad': ['Utnoor', 'Boath', 'Jainoor', 'Kerameri'],
  'Dhalai': ['Gandacherra', 'Manu', 'Longtharai', 'Dumburnagar'],
  'Pune': ['Ambegaon', 'Junnar', 'Khed', 'Maval']
};

const villagesByBlock = {
  'Balaghat': ['Khairlanji', 'Birsa Village', 'Katangi Village'],
  'Gandacherra': ['Phulbani', 'Manu Village', 'Longtharai Village'],
  'Ambegaon': ['Ambegaon', 'Junnar Village', 'Khed Village'],
  'Utnoor': ['Utnoor Village', 'Boath Village', 'Jainoor Village'],
  'Baripada': ['Baripada Village', 'Rairangpur Village', 'Karanjia Village']
};

// Generate random coordinates within India
function generateRandomCoordinates() {
  const latMin = 8.0, latMax = 37.0;
  const lonMin = 68.0, lonMax = 97.0;
  
  const lat = latMin + Math.random() * (latMax - latMin);
  const lon = lonMin + Math.random() * (lonMax - lonMin);
  
  return [lon, lat];
}

// Generate random polygon around a center point
function generateRandomPolygon(centerLon, centerLat, size = 0.01) {
  const points = [];
  const numPoints = 5 + Math.floor(Math.random() * 3); // 5-7 points
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const radius = size * (0.5 + Math.random() * 0.5);
    const lon = centerLon + radius * Math.cos(angle);
    const lat = centerLat + radius * Math.sin(angle);
    points.push([lon, lat]);
  }
  
  // Close the polygon
  points.push(points[0]);
  
  return points;
}

// Calculate polygon area in hectares (approximate)
function calculateArea(coordinates) {
  let area = 0;
  const coords = coordinates[0];
  
  for (let i = 0; i < coords.length - 1; i++) {
    const j = (i + 1) % (coords.length - 1);
    area += coords[i][0] * coords[j][1];
    area -= coords[j][0] * coords[i][1];
  }
  
  area = Math.abs(area) / 2;
  
  // Convert from square degrees to hectares (approximate)
  const lat = coords[0][1];
  const metersPerDegree = 111320 * Math.cos(lat * Math.PI / 180);
  const areaInSquareMeters = area * metersPerDegree * metersPerDegree;
  const hectares = areaInSquareMeters / 10000;
  
  return {
    hectares: Math.round(hectares * 10000) / 10000,
    acres: Math.round(hectares * 2.471 * 100) / 100,
    squareMeters: Math.round(areaInSquareMeters)
  };
}

// Generate dummy legacy record
function generateDummyRecord(polygon = null) {
  const ownerName = indianNames[Math.floor(Math.random() * indianNames.length)];
  const state = indianStates[Math.floor(Math.random() * indianStates.length)];
  const districts = districtsByState[state] || ['Default District'];
  const district = districts[Math.floor(Math.random() * districts.length)];
  const blocks = blocksByDistrict[district] || ['Default Block'];
  const block = blocks[Math.floor(Math.random() * blocks.length)];
  const villages = villagesByBlock[block] || ['Default Village'];
  const village = villages[Math.floor(Math.random() * villages.length)];
  
  let coordinates, area;
  
  if (polygon) {
    coordinates = polygon.geometry.coordinates;
    area = calculateArea(coordinates);
  } else {
    const [centerLon, centerLat] = generateRandomCoordinates();
    const polygonCoords = generateRandomPolygon(centerLon, centerLat);
    coordinates = [polygonCoords];
    area = calculateArea(coordinates);
  }
  
  const pincode = 100000 + Math.floor(Math.random() * 899999);
  const fullAddress = `${village}, ${block}, ${district}, ${state} - ${pincode}`;
  
  return {
    id: `polygon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ownerName,
    address: {
      village,
      block,
      district,
      state,
      pincode,
      fullAddress
    },
    area,
    coordinates,
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    status: 'digitized',
    type: 'polygon_plot',
    claimType: ['IFR', 'CR', 'CFR'][Math.floor(Math.random() * 3)],
    documentType: 'Legacy Patta',
    verificationStatus: 'pending'
  };
}

// Get all legacy digitized records
router.get('/records', optionalAuth, async (req, res) => {
  try {
    logger.info('Fetching all legacy digitized records');
    
    // Convert to GeoJSON format for FRA Atlas compatibility
    const geojson = {
      type: 'FeatureCollection',
      features: legacyRecords.map(record => ({
        type: 'Feature',
        properties: {
          id: record.id,
          ownerName: record.ownerName,
          address: record.address,
          area: record.area,
          created: record.created,
          lastModified: record.lastModified,
          status: record.status,
          type: record.type,
          claimType: record.claimType,
          documentType: record.documentType,
          verificationStatus: record.verificationStatus
        },
        geometry: {
          type: 'Polygon',
          coordinates: record.coordinates
        }
      }))
    };
    
    res.json({
      success: true,
      data: geojson,
      count: legacyRecords.length
    });
  } catch (error) {
    logger.error('Error fetching legacy records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch legacy records',
      error: error.message
    });
  }
});

// Save new legacy digitized record
router.post('/save-record', authenticateToken, async (req, res) => {
  try {
    const { polygon } = req.body;
    
    if (!polygon || !polygon.geometry || !polygon.geometry.coordinates) {
      return res.status(400).json({
        success: false,
        message: 'Valid polygon geometry is required'
      });
    }
    
    // Generate dummy record with the provided polygon
    const newRecord = generateDummyRecord(polygon);
    
    // Add to storage
    legacyRecords.push(newRecord);
    
    logger.info(`Saved new legacy digitized record: ${newRecord.id}`);
    
    // Return in GeoJSON format
    const geojsonFeature = {
      type: 'Feature',
      properties: {
        id: newRecord.id,
        ownerName: newRecord.ownerName,
        address: newRecord.address,
        area: newRecord.area,
        created: newRecord.created,
        lastModified: newRecord.lastModified,
        status: newRecord.status,
        type: newRecord.type,
        claimType: newRecord.claimType,
        documentType: newRecord.documentType,
        verificationStatus: newRecord.verificationStatus
      },
      geometry: {
        type: 'Polygon',
        coordinates: newRecord.coordinates
      }
    };
    
    res.status(201).json({
      success: true,
      data: geojsonFeature,
      message: 'Legacy record digitized and saved successfully'
    });
  } catch (error) {
    logger.error('Error saving legacy record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save legacy record',
      error: error.message
    });
  }
});

// Generate multiple dummy records for testing
router.post('/generate-dummy', authenticateToken, async (req, res) => {
  try {
    const { count = 5 } = req.body;
    const newRecords = [];
    
    for (let i = 0; i < Math.min(count, 20); i++) {
      const dummyRecord = generateDummyRecord();
      legacyRecords.push(dummyRecord);
      newRecords.push(dummyRecord);
    }
    
    logger.info(`Generated ${newRecords.length} dummy legacy records`);
    
    res.status(201).json({
      success: true,
      data: newRecords,
      message: `Generated ${newRecords.length} dummy legacy records successfully`
    });
  } catch (error) {
    logger.error('Error generating dummy records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate dummy records',
      error: error.message
    });
  }
});

// Delete legacy record
router.delete('/records/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const recordIndex = legacyRecords.findIndex(r => r.id === id);
    if (recordIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Legacy record not found'
      });
    }
    
    legacyRecords.splice(recordIndex, 1);
    
    logger.info(`Deleted legacy record: ${id}`);
    
    res.json({
      success: true,
      message: 'Legacy record deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting legacy record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete legacy record',
      error: error.message
    });
  }
});

// Get statistics
router.get('/statistics', optionalAuth, async (req, res) => {
  try {
    const totalRecords = legacyRecords.length;
    const totalArea = legacyRecords.reduce((sum, r) => sum + (r.area?.hectares || 0), 0);
    
    const byState = legacyRecords.reduce((acc, record) => {
      const state = record.address.state;
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    }, {});
    
    const byClaimType = legacyRecords.reduce((acc, record) => {
      acc[record.claimType] = (acc[record.claimType] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        totalRecords,
        totalArea: Math.round(totalArea * 100) / 100,
        byState,
        byClaimType,
        averageArea: totalRecords > 0 ? Math.round((totalArea / totalRecords) * 100) / 100 : 0
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