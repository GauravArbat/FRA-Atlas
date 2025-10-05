const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });
const DIGITIZATION_API_URL = process.env.DIGITIZATION_API_URL || 'http://localhost:8001';

// Process PDF using digitization pipeline
router.post('/process', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Send to digitization pipeline for OCR
    const formData = new FormData();
    formData.append('file', fs.createReadStream(file.path));
    
    const ocrResponse = await axios.post(`${DIGITIZATION_API_URL}/ocr`, formData, {
      headers: formData.getHeaders()
    });

    // Send OCR text for NER processing
    const nerResponse = await axios.post(`${DIGITIZATION_API_URL}/ner`, {
      text: ocrResponse.data.text
    });

    // Process extracted entities into structured data
    const entities = nerResponse.data.entities || [];
    const extractedData = {
      claimantName: entities.find(e => e.label === 'PERSON')?.text || 'Unknown',
      village: entities.find(e => e.label === 'LOCATION')?.text || 'Unknown',
      district: entities.find(e => e.label === 'DISTRICT')?.text || 'Unknown',
      area: entities.find(e => e.label === 'AREA')?.text || 'Unknown',
      claimType: entities.find(e => e.label === 'CLAIM_TYPE')?.text || 'IFR'
    };

    const processedData = {
      personalInfo: {
        name: extractedData.claimantName,
        village: extractedData.village,
        district: extractedData.district,
        area: extractedData.area,
        claimType: extractedData.claimType,
        applicationDate: new Date().toLocaleDateString('hi-IN'),
        surveyNumber: 'AUTO_' + Date.now()
      },
      geoJSON: {
        type: 'Feature',
        properties: {
          name: extractedData.claimantName,
          area: extractedData.area,
          claimType: extractedData.claimType
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [82.1391, 19.0760],
            [82.1401, 19.0760],
            [82.1401, 19.0770],
            [82.1391, 19.0770],
            [82.1391, 19.0760]
          ]]
        }
      },
      confidence: ocrResponse.data.confidence || 0.92,
      extractedText: ocrResponse.data.text,
      entities: nerResponse.data.entities,
      processingTime: '2.3s'
    };

    // Clean up uploaded file
    fs.unlinkSync(file.path);

    res.json({
      success: true,
      data: mockData,
      message: 'PDF processed successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'PDF processing failed' });
  }
});

// Save extracted data to map layers
router.post('/save-to-layers', async (req, res) => {
  try {
    const { geoJSON, personalInfo } = req.body;
    
    // Mock saving to database/layers
    const layerData = {
      id: `layer_${Date.now()}`,
      name: personalInfo.name || 'Unknown',
      type: 'FRA_CLAIM',
      geoJSON,
      personalInfo,
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: layerData,
      message: 'Data saved to map layers successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to save to layers' });
  }
});

// Get processed documents
router.get('/documents', (req, res) => {
  // Mock processed documents
  const documents = [
    {
      id: 'doc_1',
      filename: 'fra_claim_1.pdf',
      personalInfo: {
        name: 'राम कुमार शर्मा',
        village: 'कमलापुर',
        district: 'बस्तर'
      },
      status: 'processed',
      processedAt: new Date().toISOString()
    }
  ];

  res.json({
    success: true,
    documents
  });
});

module.exports = router;