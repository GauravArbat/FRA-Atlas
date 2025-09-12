const express = require('express');
const multer = require('multer');
const { logger } = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();
const { addLayer } = require('../utils/layersStore');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/pdf-processor/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Ensure upload directory exists
const ensureUploadDir = async () => {
  try {
    await fs.mkdir('uploads/pdf-processor/', { recursive: true });
  } catch (error) {
    logger.error('Error creating upload directory:', error);
  }
};

// Mock PDF text extraction (in real implementation, use pdf-parse or similar)
const extractTextFromPDF = async (filePath) => {
  // This is a mock implementation
  // In production, you would use a library like pdf-parse
  const mockText = `
    FOREST RIGHTS ACT CLAIM FORM
    
    Claimant Name: Rajesh Kumar Singh
    Father's Name: Late Ram Singh
    Address: Village Greenpur, Tehsil Madanpur, District Shivnagar
    Village: Greenpur
    Gram Panchayat: Greenpur Panchayat
    Tehsil: Madanpur
    District: Shivnagar
    State: Madhya Pradesh
    
    Land Details:
    Khasra Number: 45/2
    Area: 1.25 hectares
    Coordinates: 78.1234, 23.5678
    Additional Coordinates: 78.1245, 23.5689, 78.1256, 23.5700
    
    Nature of Claim:
    - Individual Forest Rights
    - Land for habitation: 0.25 hectares
    - Land for cultivation: 1.0 hectares
    
    Evidence Submitted:
    - Old revenue records
    - Gram Sabha resolution
    - Elders testimony
    
    Date of Application: 15/01/2024
    Signature: Rajesh Kumar Singh
  `;
  
  return mockText;
};

// Extract personal information from text
const extractPersonalInfo = (text) => {
  const info = {};
  
  // Extract name
  const nameMatch = text.match(/Claimant Name:\s*([^\n]+)/i);
  if (nameMatch) info.name = nameMatch[1].trim();
  
  // Extract father's name
  const fatherMatch = text.match(/Father['']?s Name:\s*([^\n]+)/i);
  if (fatherMatch) info.fatherName = fatherMatch[1].trim();
  
  // Extract address
  const addressMatch = text.match(/Address:\s*([^\n]+)/i);
  if (addressMatch) info.address = addressMatch[1].trim();
  
  // Extract village
  const villageMatch = text.match(/Village:\s*([^\n]+)/i);
  if (villageMatch) info.village = villageMatch[1].trim();
  
  // Extract gram panchayat
  const panchayatMatch = text.match(/Gram Panchayat:\s*([^\n]+)/i);
  if (panchayatMatch) info.gramPanchayat = panchayatMatch[1].trim();
  
  // Extract tehsil
  const tehsilMatch = text.match(/Tehsil:\s*([^\n]+)/i);
  if (tehsilMatch) info.tehsil = tehsilMatch[1].trim();
  
  // Extract district
  const districtMatch = text.match(/District:\s*([^\n]+)/i);
  if (districtMatch) info.district = districtMatch[1].trim();
  
  // Extract state
  const stateMatch = text.match(/State:\s*([^\n]+)/i);
  if (stateMatch) info.state = stateMatch[1].trim();
  
  // Extract khasra number
  const khasraMatch = text.match(/Khasra Number:\s*([^\n]+)/i);
  if (khasraMatch) info.khasraNumber = khasraMatch[1].trim();
  
  // Extract area
  const areaMatch = text.match(/Area:\s*([^\n]+)/i);
  if (areaMatch) info.area = areaMatch[1].trim();
  
  // Extract date
  const dateMatch = text.match(/Date of Application:\s*([^\n]+)/i);
  if (dateMatch) info.applicationDate = dateMatch[1].trim();
  
  return info;
};

// Extract coordinates from text
const extractCoordinates = (text) => {
  const coordinates = [];
  
  // Find coordinate patterns (decimal degrees)
  const coordPattern = /(\d+\.\d+),\s*(\d+\.\d+)/g;
  let match;
  
  while ((match = coordPattern.exec(text)) !== null) {
    const lng = parseFloat(match[1]);
    const lat = parseFloat(match[2]);
    
    // Basic validation for Indian coordinates
    if (lng >= 68 && lng <= 97 && lat >= 6 && lat <= 37) {
      coordinates.push([lng, lat]);
    }
  }
  
  return coordinates;
};

