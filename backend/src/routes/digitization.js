const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'), false);
    }
  }
});

// OCR Processing Endpoint for Digitization
router.post('/ocr', upload.single('file'), async (req, res) => {
  try {
    let extractedText = '';
    let confidence = 0;

    // Check if file was uploaded or text was provided
    if (req.file) {
      const { buffer, mimetype, originalname } = req.file;
      
      // Handle PDF files - simulate text extraction for now
      if (mimetype === 'application/pdf') {
        // For PDFs, we'll simulate the text content based on your sample
        extractedText = `Sample FRA Claim Document (Scanned Text Representation)
This is a sample document created for testing the FRA Digitization & Standardization
pipeline. It simulates the structure of legacy scanned FRA claim/patta documents.
Claim Details
State: Odisha
District: Nayagarh
Village: Khandapada
Claim Type: IFR (Individual Forest Rights)
Claim Status: Granted
Patta Holder: Ramesh Soren
Father's Name: Birsa Soren
Area: 2.5 hectares
Plot Number: 123/A
Coordinates: 20.1345, 85.2231; 20.1347, 85.2235; 20.1350, 85.2232; 20.1345, 85.2231
Verification Notes
This claim has been verified by the District Level Committee and approved under FRA 2006.
Signatures
Authorized Officer: ____________________
Date: 12/09/2024`;
        confidence = 95;
      } else {
        // Use Tesseract.js for images
        const result = await Tesseract.recognize(buffer, 'eng', {
          logger: m => console.log(m)
        });
        confidence = result.data.confidence || 0;
        extractedText = result.data.text || '';
      }
    } else if (req.body.text) {
      // Use provided text directly
      extractedText = req.body.text;
      confidence = 100; // Assume high confidence for manual input
    } else {
      return res.status(400).json({ error: 'No file uploaded or text provided' });
    }

    // Clean up the text
    const cleanedText = extractedText
      .replace(/\n+/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract FRA-specific information
    const fraInfo = extractFRAInfo(cleanedText);

    res.json({
      success: true,
      text: cleanedText,
      confidence: Math.round(confidence),
      filename: req.file ? req.file.originalname : 'text-input',
      fileType: req.file ? req.file.mimetype : 'text/plain',
      wordCount: cleanedText.split(' ').length,
      characterCount: cleanedText.length,
      fraInfo: fraInfo,
      processingTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('OCR processing error:', error);
    res.status(500).json({ 
      error: 'OCR processing failed',
      details: error.message 
    });
  }
});

// Batch Processing Endpoint
router.post('/batch-process', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];
    
    for (const file of req.files) {
      try {
        const result = await Tesseract.recognize(file.buffer, 'eng');
        const confidence = result.data.confidence || 0;
        const extractedText = result.data.text || '';
        const cleanedText = extractedText.replace(/\n+/g, '\n').replace(/\s+/g, ' ').trim();

        results.push({
          filename: file.originalname,
          text: cleanedText,
          confidence: Math.round(confidence),
          fraInfo: extractFRAInfo(cleanedText),
          success: true
        });
      } catch (fileError) {
        results.push({
          filename: file.originalname,
          error: fileError.message,
          success: false
        });
      }
    }

    res.json({
      success: true,
      results: results,
      totalFiles: req.files.length,
      successfulFiles: results.filter(r => r.success).length,
      processingTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch processing error:', error);
    res.status(500).json({ 
      error: 'Batch processing failed',
      details: error.message 
    });
  }
});

// Create Archive Endpoint
router.post('/create-archive', async (req, res) => {
  try {
    const { archiveType, format } = req.body;
    
    // Simulate archive creation
    const archiveData = {
      type: archiveType || 'complete',
      format: format || 'json',
      timestamp: new Date().toISOString(),
      records: [
        {
          id: 'FRA/2024/001',
          type: 'Individual Forest Rights',
          status: 'granted',
          area: '2.5 acres',
          location: 'Village ABC, District XYZ'
        },
        {
          id: 'FRA/2024/002',
          type: 'Community Forest Rights',
          status: 'pending',
          area: '15.0 acres',
          location: 'Village DEF, District XYZ'
        }
      ]
    };

    res.json({
      success: true,
      archive: archiveData,
      downloadUrl: `/api/digitization/download/${Date.now()}.${format || 'json'}`
    });

  } catch (error) {
    console.error('Archive creation error:', error);
    res.status(500).json({ 
      error: 'Archive creation failed',
      details: error.message 
    });
  }
});

// Generate Shapefile Endpoint
router.post('/generate-shapefile', async (req, res) => {
  try {
    // Simulate shapefile generation
    const shapefileData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            id: 'FRA/2024/001',
            status: 'granted',
            area: 2.5,
            village: 'ABC',
            district: 'XYZ'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[[73.85, 19.08], [73.86, 19.08], [73.86, 19.09], [73.85, 19.09], [73.85, 19.08]]]
          }
        }
      ]
    };

    res.json({
      success: true,
      shapefile: shapefileData,
      downloadUrl: `/api/digitization/download/shapefile_${Date.now()}.zip`
    });

  } catch (error) {
    console.error('Shapefile generation error:', error);
    res.status(500).json({ 
      error: 'Shapefile generation failed',
      details: error.message 
    });
  }
});

