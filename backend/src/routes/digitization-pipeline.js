const express = require('express');
const { logger } = require('../utils/logger');

const router = express.Router();

// Mock digitization pipeline endpoints
router.post('/upload', async (req, res) => {
  try {
    const documentId = `doc_${Date.now()}`;
    res.json({
      document_id: documentId,
      status: "completed",
      message: "Document processed successfully",
      metadata: {
        document_id: documentId,
        state: req.body.state || "Unknown",
        district: req.body.district || "Unknown",
        ocr_confidence: 0.92,
        ner_confidence: 0.88
      }
    });
  } catch (error) {
    logger.error('Digitization upload failed:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.post('/batch-upload', async (req, res) => {
  try {
    const documentIds = Array.from({length: 3}, (_, i) => `doc_${Date.now()}_${i}`);
    res.json({
      batch_id: `batch_${Date.now()}`,
      document_ids: documentIds,
      status: "completed",
      count: documentIds.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Batch upload failed' });
  }
});

router.get('/status/:documentId', async (req, res) => {
  res.json({
    document_id: req.params.documentId,
    status: "completed",
    created_at: new Date().toISOString()
  });
});

router.get('/export/:format', async (req, res) => {
  const format = req.params.format;
  if (format === 'geojson') {
    res.json({
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: { name: "Sample FRA Record" },
        geometry: { type: "Point", coordinates: [77.1234, 28.5678] }
      }]
    });
  } else {
    res.json({ documents: [{ id: "sample", status: "processed" }] });
  }
});

module.exports = router;