// Convert coordinates to GeoJSON
const createGeoJSONFromCoordinates = (coordinates, personalInfo) => {
  if (coordinates.length < 3) {
    // If less than 3 coordinates, create a point
    return {
      type: 'Feature',
      properties: {
        name: personalInfo.name || 'Unknown',
        fatherName: personalInfo.fatherName || '',
        address: personalInfo.address || '',
        village: personalInfo.village || '',
        gramPanchayat: personalInfo.gramPanchayat || '',
        tehsil: personalInfo.tehsil || '',
        district: personalInfo.district || '',
        state: personalInfo.state || '',
        khasraNumber: personalInfo.khasraNumber || '',
        area: personalInfo.area || '',
        applicationDate: personalInfo.applicationDate || '',
        extractedFrom: 'PDF Upload',
        extractedAt: new Date().toISOString()
      },
      geometry: {
        type: 'Point',
        coordinates: coordinates[0] || [0, 0]
      }
    };
  } else {
    // Create a polygon from coordinates
    // Ensure the polygon is closed
    const closedCoordinates = [...coordinates];
    if (closedCoordinates[0][0] !== closedCoordinates[closedCoordinates.length - 1][0] ||
        closedCoordinates[0][1] !== closedCoordinates[closedCoordinates.length - 1][1]) {
      closedCoordinates.push(closedCoordinates[0]);
    }
    
    return {
      type: 'Feature',
      properties: {
        name: personalInfo.name || 'Unknown',
        fatherName: personalInfo.fatherName || '',
        address: personalInfo.address || '',
        village: personalInfo.village || '',
        gramPanchayat: personalInfo.gramPanchayat || '',
        tehsil: personalInfo.tehsil || '',
        district: personalInfo.district || '',
        state: personalInfo.state || '',
        khasraNumber: personalInfo.khasraNumber || '',
        area: personalInfo.area || '',
        applicationDate: personalInfo.applicationDate || '',
        extractedFrom: 'PDF Upload',
        extractedAt: new Date().toISOString()
      },
      geometry: {
        type: 'Polygon',
        coordinates: [closedCoordinates]
      }
    };
  }
};

// Process PDF and extract data
router.post('/process-pdf', upload.single('pdf'), async (req, res) => {
  try {
    await ensureUploadDir();
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file uploaded'
      });
    }
    
    logger.info('PDF processing started', {
      filename: req.file.originalname,
      size: req.file.size
    });
    
    // Extract text from PDF
    const extractedText = await extractTextFromPDF(req.file.path);
    
    // Extract personal information
    const personalInfo = extractPersonalInfo(extractedText);
    
    // Extract coordinates
    const coordinates = extractCoordinates(extractedText);
    
    // Create GeoJSON
    const geoJSONFeature = createGeoJSONFromCoordinates(coordinates, personalInfo);
    
    // Create FeatureCollection
    const geoJSONData = {
      type: 'FeatureCollection',
      name: `Extracted Data - ${personalInfo.name || 'Unknown'}`,
      features: [geoJSONFeature]
    };
    
    // Clean up uploaded file
    try {
      await fs.unlink(req.file.path);
    } catch (error) {
      logger.warn('Could not delete uploaded file:', error);
    }
    
    logger.info('PDF processing completed', {
      extractedInfo: Object.keys(personalInfo).length,
      coordinatesFound: coordinates.length,
      hasGeometry: geoJSONFeature.geometry.type !== 'Point' || coordinates.length > 0
    });
    
    res.json({
      success: true,
      data: {
        personalInfo,
        coordinates,
        geoJSON: geoJSONData,
        extractedText: extractedText.substring(0, 500) + '...' // First 500 chars for preview
      },
      message: 'PDF processed successfully'
    });
    
  } catch (error) {
    logger.error('Error processing PDF:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        logger.warn('Could not delete uploaded file after error:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to process PDF'
    });
  }
});

// Get all processed data
router.get('/processed-data', async (req, res) => {
  try {
    // In a real implementation, this would fetch from database
    const mockProcessedData = [
      {
        id: '1',
        name: 'Rajesh Kumar Singh',
        village: 'Greenpur',
        district: 'Shivnagar',
        area: '1.25 hectares',
        applicationDate: '15/01/2024',
        personalInfo: {
          name: 'Rajesh Kumar Singh',
          village: 'Greenpur',
          district: 'Shivnagar',
          area: '1.25 hectares',
          applicationDate: '15/01/2024'
        },
        geoJSON: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: {
              name: 'Rajesh Kumar Singh',
              village: 'Greenpur',
              district: 'Shivnagar'
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [78.1234, 23.5678],
                [78.1245, 23.5689],
                [78.1256, 23.5700],
                [78.1234, 23.5678]
              ]]
            }
          }]
        },
        processedAt: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      data: mockProcessedData,
      message: 'Processed data retrieved successfully'
    });
    
  } catch (error) {
    logger.error('Error fetching processed data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch processed data'
    });
  }
});

// Save processed data to GeoJSON layers
router.post('/save-to-layers', async (req, res) => {
  try {
    const { geoJSON, personalInfo } = req.body;
    
    if (!geoJSON || !personalInfo) {
      return res.status(400).json({
        success: false,
        error: 'GeoJSON data and personal info are required'
      });
    }
    
    // Generate unique layer ID
    const layerId = `pdf-layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const layerData = {
      id: layerId,
      name: `${personalInfo.name} - ${personalInfo.village}`,
      data: geoJSON,
      style: {
        fillColor: '#4caf50',
        strokeColor: '#2e7d32',
        strokeWidth: 2,
        fillOpacity: 0.6,
        strokeOpacity: 1.0,
        visible: true
      },
      source: 'PDF Upload',
      personalInfo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    addLayer(layerData);

    logger.info('PDF data saved to layers', {
      layerId,
      name: personalInfo.name,
      village: personalInfo.village
    });
    
    res.json({
      success: true,
      data: layerData,
      message: 'Data saved to map layers successfully'
    });
    
  } catch (error) {
    logger.error('Error saving PDF data to layers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save data to layers'
    });
  }
});

module.exports = router;
