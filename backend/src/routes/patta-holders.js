const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { authenticateToken, optionalAuth } = require('../middleware/auth-mock');
const { logger } = require('../utils/logger');

// File path for persistent storage
const DATA_FILE = path.join(__dirname, '../../data/patta-holders.json');

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Load data from file
const loadData = () => {
  try {
    ensureDataDir();
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    logger.error('Error loading patta holders data:', error);
  }
  return [];
};

// Save data to file
const saveData = (data) => {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    logger.error('Error saving patta holders data:', error);
  }
};

// Load existing data on startup
let pattaHolders = loadData();

// Fix existing data with correct districts
const fixExistingData = () => {
  const villageToDistrict = {
    'Greenpur': 'Bhopal',
    'Shivnagar': 'Bhopal', 
    'Raghunathpur': 'Indore',
    'Phulbani': 'Cuttack',
    'Gandacherra': 'West Tripura',
    'Haripur': 'Gwalior',
    'Utnoor': 'Hyderabad',
    'Baripada': 'Cuttack',
    'Khairlanji': 'Bhopal'
  };
  
  pattaHolders.forEach(holder => {
    const correctDistrict = villageToDistrict[holder.address.village];
    if (correctDistrict && holder.address.district !== correctDistrict) {
      holder.address.district = correctDistrict;
      holder.lastModified = new Date().toISOString();
    }
  });
};

// Fix data on startup
setTimeout(fixExistingData, 1000);

// Get all patta holders
router.get('/', optionalAuth, async (req, res) => {
  try {
    // Fix existing data before returning
    fixExistingData();
    
    logger.info('Fetching all patta holders');
    res.json({
      success: true,
      data: pattaHolders,
      count: pattaHolders.length
    });
  } catch (error) {
    logger.error('Error fetching patta holders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patta holders',
      error: error.message
    });
  }
});

