const express = require('express');
const multer = require('multer');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });
let documents = {};

router.post('/upload', upload.array('files'), async (req, res) => {
  const processedDocs = req.files.map((file, index) => {
    const docId = `doc_${Date.now()}_${index}`;
    const doc = {
      id: docId,
      filename: file.originalname,
      extractedData: {
        claimantName: `Sample Name ${index + 1}`,
        village: `Village ${index + 1}`,
        district: `District ${index + 1}`,
        area: `${(Math.random() * 5 + 1).toFixed(1)} एकड़`,
        claimType: index % 2 === 0 ? 'IFR' : 'CFR'
      },
      confidence: Math.random() * 0.3 + 0.7,
      status: 'processed'
    };
    documents[docId] = doc;
    return doc;
  });

  res.json({ success: true, documents: processedDocs });
});

router.get('/documents', (req, res) => {
  res.json({ success: true, documents: Object.values(documents) });
});

router.put('/documents/:id', (req, res) => {
  const doc = documents[req.params.id];
  if (!doc) return res.status(404).json({ success: false });
  
  documents[req.params.id] = {
    ...doc,
    extractedData: { ...doc.extractedData, ...req.body.extractedData },
    status: 'edited'
  };
  
  res.json({ success: true, document: documents[req.params.id] });
});

router.post('/documents/:id/plot', (req, res) => {
  const doc = documents[req.params.id];
  if (!doc) return res.status(404).json({ success: false });
  
  documents[req.params.id].status = 'plotted';
  res.json({ success: true, document: documents[req.params.id] });
});

module.exports = router;