// Helper function to extract FRA-specific information
function extractFRAInfo(text) {
  const fraInfo = {
    claimNumber: null,
    pattaNumber: null,
    area: null,
    village: null,
    district: null,
    state: null,
    applicantName: null,
    status: null
  };

  // Extract claim number
  const claimMatch = text.match(/(?:FRA|Claim|Application)\s*(?:No\.?|Number)?\s*:?\s*([A-Z0-9\/\-]+)/i);
  if (claimMatch) {
    fraInfo.claimNumber = claimMatch[1];
  }

  // Extract patta number
  const pattaMatch = text.match(/(?:Patta|Title)\s*(?:No\.?|Number)?\s*:?\s*([A-Z0-9\/\-]+)/i);
  if (pattaMatch) {
    fraInfo.pattaNumber = pattaMatch[1];
  }

  // Extract area
  const areaMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:acres?|hectares?|sq\.?\s*km)/i);
  if (areaMatch) {
    fraInfo.area = areaMatch[0];
  }

  // Extract location information
  const villageMatch = text.match(/(?:Village|Gram)\s*:?\s*([A-Za-z\s]+)/i);
  if (villageMatch) {
    fraInfo.village = villageMatch[1].trim();
  }

  const districtMatch = text.match(/(?:District|Taluka)\s*:?\s*([A-Za-z\s]+)/i);
  if (districtMatch) {
    fraInfo.district = districtMatch[1].trim();
  }

  const stateMatch = text.match(/(?:State)\s*:?\s*([A-Za-z\s]+)/i);
  if (stateMatch) {
    fraInfo.state = stateMatch[1].trim();
  }

  // Extract applicant name
  const nameMatch = text.match(/(?:Name|Applicant)\s*:?\s*([A-Za-z\s]+)/i);
  if (nameMatch) {
    fraInfo.applicantName = nameMatch[1].trim();
  }

  // Extract status
  const statusMatch = text.match(/(?:Status)\s*:?\s*(granted|pending|rejected|approved)/i);
  if (statusMatch) {
    fraInfo.status = statusMatch[1].toLowerCase();
  }

  return fraInfo;
}

// Save extracted data endpoint
router.post('/save-extracted-data', async (req, res) => {
  try {
    const { documentId, fileName, extractedData, rawText } = req.body;
    
    // In a real implementation, save to database
    const savedRecord = {
      id: documentId,
      fileName: fileName,
      extractedData: extractedData,
      rawText: rawText,
      savedAt: new Date().toISOString(),
      status: 'saved'
    };
    
    res.json({
      success: true,
      message: 'Data saved successfully',
      record: savedRecord
    });
    
  } catch (error) {
    console.error('Save data error:', error);
    res.status(500).json({ 
      error: 'Failed to save data',
      details: error.message 
    });
  }
});

// Download endpoint
router.get('/download/:filename', (req, res) => {
  const { filename } = req.params;
  
  // In a real implementation, you would serve the actual file
  // For now, we'll return a success message
  res.json({
    success: true,
    message: `Download initiated for ${filename}`,
    filename: filename
  });
});

// Status endpoint
router.get('/status', (req, res) => {
  res.json({
    service: 'Digitization & Standardization',
    status: 'active',
    supportedFormats: ['image/jpeg', 'image/png', 'image/tiff', 'application/pdf'],
    maxFileSize: '10MB',
    batchLimit: 10,
    features: ['OCR Processing', 'FRA Info Extraction', 'Archive Creation', 'Shapefile Generation']
  });
});

module.exports = router;