// Create new patta holder
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      id,
      ownerName,
      fatherName,
      address,
      landDetails,
      coordinates,
      geometry,
      created,
      lastModified
    } = req.body;

    // Validate required fields
    if (!ownerName || !address || !landDetails) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: ownerName, address, landDetails'
      });
    }

    const newPattaHolder = {
      id: id || `patta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ownerName,
      fatherName: fatherName || 'N/A',
      address: {
        village: address.village || '',
        block: address.block || '',
        district: address.district || '',
        state: address.state || '',
        pincode: address.pincode || 0,
        fullAddress: address.fullAddress || ''
      },
      landDetails: {
        surveyNo: landDetails.surveyNo || '',
        khasra: landDetails.khasra || '',
        area: {
          hectares: landDetails.area?.hectares || 0,
          acres: landDetails.area?.acres || 0,
          squareMeters: landDetails.area?.squareMeters || 0
        },
        classification: landDetails.classification || 'Forest Land',
        fraStatus: landDetails.fraStatus || 'Pending'
      },
      coordinates: coordinates || [],
      geometry: geometry || null,
      created: created || new Date().toISOString(),
      lastModified: lastModified || new Date().toISOString(),
      createdBy: req.user?.id || 'system',
      status: 'active'
    };

    pattaHolders.push(newPattaHolder);
    saveData(pattaHolders);
    
    // Also save to geojson-plot layers for "Uploaded Data" list
    try {
      const { saveLayerInternal } = require('./geojson-plot');
      const geoJsonData = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {
            id: newPattaHolder.id,
            ownerName: newPattaHolder.ownerName,
            fatherName: newPattaHolder.fatherName,
            village: newPattaHolder.address.village,
            district: newPattaHolder.address.district,
            state: newPattaHolder.address.state,
            area: newPattaHolder.landDetails.area.hectares,
            surveyNo: newPattaHolder.landDetails.surveyNo,
            khasra: newPattaHolder.landDetails.khasra,
            classification: newPattaHolder.landDetails.classification,
            fraStatus: newPattaHolder.landDetails.fraStatus,
            type: 'patta_holder'
          },
          geometry: newPattaHolder.geometry || {
            type: 'Point',
            coordinates: newPattaHolder.coordinates && newPattaHolder.coordinates.length > 0 
              ? [newPattaHolder.coordinates[0][0], newPattaHolder.coordinates[0][1]]
              : [0, 0]
          }
        }]
      };
      
      await saveLayerInternal(
        `Patta: ${newPattaHolder.ownerName}`,
        geoJsonData,
        {
          strokeColor: '#ff9800',
          strokeWidth: 2,
          strokeOpacity: 1,
          fillColor: '#ffb74d',
          fillOpacity: 0.4
        }
      );
    } catch (error) {
      logger.warn('Failed to save to geojson layers:', error.message);
    }
    
    logger.info(`Created new patta holder: ${newPattaHolder.id} - ${newPattaHolder.ownerName}`);
    
    res.status(201).json({
      success: true,
      data: newPattaHolder,
      message: 'Patta holder created successfully'
    });
  } catch (error) {
    logger.error('Error creating patta holder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create patta holder',
      error: error.message
    });
  }
});

// Get patta holder by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const pattaHolder = pattaHolders.find(p => p.id === id);
    
    if (!pattaHolder) {
      return res.status(404).json({
        success: false,
        message: 'Patta holder not found'
      });
    }

    res.json({
      success: true,
      data: pattaHolder
    });
  } catch (error) {
    logger.error('Error fetching patta holder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patta holder',
      error: error.message
    });
  }
});

// Update patta holder
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const pattaIndex = pattaHolders.findIndex(p => p.id === id);
    if (pattaIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Patta holder not found'
      });
    }

    // Update the record
    pattaHolders[pattaIndex] = {
      ...pattaHolders[pattaIndex],
      ...updateData,
      lastModified: new Date().toISOString()
    };
    saveData(pattaHolders);

    logger.info(`Updated patta holder: ${id}`);
    
    res.json({
      success: true,
      data: pattaHolders[pattaIndex],
      message: 'Patta holder updated successfully'
    });
  } catch (error) {
    logger.error('Error updating patta holder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update patta holder',
      error: error.message
    });
  }
});

// Delete patta holder
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const pattaIndex = pattaHolders.findIndex(p => p.id === id);
    if (pattaIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Patta holder not found'
      });
    }

    const deletedPatta = pattaHolders.splice(pattaIndex, 1)[0];
    saveData(pattaHolders);
    
    logger.info(`Deleted patta holder: ${id} - ${deletedPatta.ownerName}`);
    
    res.json({
      success: true,
      message: 'Patta holder deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting patta holder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete patta holder',
      error: error.message
    });
  }
});

// Get patta holders as GeoJSON for FRA Atlas
router.get('/geojson/all', optionalAuth, async (req, res) => {
  try {
    const { state, district, village, fraStatus } = req.query;
    
    let filteredData = pattaHolders;
    
    // Apply filters
    if (state) {
      filteredData = filteredData.filter(p => p.address.state === state);
    }
    if (district) {
      filteredData = filteredData.filter(p => p.address.district === district);
    }
    if (village) {
      filteredData = filteredData.filter(p => p.address.village === village);
    }
    if (fraStatus) {
      filteredData = filteredData.filter(p => p.landDetails.fraStatus === fraStatus);
    }

    const geojson = {
      type: 'FeatureCollection',
      features: filteredData.map(patta => ({
        type: 'Feature',
        properties: {
          id: patta.id,
          ownerName: patta.ownerName,
          fatherName: patta.fatherName,
          village: patta.address.village,
          block: patta.address.block,
          district: patta.address.district,
          state: patta.address.state,
          surveyNo: patta.landDetails.surveyNo,
          khasra: patta.landDetails.khasra,
          area: patta.landDetails.area.hectares,
          classification: patta.landDetails.classification,
          fraStatus: patta.landDetails.fraStatus,
          created: patta.created,
          lastModified: patta.lastModified,
          type: 'patta_holder'
        },
        geometry: patta.geometry || {
          type: 'Point',
          coordinates: patta.coordinates && patta.coordinates.length > 0 
            ? [patta.coordinates[0][0], patta.coordinates[0][1]]
            : [0, 0]
        }
      }))
    };

    logger.info(`Fetched ${filteredData.length} patta holders as GeoJSON`);
    
    res.json({
      success: true,
      data: geojson,
      count: filteredData.length
    });
  } catch (error) {
    logger.error('Error fetching patta holders GeoJSON:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patta holders GeoJSON',
      error: error.message
    });
  }
});

// Get statistics
router.get('/stats/summary', optionalAuth, async (req, res) => {
  try {
    const totalHolders = pattaHolders.length;
    const totalArea = pattaHolders.reduce((sum, p) => sum + (p.landDetails.area.hectares || 0), 0);
    
    const stateStats = pattaHolders.reduce((acc, patta) => {
      acc[patta.address.state] = (acc[patta.address.state] || 0) + 1;
      return acc;
    }, {});

    const fraStatusStats = pattaHolders.reduce((acc, patta) => {
      acc[patta.landDetails.fraStatus] = (acc[patta.landDetails.fraStatus] || 0) + 1;
      return acc;
    }, {});

    const classificationStats = pattaHolders.reduce((acc, patta) => {
      acc[patta.landDetails.classification] = (acc[patta.landDetails.classification] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalHolders,
        totalArea: parseFloat(totalArea.toFixed(2)),
        stateStats,
        fraStatusStats,
        classificationStats,
        averageArea: totalHolders > 0 ? parseFloat((totalArea / totalHolders).toFixed(2)) : 0
      }
    });
  } catch (error) {
    logger.error('Error fetching patta holder statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// Bulk create patta holders
router.post('/bulk', authenticateToken, async (req, res) => {
  try {
    const { pattaHolders: newHolders } = req.body;

    if (!Array.isArray(newHolders) || newHolders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data: expected array of patta holders'
      });
    }

    const createdHolders = [];
    
    for (const holder of newHolders) {
      const newPattaHolder = {
        id: holder.id || `patta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ownerName: holder.ownerName || 'Unknown',
        fatherName: holder.fatherName || 'N/A',
        address: holder.address || {},
        landDetails: holder.landDetails || {},
        coordinates: holder.coordinates || [],
        geometry: holder.geometry || null,
        created: holder.created || new Date().toISOString(),
        lastModified: holder.lastModified || new Date().toISOString(),
        createdBy: req.user?.id || 'system',
        status: 'active'
      };
      
      pattaHolders.push(newPattaHolder);
      createdHolders.push(newPattaHolder);
    }

    saveData(pattaHolders);
    logger.info(`Bulk created ${createdHolders.length} patta holders`);
    
    res.status(201).json({
      success: true,
      data: createdHolders,
      count: createdHolders.length,
      message: `Successfully created ${createdHolders.length} patta holders`
    });
  } catch (error) {
    logger.error('Error bulk creating patta holders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk create patta holders',
      error: error.message
    });
  }
});

module.exports = router;